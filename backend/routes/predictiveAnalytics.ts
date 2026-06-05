// routes/predictiveAnalytics.ts - AI-Powered Predictive Analytics API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  generateRiskPrediction,
  getRiskPrediction,
  getRiskPredictionsByDevice,
  detectAnomaly,
  getAnomaliesByDevice,
  getUnresolvedAnomalies,
  resolveAnomaly,
  getPredictiveAnalyticsStatistics,
} from "../services/predictiveAnalytics.js";

const router = Router();

// ── Risk Prediction ─────────────────────────────────────────────────────────────
router.post("/risk/:deviceId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const prediction = await generateRiskPrediction(String(deviceId));
    res.status(201).json(prediction);
  } catch (err) { next(err); }
});

router.get("/risk/:deviceId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const prediction = await getRiskPrediction(String(deviceId));

    if (!prediction) {
      return res.status(404).json({ error: "No valid risk prediction found" });
    }

    res.json(prediction);
  } catch (err) { next(err); }
});

router.get("/risk/device/:deviceId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const predictions = await getRiskPredictionsByDevice(String(deviceId));
    res.json({ predictions, count: predictions.length });
  } catch (err) { next(err); }
});

// ── Anomaly Detection ───────────────────────────────────────────────────────────
router.post("/anomaly/:deviceId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const pingData = req.body;
    const anomalies = await detectAnomaly(String(deviceId), pingData);
    res.json({ anomalies, count: anomalies?.length || 0 });
  } catch (err) { next(err); }
});

router.get("/anomalies/:deviceId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const anomalies = await getAnomaliesByDevice(String(deviceId));
    res.json({ anomalies, count: anomalies.length });
  } catch (err) { next(err); }
});

router.get("/anomalies/unresolved", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anomalies = await getUnresolvedAnomalies();
    res.json({ anomalies, count: anomalies.length });
  } catch (err) { next(err); }
});

router.patch("/anomalies/:id/resolve", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      resolution: z.string(),
    });

    const { id } = req.params;
    const { resolution } = schema.parse(req.body);
    const anomaly = await resolveAnomaly(String(id), resolution);

    res.json(anomaly);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getPredictiveAnalyticsStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
