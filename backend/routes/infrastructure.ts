// routes/infrastructure.ts - API endpoints for global infrastructure features
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { satelliteCommunicationService } from "../services/infrastructure/satelliteCommunication.js";
import { multiRegionDataService } from "../services/infrastructure/multiRegionData.js";
import { globalLawEnforcementService } from "../services/infrastructure/globalLawEnforcement.js";
import type { LawEnforcementAgency } from "../services/infrastructure/globalLawEnforcement.js";

const router = Router();

interface ZodErrorLike {
  errors: Array<{ message: string; path: (string | number)[] }>;
}

type AuthRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
};

// ── Satellite Communication ─────────────────────────────────────────────────────

router.post("/satellite/register", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      networkId: z.string()
    });
    const { deviceId, imei, networkId } = schema.parse(req.body);

    const device = satelliteCommunicationService.registerDevice(deviceId, imei, networkId);
    res.json({ device });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/satellite/send", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      messageType: z.enum(['location', 'alert', 'status', 'command']),
      payload: z.any(),
      priority: z.enum(['low', 'normal', 'high', 'emergency']).optional()
    });
    const { deviceId, messageType, payload, priority } = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const message = await satelliteCommunicationService.sendMessage(deviceId, userId, messageType, payload, priority);
    res.json({ message });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/satellite/message/:messageId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const message = satelliteCommunicationService.getMessageStatus(messageId as string);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({ message });
  } catch (err) {
    next(err);
  }
});

router.get("/satellite/device/:deviceId/messages", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const messages = satelliteCommunicationService.getDeviceMessages(deviceId as string, limit);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.put("/satellite/device/:deviceId/signal", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      signalStrength: z.number(),
      batteryLevel: z.number().optional()
    });
    const { signalStrength, batteryLevel } = schema.parse(req.body);
    const { deviceId } = req.params;

    satelliteCommunicationService.updateDeviceSignal(deviceId as string, signalStrength, batteryLevel);
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/satellite/networks", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const networks = satelliteCommunicationService.getAvailableNetworks();
    res.json({ networks });
  } catch (err) {
    next(err);
  }
});

router.get("/satellite/statistics", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = satelliteCommunicationService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Multi-Region Data Residency ─────────────────────────────────────────────────

router.post("/data-residency/rules", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      entityType: z.string(),
      requiredRegion: z.string(),
      deviceId: z.string().optional(),
      ttl: z.number().optional()
    });
    const { entityType, requiredRegion, deviceId, ttl } = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rule = multiRegionDataService.setResidencyRule(userId, entityType, requiredRegion, deviceId, ttl);
    res.json({ rule });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/data-residency/rules", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rules = multiRegionDataService.getResidencyRules(userId);
    res.json({ rules });
  } catch (err) {
    next(err);
  }
});

router.delete("/data-residency/rules/:ruleId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.params;
    const success = multiRegionDataService.deleteResidencyRule(ruleId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/data-residency/store", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      dataId: z.string(),
      entityType: z.string(),
      data: z.any(),
      deviceId: z.string().optional()
    });
    const { dataId, entityType, data, deviceId } = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = multiRegionDataService.storeData(dataId, userId, entityType, data, deviceId);
    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/data-residency/location/:dataId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dataId } = req.params;
    const location = multiRegionDataService.getDataLocation(dataId as string);
    
    if (!location) {
      return res.status(404).json({ error: "Data location not found" });
    }

    res.json({ location });
  } catch (err) {
    next(err);
  }
});

router.post("/data-residency/transfer", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      dataId: z.string(),
      destinationRegion: z.string(),
      transferType: z.enum(['replication', 'migration', 'backup'])
    });
    const { dataId, destinationRegion, transferType } = schema.parse(req.body);

    const transfer = await multiRegionDataService.initiateTransfer(dataId, destinationRegion, transferType);
    res.json({ transfer });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/data-residency/transfer/:transferId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transferId } = req.params;
    const transfer = multiRegionDataService.getTransferStatus(transferId as string);
    
    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    res.json({ transfer });
  } catch (err) {
    next(err);
  }
});

router.get("/data-residency/regions", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const regions = multiRegionDataService.getActiveRegions();
    res.json({ regions });
  } catch (err) {
    next(err);
  }
});

router.get("/data-residency/statistics", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const distribution = multiRegionDataService.getDataDistribution();
    const transferStats = multiRegionDataService.getTransferStatistics();
    res.json({ distribution, transferStats });
  } catch (err) {
    next(err);
  }
});

// ── Global Law Enforcement ─────────────────────────────────────────────────────

router.post("/law-enforcement/register", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      countryCode: z.string(),
      type: z.enum(['police', 'fbi', 'interpol', 'customs', 'private']),
      jurisdiction: z.array(z.string()),
      contactEmail: z.string(),
      contactPhone: z.string(),
      apiEndpoint: z.string().optional(),
      isActive: z.boolean().optional(),
      responseTime: z.number().optional(),
      successRate: z.number().optional()
    });
    const data = schema.parse(req.body);

    const agency = globalLawEnforcementService.registerAgency(data as unknown as Omit<LawEnforcementAgency, 'agencyId'>);
    res.json({ agency });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/law-enforcement/request", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      requestingAgency: z.string(),
      requestType: z.enum(['location', 'recovery', 'investigation', 'block']),
      priority: z.enum(['low', 'normal', 'high', 'urgent']),
      evidence: z.array(z.string()),
      ttl: z.number().optional()
    });
    const data = schema.parse(req.body);

    const request = globalLawEnforcementService.submitRequest(
      data.deviceId,
      data.imei,
      data.requestingAgency,
      data.requestType,
      data.priority,
      data.evidence,
      data.ttl
    );
    res.json({ request });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/law-enforcement/request/:requestId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const request = globalLawEnforcementService.getRequestStatus(requestId as string);
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ request });
  } catch (err) {
    next(err);
  }
});

router.post("/law-enforcement/request/:requestId/approve", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const approvingAgency = req.user?.id || 'system';
    
    const success = globalLawEnforcementService.approveRequest(requestId as string, approvingAgency);
    
    if (!success) {
      return res.status(400).json({ error: "Failed to approve request" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/law-enforcement/request/:requestId/reject", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      reason: z.string().optional()
    });
    const { reason } = schema.parse(req.body);
    const { requestId } = req.params;
    const rejectingAgency = req.user?.id || 'system';
    
    const success = globalLawEnforcementService.rejectRequest(requestId as string, rejectingAgency, reason);
    
    if (!success) {
      return res.status(400).json({ error: "Failed to reject request" });
    }

    res.json({ success });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/law-enforcement/response", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      requestId: z.string(),
      respondingAgency: z.string(),
      responseType: z.enum(['location_found', 'device_recovered', 'investigation_complete', 'blocked', 'unable_to_locate']),
      data: z.any()
    });
    const data = schema.parse(req.body);

    const response = globalLawEnforcementService.submitResponse(
      data.requestId,
      data.respondingAgency,
      data.responseType,
      data.data
    );
    res.json({ response });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/law-enforcement/agencies", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agencies = globalLawEnforcementService.getActiveAgencies();
    res.json({ agencies });
  } catch (err) {
    next(err);
  }
});

router.get("/law-enforcement/statistics", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = globalLawEnforcementService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

export default router;
