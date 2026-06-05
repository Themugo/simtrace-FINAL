// routes/lawEnforcementDashboard.ts - Law enforcement dashboard API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createLawEnforcementDashboard,
  getLawEnforcementDashboard,
  getLawEnforcementDashboardByAgency,
  updateLawEnforcementDashboard,
  updateLawEnforcementDashboardWidgets,
  updateLawEnforcementDashboardSettings,
  addLawEnforcementDashboardUser,
  removeLawEnforcementDashboardUser,
  deleteLawEnforcementDashboard,
  getAllLawEnforcementDashboards,
  getLawEnforcementDashboardData,
} from "../services/lawEnforcementDashboard.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Law Enforcement Dashboard Management ───────────────────────────────────────────────
router.post("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      agencyId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      settings: z.object({
        refreshInterval: z.number().optional(),
        enableAlerts: z.boolean().optional(),
        enableNotifications: z.boolean().optional(),
        timezone: z.string().optional(),
      }).optional(),
      widgets: z.array(z.object({
        type: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
        }),
        config: z.any(),
      })).optional(),
      allowedUsers: z.array(z.string()).optional(),
      allowedRoles: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);
    const dashboard = await createLawEnforcementDashboard({ ...data, createdBy: req.user!.id });
    res.status(201).json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await getLawEnforcementDashboard(dashboardId as string);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.get("/agency/:agencyId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agencyId } = req.params;
    const dashboard = await getLawEnforcementDashboardByAgency(agencyId as string);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await updateLawEnforcementDashboard(dashboardId as string, req.body, req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/:dashboardId/widgets", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      widgets: z.array(z.object({
        type: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
        }),
        config: z.any(),
      })),
    });

    const { dashboardId } = req.params;
    const data = schema.parse(req.body);
    const dashboard = await updateLawEnforcementDashboardWidgets(dashboardId as string, data.widgets, req.user!.id);
    res.json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/:dashboardId/settings", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      settings: z.object({
        refreshInterval: z.number().optional(),
        enableAlerts: z.boolean().optional(),
        enableNotifications: z.boolean().optional(),
        timezone: z.string().optional(),
      }),
    });

    const { dashboardId } = req.params;
    const data = schema.parse(req.body);
    const dashboard = await updateLawEnforcementDashboardSettings(dashboardId as string, data.settings, req.user!.id);
    res.json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:dashboardId/users", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
    });

    const { dashboardId } = req.params;
    const data = schema.parse(req.body);
    const dashboard = await addLawEnforcementDashboardUser(dashboardId as string, data.userId, req.user!.id);
    res.json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/:dashboardId/users/:userId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId, userId } = req.params;
    const dashboard = await removeLawEnforcementDashboardUser(dashboardId as string, userId as string, req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.delete("/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await deleteLawEnforcementDashboard(dashboardId as string, req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dashboards = await getAllLawEnforcementDashboards();
    res.json({ dashboards, count: dashboards.length });
  } catch (err) { next(err); }
});

// ── Dashboard Data ───────────────────────────────────────────────────────────────────
router.get("/:dashboardId/data", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const data = await getLawEnforcementDashboardData(dashboardId as string);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
