// routes/lawEnforcementDashboard.js - Law enforcement dashboard API endpoints
import { Router } from "express";
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

// ── Law Enforcement Dashboard Management ───────────────────────────────────────────────
router.post("/", authenticate, async (req, res, next) => {
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
    const dashboard = await createLawEnforcementDashboard({ ...data, createdBy: req.user.id });
    res.status(201).json(dashboard);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/:dashboardId", authenticate, async (req, res, next) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await getLawEnforcementDashboard(dashboardId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.get("/agency/:agencyId", authenticate, async (req, res, next) => {
  try {
    const { agencyId } = req.params;
    const dashboard = await getLawEnforcementDashboardByAgency(agencyId);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/:dashboardId", authenticate, async (req, res, next) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await updateLawEnforcementDashboard(dashboardId, req.body, req.user.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.patch("/:dashboardId/widgets", authenticate, async (req, res, next) => {
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
    const dashboard = await updateLawEnforcementDashboardWidgets(dashboardId, data.widgets, req.user.id);
    res.json(dashboard);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.patch("/:dashboardId/settings", authenticate, async (req, res, next) => {
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
    const dashboard = await updateLawEnforcementDashboardSettings(dashboardId, data.settings, req.user.id);
    res.json(dashboard);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/:dashboardId/users", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      userId: z.string(),
    });

    const { dashboardId } = req.params;
    const data = schema.parse(req.body);
    const dashboard = await addLawEnforcementDashboardUser(dashboardId, data.userId, req.user.id);
    res.json(dashboard);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.delete("/:dashboardId/users/:userId", authenticate, async (req, res, next) => {
  try {
    const { dashboardId, userId } = req.params;
    const dashboard = await removeLawEnforcementDashboardUser(dashboardId, userId, req.user.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.delete("/:dashboardId", authenticate, async (req, res, next) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = await deleteLawEnforcementDashboard(dashboardId, req.user.id);
    res.json(dashboard);
  } catch (err) { next(err); }
});

router.get("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const dashboards = await getAllLawEnforcementDashboards();
    res.json({ dashboards, count: dashboards.length });
  } catch (err) { next(err); }
});

// ── Dashboard Data ───────────────────────────────────────────────────────────────────
router.get("/:dashboardId/data", authenticate, async (req, res, next) => {
  try {
    const { dashboardId } = req.params;
    const data = await getLawEnforcementDashboardData(dashboardId);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
