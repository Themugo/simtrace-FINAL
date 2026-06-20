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

// Verifies the requesting user owns the instance, or holds an admin/super_admin
// role. Returns the instance on success, or sends a 403/404 and returns null —
// callers should `return` immediately when this returns null.
async function requireInstanceAccess(req: AuthRequest, res: Response, instanceId: string) {
  const instance = await getWhiteLabelInstance(instanceId);
  if (!instance) {
    res.status(404).json({ error: "White label instance not found" });
    return null;
  }
  const role = req.user?.role;
  if (role === "admin" || role === "super_admin") return instance;

  const ownerId = (instance as unknown as { owner?: { _id?: { toString(): string } } | { toString(): string } }).owner;
  const ownerIdStr = ownerId && typeof ownerId === "object" && "_id" in ownerId && ownerId._id
    ? ownerId._id.toString()
    : ownerId?.toString();

  if (ownerIdStr !== req.user?.id) {
    res.status(403).json({ error: "You do not have access to this white label instance" });
    return null;
  }
  return instance;
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
    const role = req.user?.role;
    const isAdmin = role === "admin" || role === "super_admin";
    if (!isAdmin && data.owner !== req.user?.id) {
      return res.status(403).json({ error: "You can only create instances owned by yourself" });
    }
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
    const instance = await requireInstanceAccess(req, res, instanceId as string);
    if (!instance) return;

    res.json(instance);
  } catch (err) { next(err); }
});

router.patch("/instances/:instanceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    if (!(await requireInstanceAccess(req, res, instanceId as string))) return;
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
    const role = req.user?.role;
    const isAdmin = role === "admin" || role === "super_admin";

    let instances;
    if (ownerId) {
      // Anyone can list their own instances; only admins can list someone else's.
      if (!isAdmin && ownerId !== req.user?.id) {
        return res.status(403).json({ error: "You can only list your own instances" });
      }
      instances = await getInstancesByOwner(ownerId as string);
    } else if (partnerId) {
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required to list instances by partner" });
      }
      instances = await getInstancesByPartner(partnerId as string);
    } else if (status === "active" || status === "pending") {
      // System-wide listing across all tenants — admin only.
      if (!isAdmin) {
        return res.status(403).json({ error: "Admin access required for system-wide instance listings" });
      }
      instances = status === "active" ? await getActiveInstances() : await getPendingInstances();
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
    if (!(await requireInstanceAccess(req, res, instanceId as string))) return;
    const result = await regenerateApiKey(instanceId as string);
    res.json(result);
  } catch (err) { next(err); }
});

// ── Feature Management ─────────────────────────────────────────────────────────────
router.post("/instances/:instanceId/features/:feature/enable", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, feature } = req.params;
    if (!(await requireInstanceAccess(req, res, instanceId as string))) return;
    const instance = await enableFeature(instanceId as string, feature as string);
    res.json(instance);
  } catch (err) { next(err); }
});

router.post("/instances/:instanceId/features/:feature/disable", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId, feature } = req.params;
    if (!(await requireInstanceAccess(req, res, instanceId as string))) return;
    const instance = await disableFeature(instanceId as string, feature as string);
    res.json(instance);
  } catch (err) { next(err); }
});

router.patch("/instances/:instanceId/rate-limits", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    if (!(await requireInstanceAccess(req, res, instanceId as string))) return;
    const limits = req.body;
    const instance = await updateRateLimits(instanceId as string, limits);
    res.json(instance);
  } catch (err) { next(err); }
});

// ── Metrics & Revenue ───────────────────────────────────────────────────────────
// Admin-only: this endpoint lets the caller directly set/increment usage and
// revenue figures. Even with an ownership check, allowing a tenant to call this
// about its own instance would mean self-reported billing metrics — the wrong
// trust model regardless of who owns the instance.
router.patch("/instances/:instanceId/metrics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    if (!(await requireInstanceAccess(req, res, instanceId as string))) return;
    const { period } = req.query;
    const revenue = await calculateInstanceRevenue(instanceId as string, period as string);
    res.json(revenue);
  } catch (err) { next(err); }
});

// ── Webhook Management ─────────────────────────────────────────────────────────────
router.patch("/instances/:instanceId/webhook", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    if (!(await requireInstanceAccess(req, res, instanceId as string))) return;
    const { webhookUrl } = req.body;
    const result = await updateWebhook(instanceId as string, webhookUrl);
    res.json(result);
  } catch (err) { next(err); }
});

router.post("/instances/:instanceId/webhook/test", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { instanceId } = req.params;
    if (!(await requireInstanceAccess(req, res, instanceId as string))) return;
    const result = await testWebhook(instanceId as string);
    res.json(result);
  } catch (err) { next(err); }
});

// ── Instance Cloning ─────────────────────────────────────────────────────────────
router.post("/instances/:templateId/clone", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { templateId } = req.params;
    if (!(await requireInstanceAccess(req, res, templateId as string))) return;

    const { newName } = req.body;
    const role = req.user?.role;
    const isAdmin = role === "admin" || role === "super_admin";
    // Only admins may assign the clone to a different owner; everyone else's
    // clone belongs to themselves regardless of what the request body says.
    const newOwner = isAdmin && req.body.newOwner ? req.body.newOwner : req.user?.id;

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

