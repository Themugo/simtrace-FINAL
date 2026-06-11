import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { 
  orchestrateAI, 
  getAIContext, 
  updateDeviceContext, 
  addInvestigationMemory, 
  addThreatMemory, 
  addBehavioralMemory,
  getAIOrchestratorStatistics 
} from "../ai-core/orchestrator.js";

const router = Router();

type AuthRequest = Request & { user?: { id: string; role: string; organizationId?: string } }

// POST /api/ai/orchestrate — trigger AI orchestration
router.post("/orchestrate", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.enum(['agent_coordination', 'workflow_execution', 'analytics_processing', 'recommendation_generation']),
      input: z.record(z.any()),
    });
    const { type, input } = schema.parse(req.body);

    const result = await orchestrateAI(type, input);
    
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/ai/context/:organizationId — get AI context for organization
router.get("/context/:organizationId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = String(req.params.organizationId);
    const context = getAIContext(organizationId);
    
    if (!context) {
      return res.status(404).json({ error: "Context not found" });
    }
    
    res.json(context);
  } catch (err) { next(err); }
});

// POST /api/ai/context/:organizationId/device — update device context
router.post("/context/:organizationId/device", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = String(req.params.organizationId);
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      trustScore: z.number(),
      riskHistory: z.array(z.any()),
      movementPatterns: z.array(z.any()),
      knownLocations: z.array(z.any()),
      lastSeen: z.string().or(z.date()),
    });
    const deviceContext = schema.parse(req.body);
    
    updateDeviceContext(organizationId, {
      ...deviceContext,
      lastSeen: new Date(deviceContext.lastSeen),
    });
    
    res.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/ai/context/:organizationId/investigation — add investigation memory
router.post("/context/:organizationId/investigation", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = String(req.params.organizationId);
    const schema = z.object({
      caseId: z.string(),
      summary: z.string(),
      keyFindings: z.array(z.string()),
      participants: z.array(z.string()),
      timeline: z.array(z.any()),
      outcome: z.string(),
    });
    const memory = schema.parse(req.body);
    
    const result = addInvestigationMemory(organizationId, memory);
    
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/ai/context/:organizationId/threat — add threat memory
router.post("/context/:organizationId/threat", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = String(req.params.organizationId);
    const schema = z.object({
      threatType: z.string(),
      pattern: z.string(),
      indicators: z.array(z.string()),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
    });
    const memory = schema.parse(req.body);
    
    const result = addThreatMemory(organizationId, memory);
    
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/ai/context/:organizationId/behavior — add behavioral memory
router.post("/context/:organizationId/behavior", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = String(req.params.organizationId);
    const schema = z.object({
      entityType: z.enum(['device', 'user', 'organization', 'location']),
      entityId: z.string(),
      patterns: z.array(z.any()),
      anomalies: z.array(z.any()),
      riskFactors: z.array(z.any()),
    });
    const memory = schema.parse(req.body);
    
    const result = addBehavioralMemory(organizationId, memory);
    
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/ai/statistics — get AI orchestrator statistics (admin only)
router.get("/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = getAIOrchestratorStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
