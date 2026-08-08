import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { User, Subscription, Device } from "../db/index.js";
import { getDeviceFeeConfig, updateDeviceFeeConfig } from "../services/billing.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// GET /api/admin/config/device-fee
router.get("/config/device-fee", authenticate, requireAdmin, (_req: AuthRequest, res: Response) => {
  const config = getDeviceFeeConfig();
  res.json(config);
});

// POST & PUT & PATCH /api/admin/config/device-fee
const updateDeviceFeeHandler = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const usd = Number(req.body.additionalDeviceMonthlyFeeUSD ?? req.body.extraDeviceFeeUSD ?? req.body.usd ?? 2.0);
    const kes = Number(req.body.additionalDeviceMonthlyFeeKES ?? req.body.extraDeviceFeeKES ?? req.body.kes ?? Math.round(usd * 130));

    if (isNaN(usd) || usd < 0) {
      return res.status(400).json({ error: "Invalid USD fee value" });
    }

    const updated = updateDeviceFeeConfig(usd, kes);
    res.json({
      success: true,
      ...updated,
    });
  } catch (err) {
    next(err);
  }
};

router.post("/config/device-fee", authenticate, requireAdmin, updateDeviceFeeHandler);
router.put("/config/device-fee", authenticate, requireAdmin, updateDeviceFeeHandler);
router.patch("/config/device-fee", authenticate, requireAdmin, updateDeviceFeeHandler);

// DELETE /api/admin/config/device-fee
router.delete("/config/device-fee", authenticate, requireAdmin, (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = updateDeviceFeeConfig(0, 0);
    res.json({
      success: true,
      message: "Fee configuration deleted",
      ...updated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get("/users", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select("-passwordHash -apiKey").sort({ createdAt: -1 }).lean();

    // Batch these instead of one Subscription.findOne + one Device.countDocuments
    // PER USER (was 1 + 2N queries -- hundreds of round trips once the user
    // table has any real size). Fetch all subscriptions for these users and
    // all device counts via a single aggregation, then merge in memory.
    const userIds = users.map(u => u._id);
    const [subs, deviceCounts] = await Promise.all([
      Subscription.find({ user: { $in: userIds } }).select("user plan status extraDevices").lean(),
      Device.aggregate([
        { $match: { owner: { $in: userIds } } },
        { $group: { _id: "$owner", count: { $sum: 1 } } },
      ]),
    ]);
    const subByUser = new Map(subs.map(s => [String(s.user), s]));
    const countByUser = new Map(deviceCounts.map((d: any) => [String(d._id), d.count]));

    const enriched = users.map(u => ({
      ...u,
      subscription: subByUser.get(String(u._id)) || null,
      deviceCount: countByUser.get(String(u._id)) || 0,
    }));

    res.json(enriched);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = z.object({
      role: z.enum(["user", "admin", "telecom", "law_enforcement"])
    }).parse(req.body);

    if (req.params.id as string === req.user!.id) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(req.params.id as string, { role }, { new: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

export default router;
