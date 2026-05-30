// routes/recovery.ts - Autonomous Recovery Network API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin, requireRole } from "../middleware/auth.js";
import {
  registerRecoveryAgent,
  updateAgentMetrics,
  findAvailableAgents,
  createRecoveryCase,
  autoAssignAgents,
  assignAgentsToCase,
  updateCaseStatus,
  addCommunication,
  updateCaseLocation,
  getRecoveryCase,
  getRecoveryCasesByUser,
  getRecoveryCasesByAgent,
  getActiveCases,
  getRecoveryStatistics,
  runAutonomousRecovery,
} from "../services/recovery.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Agent Management ─────────────────────────────────────────────────────────────
router.post("/agents", authenticate, requireRole("admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      type: z.enum(["human", "automated", "partner"]),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      location: z.object({
        country: z.string(),
        region: z.string(),
        city: z.string(),
        lat: z.number(),
        lng: z.number(),
      }),
      capabilities: z.array(z.string()),
      partnerOrg: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const agent = await registerRecoveryAgent(data);

    res.status(201).json(agent);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/agents", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, capabilities, type, maxLoad } = req.query;
    
    const criteria: any = {};
    if (location) criteria.location = JSON.parse(location as string);
    if (capabilities) criteria.capabilities = JSON.parse(capabilities as string);
    if (type) criteria.type = type;
    if (maxLoad) criteria.maxLoad = parseInt(maxLoad as string);

    const agents = await findAvailableAgents(criteria);
    res.json({ agents, count: agents.length });
  } catch (err) { next(err); }
});

router.patch("/agents/:id/metrics", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const agent = await updateAgentMetrics(id);
    res.json(agent);
  } catch (err) { next(err); }
});

// ── Recovery Case Management ───────────────────────────────────────────────────────
router.post("/cases", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      recoveryFee: z.number().optional(),
      rewardOffered: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const recoveryCase = await createRecoveryCase({
      ...data,
      reportedBy: req.user!.id,
    });

    res.status(201).json(recoveryCase);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/cases/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const recoveryCase = await getRecoveryCase(id);

    if (!recoveryCase) {
      return res.status(404).json({ error: "Recovery case not found" });
    }

    res.json(recoveryCase);
  } catch (err) { next(err); }
});

router.get("/cases/my", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cases = await getRecoveryCasesByUser(req.user!.id);
    res.json({ cases, count: cases.length });
  } catch (err) { next(err); }
});

router.get("/cases/agent/:agentId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const cases = await getRecoveryCasesByAgent(agentId);
    res.json({ cases, count: cases.length });
  } catch (err) { next(err); }
});

router.get("/cases/active", authenticate, requireRole("admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cases = await getActiveCases();
    res.json({ cases, count: cases.length });
  } catch (err) { next(err); }
});

router.patch("/cases/:id/status", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      status: z.enum(["open", "assigned", "in_progress", "negotiating", "recovered", "failed", "closed", "escalated"]),
      notes: z.string().optional(),
      agentId: z.string().optional(),
    });

    const { id } = req.params;
    const { status, notes, agentId } = schema.parse(req.body);
    const recoveryCase = await updateCaseStatus(id, status, notes, agentId);

    res.json(recoveryCase);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/cases/:id/communications", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.enum(["call", "sms", "email", "in_person"]),
      direction: z.enum(["inbound", "outbound"]),
      summary: z.string(),
      recordingUrl: z.string().optional(),
    });

    const { id } = req.params;
    const communication = schema.parse(req.body);
    const recoveryCase = await addCommunication(id, communication);

    res.json(recoveryCase);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/cases/:id/location", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    });

    const { id } = req.params;
    const location = schema.parse(req.body);
    const recoveryCase = await updateCaseLocation(id, location);

    res.json(recoveryCase);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/cases/:id/auto-assign", authenticate, requireRole("admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const recoveryCase = await autoAssignAgents(id);
    res.json(recoveryCase);
  } catch (err) { next(err); }
});

router.post("/cases/:id/autonomous", authenticate, requireRole("admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const recoveryCase = await runAutonomousRecovery(id);
    res.json(recoveryCase);
  } catch (err) { next(err); }
});

// ── Statistics ─────────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireRole("admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getRecoveryStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
