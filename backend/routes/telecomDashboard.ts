// routes/telecomDashboard.ts - Telecom dashboard API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin, requireRole } from "../middleware/auth.js";
import {
  createTelecomDashboard,
  getTelecomDashboard,
  getTelecomDashboardByCompany,
  updateTelecomDashboard,
  updateDashboardWidgets,
  updateDashboardSettings,
  addDashboardUser,
  removeDashboardUser,
  deleteTelecomDashboard,
  getAllTelecomDashboards,
  getDashboardData,
} from "../services/telecomDashboard.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Telecom Dashboard Management ─────────────────────────────────────────────────────
router.post("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      companyId: z.string(),
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
    const dashboard = await createTelecomDashboard({ ...data, createdBy: req.user!.id });
    res.status(201).json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:dashboardId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await getTelecomDashboard(String(dashboardId));
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.get("/company/:companyId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const dashboard = await getTelecomDashboardByCompany(String(companyId));
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await updateTelecomDashboard(String(dashboardId), req.body, req.user!.id);
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
    const dashboard = await updateDashboardWidgets(String(dashboardId), data.widgets, req.user!.id);
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
    const dashboard = await updateDashboardSettings(String(dashboardId), data.settings, req.user!.id);
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
    const dashboard = await addDashboardUser(String(dashboardId), data.userId, req.user!.id);
    res.json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/:dashboardId/users/:userId", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId, userId } = req.params;
    const dashboard = await removeDashboardUser(String(dashboardId), String(userId), req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.delete("/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await deleteTelecomDashboard(String(dashboardId), req.user!.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.get("/", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboards = await getAllTelecomDashboards();
    res.json({ dashboards, count: dashboards.length });
  } catch (err) { next(err); }
});

// ── Dashboard Data ───────────────────────────────────────────────────────────────────
router.get("/:dashboardId/data", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const data = await getDashboardData(String(dashboardId));
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
