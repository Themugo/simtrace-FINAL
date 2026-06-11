// routes/securityEnhanced.ts - Enhanced Security Features API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  detectNearbyDevices,
  getNearbyDeviceDetection,
  getNearbyDetectionsByDevice,
  addPotentialWitness,
  addGuardian,
  getGuardians,
  removeGuardian,
  updateGuardianPermissions,
  guardianReportTheft,
  addChild,
  getChildren,
  enableLiveTracking,
  disableLiveTracking,
  addGeofence,
  removeGeofence,
  activatePanicMode,
  getPanicMode,
  getActivePanicModes,
  resolvePanicMode,
  cancelPanicMode,
  getSecurityStatistics,
} from "../services/securityEnhanced.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Nearby Device Detection ─────────────────────────────────────────────────────
router.post("/nearby-devices/detect", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      incidentType: z.enum(["attack", "theft", "emergency", "panic"]),
      incidentDescription: z.string().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
      }),
    });

    const data = schema.parse(req.body);
    const detection = await detectNearbyDevices({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(detection);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/nearby-devices/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const detection = await getNearbyDeviceDetection(id as string);
    res.json(detection);
  } catch (err) { next(err); }
});

router.get("/nearby-devices/device/:deviceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const detections = await getNearbyDetectionsByDevice(deviceId as string);
    res.json({ detections, count: detections.length });
  } catch (err) { next(err); }
});

router.post("/nearby-devices/:id/witness", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      userId: z.string().optional(),
      contactInfo: z.string(),
      consentGiven: z.boolean().default(false),
    });

    const { id } = req.params;
    const witnessData = schema.parse(req.body);
    const detection = await addPotentialWitness(id as string, witnessData);
    res.json(detection);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Guardian/Nominee System ─────────────────────────────────────────────────────
router.post("/guardians", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      guardianId: z.string(),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      relationship: z.enum(["parent", "spouse", "sibling", "friend", "other"]),
      permissions: z.array(z.object({
        type: z.string(),
        enabled: z.boolean(),
      })).optional(),
      canReportTheft: z.boolean().optional(),
      emergencyOnly: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const guardian = await addGuardian({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(guardian);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/guardians", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const guardians = await getGuardians(req.user!.id);
    res.json({ guardians, count: guardians.length });
  } catch (err) { next(err); }
});

router.delete("/guardians/:guardianId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { guardianId } = req.params;
    const guardian = await removeGuardian(req.user!.id, guardianId as string);
    res.json(guardian);
  } catch (err) { next(err); }
});

router.patch("/guardians/:guardianId/permissions", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permissions: z.array(z.object({
        type: z.string(),
        enabled: z.boolean(),
      })),
    });

    const { guardianId } = req.params;
    const { permissions } = schema.parse(req.body);
    const guardian = await updateGuardianPermissions(req.user!.id, guardianId as string, permissions as unknown as Record<string, unknown>);
    res.json(guardian);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/guardians/:guardianId/report-theft", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      reason: z.string(),
    });

    const { guardianId } = req.params;
    const { deviceId, reason } = schema.parse(req.body);
    const result = await guardianReportTheft(guardianId as string, deviceId, reason);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Parent-Child Relationship System ─────────────────────────────────────────────
router.post("/children", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      childId: z.string(),
      childName: z.string().optional(),
      childAge: z.number().optional(),
      school: z.string().optional(),
      canTrack: z.boolean().optional(),
      canManageDevice: z.boolean().optional(),
      canReceiveAlerts: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const parentChild = await addChild({
      ...data,
      parentId: req.user!.id,
    });

    res.status(201).json(parentChild);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/children", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const children = await getChildren(req.user!.id);
    res.json({ children, count: children.length });
  } catch (err) { next(err); }
});

router.post("/children/:id/live-tracking", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      reason: z.string(),
      durationHours: z.number().optional(),
    });

    const { id } = req.params;
    const { reason, durationHours } = schema.parse(req.body);
    const parentChild = await enableLiveTracking(id as string, reason, durationHours);
    res.json(parentChild);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/children/:id/live-tracking", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const parentChild = await disableLiveTracking(id as string);
    res.json(parentChild);
  } catch (err) { next(err); }
});

router.post("/children/:id/geofences", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
      radius: z.number(),
      type: z.enum(["school", "home", "safe_zone"]),
      alertOnExit: z.boolean().default(true),
    });

    const { id } = req.params;
    const geofenceData = schema.parse(req.body);
    const parentChild = await addGeofence(id as string, geofenceData);
    res.json(parentChild);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/children/:id/geofences/:index", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, index } = req.params;
    const parentChild = await removeGeofence(id as string, parseInt(index as string));
    res.json(parentChild);
  } catch (err) { next(err); }
});

// ── Panic Mode System ───────────────────────────────────────────────────────────
router.post("/panic", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      panicType: z.enum(["personal", "medical", "attack", "lost", "other"]),
      description: z.string().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().optional(),
      }),
      authorizedTrackers: z.array(z.object({
        userId: z.string(),
        name: z.string(),
        phone: z.string(),
        relationship: z.string(),
        canViewLocation: z.boolean().default(true),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const panicMode = await activatePanicMode({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(panicMode);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/panic/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const panicMode = await getPanicMode(id as string);
    res.json(panicMode);
  } catch (err) { next(err); }
});

router.get("/panic/active", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const panicModes = await getActivePanicModes(req.user!.id);
    res.json({ panicModes, count: panicModes.length });
  } catch (err) { next(err); }
});

router.post("/panic/:id/resolve", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      resolutionNotes: z.string(),
    });

    const { id } = req.params;
    const { resolutionNotes } = schema.parse(req.body);
    const panicMode = await resolvePanicMode(id as string, req.user!.id, resolutionNotes);
    res.json(panicMode);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/panic/:id/cancel", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const panicMode = await cancelPanicMode(id as string);
    res.json(panicMode);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getSecurityStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
