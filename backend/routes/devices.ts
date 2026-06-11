import { Router, Request, Response, NextFunction } from "express";
import { z }      from "zod";
import { Device, Ping, TheftReport, Partner } from "../db/index.js";
import { authenticate, requireAdmin }  from "../middleware/auth.js";
import { computeRiskScore }            from "../services/intelligence.js";

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
}

// GET /api/devices — list devices owned by current user (admin sees all)
router.get("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter  = req.user!.role === "admin" ? {} : { owner: req.user!.id };
    const devices = await Device.find(filter)
      .populate("owner", "name email")
      .sort({ lastSeen: -1 });
    res.json(devices);
  } catch (err) { next(err); }
});

// GET /api/devices/public-stats — public homepage stats (no auth required)
// ⚠️  MUST be before /:id or "public-stats" gets matched as an id
router.get("/public-stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, recovered, recentPings, openReports, telecomPartners] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ status: "recovered" }),
      Ping.countDocuments({ ts: { $gte: new Date(Date.now() - 24 * 3600000) } }),
      TheftReport.countDocuments({ status: "open" }),
      Partner.countDocuments({ orgType: "telecom", status: "active" }),
    ]);
    res.json({ total, recovered, recentPings, openReports, telecomPartners });
  } catch (err) { next(err); }
});

// GET /api/devices/stats — admin dashboard stats
// ⚠️  MUST be before /:id or "stats" gets matched as an id
router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [total, stolen, recovered, blacklisted, recentPings, openReports] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ status: "stolen" }),
      Device.countDocuments({ status: "recovered" }),
      Device.countDocuments({ status: "blacklisted" }),
      Ping.countDocuments({ ts: { $gte: new Date(Date.now() - 24 * 3600000) } }),
      TheftReport.countDocuments({ status: "open" }),
    ]);
    res.json({ total, stolen, recovered, blacklisted, recentPings, openReports });
  } catch (err) { next(err); }
});

// PATCH /api/devices/bulk-status — admin bulk status update
// ⚠️  MUST be before /:id
router.patch("/bulk-status", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ids, status } = z.object({
      ids:    z.array(z.string()).min(1).max(100),
      status: z.enum(["active","stolen","blacklisted","recovered"]),
    }).parse(req.body);

    const result = await Device.updateMany({ _id: { $in: ids } }, { status });
    res.json({ updated: result.modifiedCount, status });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/devices/:id — single device detail with riskScore, lastPings, reports
router.get("/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const device = await Device.findById(req.params.id).populate("owner", "name email");
    if (!device) return res.status(404).json({ error: "Device not found" });

    const isOwner = (device.owner as any)?._id?.toString() === req.user!.id;
    if (!isOwner && req.user!.role !== "admin" && req.user!.role !== "law_enforcement") {
      return res.status(403).json({ error: "Access denied" });
    }

    const [riskScore, lastPings, reports] = await Promise.all([
      computeRiskScore(device.imei),
      Ping.find({ imei: device.imei })
        .sort({ ts: -1 }).limit(20)
        .select("lat lng ts simIccid networkOp verified imageUrl"),
      TheftReport.find({ imei: device.imei }).sort({ createdAt: -1 }),
    ]);

    res.json({ ...device.toObject(), riskScore, lastPings, reports });
  } catch (err) { next(err); }
});

// DELETE /api/devices/:id — remove a device (owner or admin)
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ error: "Device not found" });

    const isOwner = device.owner?.toString() === req.user!.id;
    if (!isOwner && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    await device.deleteOne();
    res.json({ message: "Device removed" });
  } catch (err) { next(err); }
});

// GET /api/devices/:id/evidence — photos captured by the mobile agent
router.get("/:id/evidence", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const device = await Device.findById(req.params.id).lean();
    if (!device) return res.status(404).json({ error: "Device not found" });

    const isOwner = device.owner?.toString() === req.user!.id;
    if (!isOwner && req.user!.role !== "admin" && req.user!.role !== "law_enforcement") {
      return res.status(403).json({ error: "Access denied" });
    }

    const evidencePings = await Ping.find({
      imei:     device.imei,
      imageUrl: { $exists: true, $ne: null },
    }).sort({ ts: -1 }).limit(50).select("lat lng ts imageUrl networkOp").lean();

    res.json({
      evidence: evidencePings.map(p => ({
        lat:        p.lat,
        lng:        p.lng,
        capturedAt: p.ts,
        imageUrl:   p.imageUrl,
        networkOp:  p.networkOp,
      })),
    });
  } catch (err) { next(err); }
});

export default router;
