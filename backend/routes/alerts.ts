import { Router, Request, Response, NextFunction } from "express";
import { Alert, Device } from "../db/index.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

type AuthRequest = Request & { user?: { id: string; role: string } }

// GET /api/alerts/unread-count  ← MUST be before /:id
router.get("/unread-count", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = { read: false };
    if (req.user!.role !== "admin") {
      const myDevices = await Device.find({ owner: req.user!.id }).select("imei").lean();
      filter.imei = { $in: myDevices.map(d => d.imei) };
    }
    const count = await Alert.countDocuments(filter);
    res.json({ count });
  } catch (err) { next(err); }
});

// PATCH /api/alerts/read-all  ← MUST be before /:id
router.patch("/read-all", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Alert.updateMany({ read: false }, { read: true });
    res.json({ message: "All alerts marked read" });
  } catch (err) { next(err); }
});

// GET /api/alerts — paginated alert list (admin sees all, user sees own device alerts)
router.get("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page   = Math.max(1, Number(req.query.page) || 1);
    const limit  = Math.min(Number(req.query.limit) || 50, 200);
    const imei   = req.query.imei as string;
    const type   = req.query.type as string;
    const unread = req.query.unread === "true";

    const filter: Record<string, unknown> = {};
    if (req.user!.role !== "admin") {
      // non-admins only see alerts for their own devices
      const myDevices  = await Device.find({ owner: req.user!.id }).select("imei").lean();
      filter.imei = { $in: myDevices.map(d => d.imei) };
    }
    if (imei)  filter.imei = imei;
    if (type)  filter.type = type;
    if (unread) filter.read = false;

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort({ ts: -1 }).skip((page - 1) * limit).limit(limit),
      Alert.countDocuments(filter),
    ]);

    res.json({ alerts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// PATCH /api/alerts/:id/read  ← after named routes
router.patch("/:id/read", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json(alert);
  } catch (err) { next(err); }
});

export default router;
