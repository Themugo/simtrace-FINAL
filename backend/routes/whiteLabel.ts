// routes/whiteLabel.ts - White Label Solutions API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createWhiteLabelInstance,
  updateWhiteLabelInstance,
  activateInstance,
  suspendInstance,
  terminateInstance,
  regenerateApiKey,
  
  updateInstanceMetrics,
  getWhiteLabelInstance,
  getInstancesByOwner,
  getInstancesByPartner,
  getActiveInstances,
  getPendingInstances,
  enableFeature,
  disableFeature,
  updateRateLimits,
  calculateInstanceRevenue,
  getWhiteLabelStatistics,
  updateWebhook,
  testWebhook,
  createInstanceFromTemplate,
} from "../services/whiteLabel.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Instance Management ───────────────────────────────────────────────────────────
router.post("/instances", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      owner: z.string(),
      partner: z.string().optional(),
      branding: z.object({
        logo: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        domain: z.string().optional(),
        customDomain: z.string().optional(),
        companyName: z.string().optional(),
        supportEmail: z.string().optional(),
        supportPhone: z.string().optional(),
      }).optional(),
      config: z.object({
        enabledFeatures: z.array(z.string()).optional(),
        disabledFeatures: z.array(z.string()).optional(),
        customPricing: z.boolean().optional(),
        customIntegrations: z.array(z.string()).optional(),
        apiRateLimits: z.object({
          requestsPerMinute: z.number().optional(),
          requestsPerDay: z.number().optional(),
        }).optional(),
      }).optional(),
      plan: z.enum(["starter", "professional", "enterprise"]).optional(),
      billingCycle: z.enum(["monthly", "yearly"]).optional(),
    });

    const data = schema.parse(req.body);
    const instance = await createWhiteLabelInstance(data);

    res.status(201).json(instance);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/instances/:instanceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const instance = await getWhiteLabelInstance(instanceId as string);

    if (!instance) {
      return res.status(404).json({ error: "White label instance not found" });
    }

    res.json(instance);
  } catch (err) { next(err); }
});

router.patch("/instances/:instanceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const instance = await updateWhiteLabelInstance(instanceId as string, req.body);
    res.json(instance);
  } catch (err) { next(err); }
});

router.post("/instances/:instanceId/activate", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const instance = await activateInstance(instanceId as string);
    res.json(instance);
  } catch (err) { next(err); }
});

router.post("/instances/:instanceId/suspend", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const { reason } = req.body;
    const instance = await suspendInstance(instanceId as string, reason);
    res.json(instance);
  } catch (err) { next(err); }
});

router.post("/instances/:instanceId/terminate", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const instance = await terminateInstance(instanceId as string);
    res.json(instance);
  } catch (err) { next(err); }
});

// ── Instance Queries ───────────────────────────────────────────────────────────────
router.get("/instances", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ownerId, partnerId, status } = req.query;

    let instances;
    if (ownerId) {
      instances = await getInstancesByOwner(ownerId as string);
    } else if (partnerId) {
      instances = await getInstancesByPartner(partnerId as string);
    } else if (status === "active") {
      instances = await getActiveInstances();
    } else if (status === "pending") {
      instances = await getPendingInstances();
    } else {
      return res.status(400).json({ error: "Specify ownerId, partnerId, or status" });
    }

    res.json({ instances, count: instances.length });
  } catch (err) { next(err); }
});

// ── API Key Management ─────────────────────────────────────────────────────────────
router.post("/instances/:instanceId/regenerate-key", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const result = await regenerateApiKey(instanceId as string);
    res.json(result);
  } catch (err) { next(err); }
});

// ── Feature Management ─────────────────────────────────────────────────────────────
router.post("/instances/:instanceId/features/:feature/enable", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, feature } = req.params;
    const instance = await enableFeature(instanceId as string, feature as string);
    res.json(instance);
  } catch (err) { next(err); }
});

router.post("/instances/:instanceId/features/:feature/disable", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, feature } = req.params;
    const instance = await disableFeature(instanceId as string, feature as string);
    res.json(instance);
  } catch (err) { next(err); }
});

router.patch("/instances/:instanceId/rate-limits", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const limits = req.body;
    const instance = await updateRateLimits(instanceId as string, limits);
    res.json(instance);
  } catch (err) { next(err); }
});

// ── Metrics & Revenue ───────────────────────────────────────────────────────────
router.patch("/instances/:instanceId/metrics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const metrics = req.body;
    const instance = await updateInstanceMetrics(instanceId as string, metrics);
    res.json(instance);
  } catch (err) { next(err); }
});

router.get("/instances/:instanceId/revenue", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const { period } = req.query;
    const revenue = await calculateInstanceRevenue(instanceId as string, period as string);
    res.json(revenue);
  } catch (err) { next(err); }
});

// ── Webhook Management ─────────────────────────────────────────────────────────────
router.patch("/instances/:instanceId/webhook", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const { webhookUrl } = req.body;
    const result = await updateWebhook(instanceId as string, webhookUrl);
    res.json(result);
  } catch (err) { next(err); }
});

router.post("/instances/:instanceId/webhook/test", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    const result = await testWebhook(instanceId as string);
    res.json(result);
  } catch (err) { next(err); }
});

// ── Instance Cloning ─────────────────────────────────────────────────────────────
router.post("/instances/:templateId/clone", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId } = req.params;
    const { newOwner, newName } = req.body;
    const instance = await createInstanceFromTemplate(templateId as string, newOwner, newName);
    res.status(201).json(instance);
  } catch (err) { next(err); }
});

// ── Statistics ─────────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getWhiteLabelStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;

