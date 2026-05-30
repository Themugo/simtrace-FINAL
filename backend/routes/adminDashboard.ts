// routes/adminDashboard.ts - Admin dashboard API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import {
  createAdminDashboard,
  getAdminDashboard,
  getAdminDashboardByAdmin,
  updateAdminDashboard,
  updateAdminDashboardWidgets,
  updateAdminDashboardSettings,
  deleteAdminDashboard,
  getAllAdminDashboards,
  getAdminDashboardData,
} from "../services/adminDashboard.js";

const router = Router();

// ── Admin Dashboard Management ───────────────────────────────────────────────────────
router.post("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      adminId: z.string(),
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
    });

    const data = schema.parse(req.body);
    const dashboard = await createAdminDashboard(data);
    res.status(201).json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:dashboardId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await getAdminDashboard(dashboardId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.get("/admin/:adminId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const dashboard = await getAdminDashboardByAdmin(adminId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/:dashboardId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await updateAdminDashboard(dashboardId, req.body);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/:dashboardId/widgets", authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
    const dashboard = await updateAdminDashboardWidgets(dashboardId, data.widgets);
    res.json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/:dashboardId/settings", authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
    const dashboard = await updateAdminDashboardSettings(dashboardId, data.settings);
    res.json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/:dashboardId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await deleteAdminDashboard(dashboardId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboards = await getAllAdminDashboards();
    res.json({ dashboards, count: dashboards.length });
  } catch (err) { next(err); }
});

// ── Dashboard Data ───────────────────────────────────────────────────────────────────
router.get("/:dashboardId/data", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const data = await getAdminDashboardData(dashboardId);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
