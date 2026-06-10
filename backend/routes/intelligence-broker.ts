// ── Intelligence Broker API Routes ───────────────────────────────────────────────
// REST API endpoints for the four core engines and intelligence broker

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { 
  intelligenceBroker, 
  Stakeholder,
  IntelligenceContext,
  BrokerRequest,
} from "../engines/index.js";
import { 
  canPerformOperation, 
  ownsDevice,
  STAKEHOLDER_ROLE_MAP
} from "../middleware/intelligence-rbac.js";

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
    role: string;
    email: string;
  };
};

// Helper to determine stakeholder from user role
function getStakeholderFromRole(role: string): Stakeholder {
  switch (role) {
    case "device_owner":
      return "device_owner";
    case "telecom_operator":
      return "telecom_operator";
    case "law_enforcement":
      return "law_enforcement";
    case "admin":
      return "internal_admin";
    default:
      return "device_owner";
  }
}

// Helper to create intelligence context
function createIntelligenceContext(req: AuthRequest, imei: string): IntelligenceContext {
  return {
    imei,
    stakeholder: getStakeholderFromRole(req.user?.role || "device_owner"),
    userId: req.user?.id,
    timestamp: new Date(),
    metadata: {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    },
  };
}

// ── Multi-Engine Analysis ──────────────────────────────────────────────────────────

// POST /api/intelligence-broker/analyze - Run all engines on a device
router.post("/analyze", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15),
    });

    const data = schema.parse(req.body);
    const context = createIntelligenceContext(req, data.imei);

    const result = await intelligenceBroker.analyzeDevice(data.imei, context);

    return res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    return next(err);
  }
});

// ── Stakeholder-Specific Intelligence ───────────────────────────────────────────────

// GET /api/intelligence-broker/stakeholder/:stakeholder/:imei - Get intelligence for specific stakeholder
router.get("/stakeholder/:stakeholder/:imei", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stakeholder, imei } = req.params;
    const stakeholderStr = Array.isArray(stakeholder) ? stakeholder[0] : stakeholder;
    const imeiStr = Array.isArray(imei) ? imei[0] : imei;

    // Validate stakeholder
    const validStakeholders: Stakeholder[] = ["device_owner", "telecom_operator", "law_enforcement", "internal_admin"];
    if (!validStakeholders.includes(stakeholderStr as Stakeholder)) {
      return res.status(400).json({ error: "Invalid stakeholder" });
    }

    // Check authorization based on stakeholder
    const userRole = req.user?.role || "device_owner";
    const allowedRoles = STAKEHOLDER_ROLE_MAP[stakeholderStr];
    if (!allowedRoles.includes(userRole) && userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized to access this stakeholder's intelligence" });
    }

    const context = createIntelligenceContext(req, imeiStr);
    const result = await intelligenceBroker.getIntelligenceForStakeholder(stakeholderStr as Stakeholder, imeiStr, context);

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

// ── Individual Engine Endpoints ─────────────────────────────────────────────────────

// POST /api/intelligence-broker/device-intelligence - Run device intelligence engine
router.post("/device-intelligence", authenticate, canPerformOperation("device_intelligence", "read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15),
      includeHistory: z.boolean().optional(),
      includePredictions: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const context = createIntelligenceContext(req, data.imei);

    const request: BrokerRequest = {
      type: "device_intelligence",
      input: data,
      context,
    };

    const result = await intelligenceBroker.coordinate(request);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result.data);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    return next(err);
  }
});

// POST /api/intelligence-broker/risk-scoring - Run risk scoring engine
router.post("/risk-scoring", authenticate, canPerformOperation("risk_scoring", "read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15),
      includeFactors: z.boolean().optional(),
      includeHistory: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const context = createIntelligenceContext(req, data.imei);

    const request: BrokerRequest = {
      type: "risk_scoring",
      input: data,
      context,
    };

    const result = await intelligenceBroker.coordinate(request);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result.data);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    return next(err);
  }
});

// POST /api/intelligence-broker/fraud-detection - Run fraud detection engine
router.post("/fraud-detection", authenticate, canPerformOperation("fraud_detection", "read"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15),
      indicators: z.array(z.string()).optional(),
      includeThreatIntel: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const context = createIntelligenceContext(req, data.imei);

    const request: BrokerRequest = {
      type: "fraud_detection",
      input: data,
      context,
    };

    const result = await intelligenceBroker.coordinate(request);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result.data);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    return next(err);
  }
});

// POST /api/intelligence-broker/recovery-alert - Send recovery alert
router.post("/recovery-alert", authenticate, canPerformOperation("recovery_alert", "write"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15),
      alertType: z.string().min(1),
      severity: z.enum(["low", "medium", "high", "critical"]),
      message: z.string().min(1),
      channels: z.array(z.enum(["sms", "email", "push", "in_app"])).optional(),
      stakeholders: z.array(z.enum(["device_owner", "telecom_operator", "law_enforcement", "internal_admin"])).optional(),
      metadata: z.record(z.any()).optional(),
    });

    const data = schema.parse(req.body);
    const context = createIntelligenceContext(req, data.imei);

    const request: BrokerRequest = {
      type: "recovery_alert",
      input: data,
      context,
    };

    const result = await intelligenceBroker.coordinate(request);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result.data);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    return next(err);
  }
});

// ── Recovery Actions ───────────────────────────────────────────────────────────────

// POST /api/intelligence-broker/recovery-actions/:imei - Trigger recovery actions
router.post("/recovery-actions/:imei", authenticate, canPerformOperation("recovery_actions", "write"), ownsDevice, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      remoteLock: z.boolean().optional(),
      remoteWipe: z.boolean().optional(),
      locationTracking: z.boolean().optional(),
      networkBlacklist: z.boolean().optional(),
      policeAlert: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const { imei } = req.params;
    const imeiStr = Array.isArray(imei) ? imei[0] : imei;

    const { recoveryAlertEngine } = await import("../engines/index.js");
    const result = await recoveryAlertEngine.triggerRecoveryActions(imeiStr, data);

    return res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    return next(err);
  }
});

// GET /api/intelligence-broker/recovery-status/:imei - Get recovery status
router.get("/recovery-status/:imei", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const imeiStr = Array.isArray(imei) ? imei[0] : imei;

    const { recoveryAlertEngine } = await import("../engines/index.js");
    const status = await recoveryAlertEngine.getRecoveryStatus(imeiStr);

    return res.json({ imei: imeiStr, recoveryStatus: status });
  } catch (err) {
    return next(err);
  }
});

// ── Event Subscription (WebSocket-like via polling) ───────────────────────────────

// GET /api/intelligence-broker/events/:imei - Get recent events for a device
router.get("/events/:imei", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const imeiStr = Array.isArray(imei) ? imei[0] : imei;
    const since = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 3600000); // Default 1 hour

    // In production, this would query a database
    // For now, return empty array
    const events: unknown[] = [];

    return res.json({ imei: imeiStr, events, since });
  } catch (err) {
    return next(err);
  }
});

export default router;
