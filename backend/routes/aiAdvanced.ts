// routes/aiAdvanced.ts - API endpoints for advanced AI services
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { deepLearningService } from "../services/ai/deepLearning.js";
import { computerVisionService } from "../services/ai/computerVision.js";
import { nlpEvidenceAnalysisService } from "../services/ai/nlpEvidenceAnalysis.js";
import { predictiveMaintenanceService } from "../services/ai/predictiveMaintenance.js";
import { anomalyDetectionMLService } from "../services/ai/anomalyDetectionML.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// ── Deep Learning - Theft Prediction ─────────────────────────────────────────────

router.post("/deep-learning/predict", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      features: z.object({
        locationHistory: z.array(z.object({ lat: z.number(), lng: z.number(), timestamp: z.number() })),
        usagePatterns: z.array(z.object({ app: z.string(), duration: z.number(), frequency: z.number() })),
        batteryHealth: z.number(),
        signalStrength: z.number(),
        travelPatterns: z.array(z.object({ distance: z.number(), frequency: z.number() })),
        timePatterns: z.array(z.object({ hour: z.number(), activity: z.string() }))
      })
    });
    const { deviceId, imei, features } = schema.parse(req.body);

    const prediction = await deepLearningService.predictTheftRisk(deviceId, imei, features);
    res.json({ prediction });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/deep-learning/models", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const models = deepLearningService.getAllModels();
    res.json({ models });
  } catch (err) {
    next(err);
  }
});

router.post("/deep-learning/retrain/:modelId", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const model = await deepLearningService.retrainModel(modelId);
    res.json({ model });
  } catch (err) {
    next(err);
  }
});

router.get("/deep-learning/predictions/:deviceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const predictions = deepLearningService.getPredictionHistory(deviceId, limit);
    res.json({ predictions });
  } catch (err) {
    next(err);
  }
});

router.get("/deep-learning/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = deepLearningService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Computer Vision - Device Identification ───────────────────────────────────────

router.post("/computer-vision/register", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imageData: z.string(),
      metadata: z.object({
        resolution: z.string(),
        format: z.string(),
        size: z.number()
      })
    });
    const { deviceId, imageData, metadata } = schema.parse(req.body);

    const image = computerVisionService.registerDeviceImage(deviceId, imageData, metadata);
    res.json({ image });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/computer-vision/identify", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imageData: z.string()
    });
    const { imageData } = schema.parse(req.body);

    const result = await computerVisionService.identifyDevice(imageData);
    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/computer-vision/features/:deviceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const features = computerVisionService.getDeviceFeatures(deviceId);
    res.json({ features });
  } catch (err) {
    next(err);
  }
});

router.get("/computer-vision/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = computerVisionService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── NLP - Evidence Analysis ─────────────────────────────────────────────────────

router.post("/nlp/document", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      documentType: z.enum(['police_report', 'witness_statement', 'incident_report', 'insurance_claim', 'other']),
      content: z.string(),
      metadata: z.object({
        author: z.string().optional(),
        date: z.number().optional(),
        location: z.string().optional(),
        language: z.string().optional()
      }).optional()
    });
    const { deviceId, documentType, content, metadata } = schema.parse(req.body);

    const document = nlpEvidenceAnalysisService.addDocument(deviceId, documentType, content, metadata || {});
    res.json({ document });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/nlp/analyze/:documentId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;
    const analysis = await nlpEvidenceAnalysisService.analyzeDocument(documentId);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
});

router.get("/nlp/documents/:deviceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const documents = nlpEvidenceAnalysisService.getDocumentsForDevice(deviceId);
    res.json({ documents });
  } catch (err) {
    next(err);
  }
});

router.get("/nlp/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = nlpEvidenceAnalysisService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Predictive Maintenance ───────────────────────────────────────────────────────

router.post("/maintenance/metrics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      metrics: z.object({
        batteryHealth: z.number(),
        batteryCycleCount: z.number(),
        batteryTemperature: z.number(),
        cpuUsage: z.number(),
        memoryUsage: z.number(),
        storageHealth: z.number(),
        signalStrength: z.number(),
        networkLatency: z.number(),
        appCrashes: z.number(),
        systemErrors: z.number(),
        uptime: z.number()
      })
    });
    const data = schema.parse(req.body);

    const metrics = predictiveMaintenanceService.recordHealthMetrics(data);
    res.json({ metrics });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/maintenance/predict", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string()
    });
    const { deviceId, imei } = schema.parse(req.body);

    const predictions = await predictiveMaintenanceService.predictMaintenance(deviceId, imei);
    res.json({ predictions });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/maintenance/schedule", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      maintenanceType: z.enum(['battery_replacement', 'screen_repair', 'software_update', 'cleaning', 'inspection']),
      scheduledDate: z.number(),
      estimatedDuration: z.number(),
      estimatedCost: z.number(),
      notes: z.string().optional()
    });
    const data = schema.parse(req.body);

    const schedule = predictiveMaintenanceService.scheduleMaintenance(
      data.deviceId,
      data.maintenanceType,
      data.scheduledDate,
      data.estimatedDuration,
      data.estimatedCost,
      data.notes
    );
    res.json({ schedule });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/maintenance/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = predictiveMaintenanceService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Anomaly Detection ─────────────────────────────────────────────────────────────

router.post("/anomaly/detect", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      features: z.object({
        location: z.object({ lat: z.number(), lng: z.number() }).optional(),
        usage: z.object({ appUsage: z.record(z.number()), screenTime: z.number() }).optional(),
        network: z.object({ bandwidth: z.number(), latency: z.number(), packetLoss: z.number() }).optional(),
        behavioral: z.object({ typingSpeed: z.number(), appSwitching: z.number(), timeOfDay: z.number() }).optional(),
        security: z.object({ loginAttempts: z.number(), failedAuth: z.number(), unusualAccess: z.number() }).optional()
      })
    });
    const { deviceId, imei, features } = schema.parse(req.body);

    const anomalies = await anomalyDetectionMLService.detectAnomalies(deviceId, imei, features);
    res.json({ anomalies });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/anomaly/detections/:deviceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const detections = anomalyDetectionMLService.getDetectionHistory(deviceId, limit);
    res.json({ detections });
  } catch (err) {
    next(err);
  }
});

router.get("/anomaly/models", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const models = anomalyDetectionMLService.getAllModels();
    res.json({ models });
  } catch (err) {
    next(err);
  }
});

router.post("/anomaly/retrain/:modelId", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { modelId } = req.params;
    const model = await anomalyDetectionMLService.retrainModel(modelId);
    res.json({ model });
  } catch (err) {
    next(err);
  }
});

router.get("/anomaly/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = anomalyDetectionMLService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

export default router;
