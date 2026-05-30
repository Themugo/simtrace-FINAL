// routes/enterprise.ts - Enterprise Organization API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createOrganization,
  getOrganization,
  getOrganizationBySlug,
  updateOrganization,
  upgradePlan,
  addOrganizationMember,
  removeOrganizationMember,
  updateMemberRole,
  getOrganizationMembers,
  getUserOrganizations,
  createDeviceFleet,
  getDeviceFleet,
  getOrganizationFleets,
  addDeviceToFleet,
  removeDeviceFromFleet,
  updateFleetSettings,
  getFleetAnalytics,
  getEnterpriseStatistics,
} from "../services/enterprise.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Organization Management ───────────────────────────────────────────────────────
router.post("/organizations", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
      email: z.string().email(),
      phone: z.string().optional(),
      address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        country: z.string(),
        postalCode: z.string().optional(),
      }).optional(),
      industry: z.string().optional(),
      size: z.enum(["startup", "sme", "mid_market", "enterprise"]).optional(),
      plan: z.enum(["enterprise_basic", "enterprise_pro", "enterprise_custom"]).optional(),
      ownerId: z.string(),
    });

    const data = schema.parse(req.body);
    const organization = await createOrganization(data);

    res.status(201).json(organization);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/organizations/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const organization = await getOrganization(id);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json(organization);
  } catch (err) { next(err); }
});

router.get("/organizations/slug/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const organization = await getOrganizationBySlug(slug);

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    res.json(organization);
  } catch (err) { next(err); }
});

router.patch("/organizations/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const organization = await updateOrganization(id, req.body);
    res.json(organization);
  } catch (err) { next(err); }
});

router.post("/organizations/:id/upgrade", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      newPlan: z.enum(["enterprise_basic", "enterprise_pro", "enterprise_custom"]),
    });

    const { id } = req.params;
    const { newPlan } = schema.parse(req.body);
    const organization = await upgradePlan(id, newPlan);

    res.json(organization);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Organization Members ─────────────────────────────────────────────────────────
router.post("/organizations/:id/members", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      role: z.enum(["owner", "admin", "manager", "member"]).optional(),
      permissions: z.array(z.string()).optional(),
    });

    const { id } = req.params;
    const data = schema.parse(req.body);
    const member = await addOrganizationMember({
      ...data,
      organizationId: id,
      invitedBy: req.user!.id,
    });

    res.status(201).json(member);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/organizations/:id/members/:userId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, userId } = req.params;
    const member = await removeOrganizationMember(id, userId);
    res.json(member);
  } catch (err) { next(err); }
});

router.patch("/organizations/:id/members/:userId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      role: z.enum(["owner", "admin", "manager", "member"]),
      permissions: z.array(z.string()).optional(),
    });

    const { id, userId } = req.params;
    const { role, permissions } = schema.parse(req.body);
    const member = await updateMemberRole(id, userId, role, permissions);

    res.json(member);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/organizations/:id/members", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const members = await getOrganizationMembers(id);
    res.json({ members, count: members.length });
  } catch (err) { next(err); }
});

router.get("/user/organizations", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizations = await getUserOrganizations(req.user!.id);
    res.json({ organizations, count: organizations.length });
  } catch (err) { next(err); }
});

// ── Device Fleet Management ───────────────────────────────────────────────────────
router.post("/fleets", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      organizationId: z.string(),
      name: z.string().min(2).max(100),
      description: z.string().optional(),
      autoRegister: z.boolean().optional(),
      deviceLimit: z.number().optional(),
      monitoringEnabled: z.boolean().optional(),
      alertThresholds: z.object({
        riskScore: z.number().optional(),
        locationChange: z.number().optional(),
      }).optional(),
    });

    const data = schema.parse(req.body);
    const fleet = await createDeviceFleet(data);

    res.status(201).json(fleet);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/fleets/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fleet = await getDeviceFleet(id);

    if (!fleet) {
      return res.status(404).json({ error: "Fleet not found" });
    }

    res.json(fleet);
  } catch (err) { next(err); }
});

router.get("/organizations/:id/fleets", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fleets = await getOrganizationFleets(id);
    res.json({ fleets, count: fleets.length });
  } catch (err) { next(err); }
});

router.post("/fleets/:id/devices", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
    });

    const { id } = req.params;
    const { deviceId } = schema.parse(req.body);
    const fleet = await addDeviceToFleet(id, deviceId);

    res.json(fleet);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/fleets/:id/devices/:deviceId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, deviceId } = req.params;
    const fleet = await removeDeviceFromFleet(id, deviceId);
    res.json(fleet);
  } catch (err) { next(err); }
});

router.patch("/fleets/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const fleet = await updateFleetSettings(id, req.body);
    res.json(fleet);
  } catch (err) { next(err); }
});

router.get("/fleets/:id/analytics", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const analytics = await getFleetAnalytics(id);
    res.json(analytics);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getEnterpriseStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
