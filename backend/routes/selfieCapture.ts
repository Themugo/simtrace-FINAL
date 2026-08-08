// routes/selfieCapture.ts - Selfie capture and thief identification API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireSelfOrAdmin, requireRecordOwner, requireDeviceOwner } from "../middleware/auth.js";
import { SelfieCapture, ThiefReport, Device } from "../db/index.js";
import {
  captureSelfie,
  analyzeSelfie,
  getSelfieCapture,
  getSelfieCapturesByDevice,
  getSelfieCapturesByUser,
  getPendingCaptures,
  getThiefCaptures,
  reportThief,
  updateThiefReport,
  resolveThiefReport,
  getThiefReport,
  getThiefReportsByDevice,
  getThiefReportsByUser,
  getPendingThiefReports,
  getInvestigatingThiefReports,
} from "../services/selfieCapture.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Selfie Capture Management ─────────────────────────────────────────────────────────
// A selfie capture is uploaded BY the (locked) device, not a logged-in user, so it
// authenticates with the per-device key — consistent with record-attempt / track /
// lock. Closes an open hole where anyone could inject biometric capture records.
async function requireDeviceKeyForCapture(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.headers["x-device-key"] as string;
    if (!key) return res.status(401).json({ error: "X-Device-Key header required" });
    const deviceId = (req.body || {}).deviceId;
    const device = await Device.findOne({ deviceKey: key }).select("_id imei").lean();
    if (!device || (String((device as any)._id) !== String(deviceId) && (device as any).imei !== deviceId)) {
      return res.status(401).json({ error: "Invalid device key" });
    }
    next();
  } catch (err) { next(err); }
}

router.post("/", requireDeviceKeyForCapture, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      userId: z.string(),
      captureDate: z.date(),
      captureLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number(),
      }),
      imageUrl: z.string(),
    });

    const data = schema.parse(req.body);
    const capture = await captureSelfie({ ...data, createdBy: req.user?.id });
    res.status(201).json(capture);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:captureId/analyze", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { captureId } = req.params;
    const capture = await analyzeSelfie(captureId as string);
    res.json(capture);
  } catch (err) { next(err); }
});

router.get("/:captureId", authenticate, requireRecordOwner({ model: SelfieCapture, idParam: "captureId", ownerFields: ["user"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { captureId } = req.params;
    const capture = await getSelfieCapture(captureId as string);
    res.json(capture);
  } catch (err) { next(err); }
});

router.get("/device/:deviceId", authenticate, requireDeviceOwner("deviceId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const captures = await getSelfieCapturesByDevice(deviceId as string);
    res.json({ captures, count: captures.length });
  } catch (err) { next(err); }
});

router.get("/user/:userId", authenticate, requireSelfOrAdmin("userId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const captures = await getSelfieCapturesByUser(userId as string);
    res.json({ captures, count: captures.length });
  } catch (err) { next(err); }
});

router.get("/pending", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const captures = await getPendingCaptures();
    res.json({ captures, count: captures.length });
  } catch (err) { next(err); }
});

router.get("/thieves", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const captures = await getThiefCaptures();
    res.json({ captures, count: captures.length });
  } catch (err) { next(err); }
});

// ── Thief Report Management ───────────────────────────────────────────────────────────
router.post("/reports", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      userId: z.string(),
      selfieCaptureId: z.string(),
      reportReason: z.string(),
      reportedTo: z.array(z.string()),
      thiefIdentified: z.boolean().optional(),
      thiefUserId: z.string().optional(),
      thiefName: z.string().optional(),
      thiefPhone: z.string().optional(),
      thiefAddress: z.string().optional(),
      evidence: z.array(z.object({
        type: z.string(),
        url: z.string(),
        description: z.string(),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const report = await reportThief({ ...data, createdBy: req.user!.id });
    res.status(201).json(report);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/reports/:reportId", authenticate, requireRecordOwner({ model: ThiefReport, idParam: "reportId", ownerFields: ["createdBy"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const report = await updateThiefReport(String(reportId), req.body, req.user!.id);
    res.json(report);
  } catch (err) { next(err); }
});

router.post("/reports/:reportId/resolve", authenticate, requireRecordOwner({ model: ThiefReport, idParam: "reportId", ownerFields: ["createdBy"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      resolution: z.string(),
    });

    const { reportId } = req.params;
    const data = schema.parse(req.body);
    const report = await resolveThiefReport(reportId as string, data.resolution, req.user!.id);
    res.json(report);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/reports/:reportId", authenticate, requireRecordOwner({ model: ThiefReport, idParam: "reportId", ownerFields: ["createdBy"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const report = await getThiefReport(reportId as string);
    res.json(report);
  } catch (err) { next(err); }
});

router.get("/reports/device/:deviceId", authenticate, requireDeviceOwner("deviceId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const reports = await getThiefReportsByDevice(deviceId as string);
    res.json({ reports, count: reports.length });
  } catch (err) { next(err); }
});

router.get("/reports/user/:userId", authenticate, requireSelfOrAdmin("userId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const reports = await getThiefReportsByUser(userId as string);
    res.json({ reports, count: reports.length });
  } catch (err) { next(err); }
});

router.get("/reports/pending", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await getPendingThiefReports();
    res.json({ reports, count: reports.length });
  } catch (err) { next(err); }
});

router.get("/reports/investigating", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await getInvestigatingThiefReports();
    res.json({ reports, count: reports.length });
  } catch (err) { next(err); }
});

export default router;
