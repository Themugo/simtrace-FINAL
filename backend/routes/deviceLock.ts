// routes/deviceLock.ts - Device lock and remote wipe API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireSelfOrAdmin, requireRecordOwner, requireDeviceOwner } from "../middleware/auth.js";
import { DeviceLock, Device } from "../db/index.js";
import {
  lockDevice,
  unlockDevice,
  recordUnlockAttempt,
  remoteWipeDevice,
  getDeviceLock,
  getDeviceLocksByDevice,
  getDeviceLocksByUser,
  getActiveLocksByDevice,
  checkDeviceLockStatus,
  expireTemporaryLocks,
} from "../services/deviceLock.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Device Lock Management ───────────────────────────────────────────────────────────
router.post("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      userId: z.string(),
      lockType: z.enum(["temporary", "permanent"]),
      lockReason: z.string(),
      unlockDate: z.date().optional(),
    });

    const data = schema.parse(req.body);
    const lock = await lockDevice({ ...data, createdBy: req.user!.id });
    res.status(201).json(lock);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:lockId/unlock", authenticate, requireRecordOwner({ model: DeviceLock, idParam: "lockId", ownerFields: ["userId"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lockId } = req.params;
    const lock = await unlockDevice(lockId as string, req.user!.id);
    res.json(lock);
  } catch (err) { next(err); }
});

// record-attempt is a device/finder telemetry callback (the person holding a lost
// device is not the owner), so it authenticates with the per-device key minted at
// enrolment (POST /api/imei/register), consistent with /api/track and /api/lock.
// A single lookup proves the key is valid AND that the lock belongs to that device.
async function requireDeviceKeyForLock(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.headers["x-device-key"] as string;
    if (!key) return res.status(401).json({ error: "X-Device-Key header required" });
    const lock = await DeviceLock.findOne({ lockId: req.params.lockId }).select("deviceId").lean();
    if (!lock) return res.status(404).json({ error: "Lock not found" });
    const device = await Device.findOne({ _id: (lock as any).deviceId, deviceKey: key }).select("_id").lean();
    if (!device) return res.status(401).json({ error: "Invalid device key" });
    next();
  } catch (err) { next(err); }
}

router.post("/:lockId/record-attempt", requireDeviceKeyForLock, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number(),
      }),
    });

    const { lockId } = req.params;
    const data = schema.parse(req.body);
    const lock = await recordUnlockAttempt(lockId as string, data.location);
    res.json(lock);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:lockId/wipe", authenticate, requireRecordOwner({ model: DeviceLock, idParam: "lockId", ownerFields: ["userId"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lockId } = req.params;
    const lock = await remoteWipeDevice(lockId as string, req.user!.id);
    res.json(lock);
  } catch (err) { next(err); }
});

router.get("/:lockId", authenticate, requireRecordOwner({ model: DeviceLock, idParam: "lockId", ownerFields: ["userId"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lockId } = req.params;
    const lock = await getDeviceLock(lockId as string);
    res.json(lock);
  } catch (err) { next(err); }
});

router.get("/device/:deviceId", authenticate, requireDeviceOwner("deviceId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const locks = await getDeviceLocksByDevice(deviceId as string);
    res.json({ locks, count: locks.length });
  } catch (err) { next(err); }
});

router.get("/user/:userId", authenticate, requireSelfOrAdmin("userId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const locks = await getDeviceLocksByUser(userId as string);
    res.json({ locks, count: locks.length });
  } catch (err) { next(err); }
});

router.get("/device/:deviceId/active", authenticate, requireDeviceOwner("deviceId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const lock = await getActiveLocksByDevice(deviceId as string);
    res.json(lock);
  } catch (err) { next(err); }
});

router.get("/device/:deviceId/status", authenticate, requireDeviceOwner("deviceId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const status = await checkDeviceLockStatus(deviceId as string);
    res.json(status);
  } catch (err) { next(err); }
});

router.post("/expire-temporary", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await expireTemporaryLocks();
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
