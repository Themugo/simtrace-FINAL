// routes/deviceLock.ts - Device lock and remote wipe API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
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

router.post("/:lockId/unlock", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lockId } = req.params;
    const lock = await unlockDevice(lockId, req.user!.id);
    res.json(lock);
  } catch (err) { next(err); }
});

router.post("/:lockId/record-attempt", async (req: Request, res: Response, next: NextFunction) => {
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
    const lock = await recordUnlockAttempt(lockId, data.location);
    res.json(lock);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:lockId/wipe", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lockId } = req.params;
    const lock = await remoteWipeDevice(lockId, req.user!.id);
    res.json(lock);
  } catch (err) { next(err); }
});

router.get("/:lockId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lockId } = req.params;
    const lock = await getDeviceLock(lockId);
    res.json(lock);
  } catch (err) { next(err); }
});

router.get("/device/:deviceId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const locks = await getDeviceLocksByDevice(deviceId);
    res.json({ locks, count: locks.length });
  } catch (err) { next(err); }
});

router.get("/user/:userId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const locks = await getDeviceLocksByUser(userId);
    res.json({ locks, count: locks.length });
  } catch (err) { next(err); }
});

router.get("/device/:deviceId/active", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const lock = await getActiveLocksByDevice(deviceId);
    res.json(lock);
  } catch (err) { next(err); }
});

router.get("/device/:deviceId/status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const status = await checkDeviceLockStatus(deviceId);
    res.json(status);
  } catch (err) { next(err); }
});

router.post("/expire-temporary", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await expireTemporaryLocks();
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
