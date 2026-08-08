// routes/analytics.ts - API endpoints for real-time analytics dashboard
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { realTimeAnalyticsService } from "../services/ai/realTimeAnalytics.js";

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
}

// ── Metrics ─────────────────────────────────────────────────────────────────────

router.post("/metrics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      deviceId: z.string().optional(),
      metadata: z.any().optional()
    });
    const { name, value, unit, deviceId, metadata } = schema.parse(req.body);

    const userId = req.user?.id;
    const metric = realTimeAnalyticsService.recordMetric(name, value, unit, deviceId, userId, metadata);
    res.json({ metric });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/metrics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, startTime, endTime, deviceId } = req.query;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: "name is required" });
    }

    const metrics = realTimeAnalyticsService.getMetrics(
      name,
      startTime ? parseInt(startTime as string) : Date.now() - 86400000,
      endTime ? parseInt(endTime as string) : Date.now(),
      deviceId as string | undefined,
      req.user?.id
    );
    res.json({ metrics });
  } catch (err) {
    next(err);
  }
});

router.get("/metrics/aggregated", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, startTime, endTime, aggregation, interval } = req.query;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: "name is required" });
    }

    const metrics = realTimeAnalyticsService.getAggregatedMetrics(
      name,
      startTime ? parseInt(startTime as string) : Date.now() - 86400000,
      endTime ? parseInt(endTime as string) : Date.now(),
      (aggregation as 'sum' | 'avg' | 'min' | 'max' | 'count') || 'avg',
      interval ? parseInt(interval as string) : 3600000
    );
    res.json({ metrics });
  } catch (err) {
    next(err);
  }
});

// ── Dashboards ───────────────────────────────────────────────────────────────────

router.post("/dashboards", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      widgets: z.array(z.any()),
      layout: z.array(z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })),
      isPublic: z.boolean().optional()
    });
    const { name, widgets, layout, isPublic } = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dashboard = realTimeAnalyticsService.createDashboard(name, userId, widgets, layout, isPublic || false);
    res.json({ dashboard });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/dashboards", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dashboards = realTimeAnalyticsService.getDashboardsForUser(userId);
    res.json({ dashboards });
  } catch (err) {
    next(err);
  }
});

router.get("/dashboards/public", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboards = realTimeAnalyticsService.getPublicDashboards();
    res.json({ dashboards });
  } catch (err) {
    next(err);
  }
});

router.get("/dashboards/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const dashboard = realTimeAnalyticsService.getDashboard(dashboardId as string);
    
    if (!dashboard) {
      return res.status(404).json({ error: "Dashboard not found" });
    }

    res.json({ dashboard });
  } catch (err) {
    next(err);
  }
});

router.put("/dashboards/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const updates = req.body;

    const dashboard = realTimeAnalyticsService.updateDashboard(dashboardId as string, updates);
    
    if (!dashboard) {
      return res.status(404).json({ error: "Dashboard not found" });
    }

    res.json({ dashboard });
  } catch (err) {
    next(err);
  }
});

router.delete("/dashboards/:dashboardId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dashboardId } = req.params;
    const success = realTimeAnalyticsService.deleteDashboard(dashboardId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Dashboard not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

// ── Alert Rules ─────────────────────────────────────────────────────────────────

router.post("/alert-rules", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      metricName: z.string(),
      condition: z.enum(['greater_than', 'less_than', 'equals', 'not_equals']),
      threshold: z.number(),
      severity: z.enum(['info', 'warning', 'error', 'critical']),
      notificationChannels: z.array(z.string())
    });
    const data = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rule = realTimeAnalyticsService.createAlertRule(userId, data.metricName, data.condition, data.threshold, data.severity, data.notificationChannels);
    res.json({ rule });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/alert-rules", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const rules = realTimeAnalyticsService.getAlertRules(userId);
    res.json({ rules });
  } catch (err) {
    next(err);
  }
});

router.put("/alert-rules/:ruleId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = realTimeAnalyticsService.updateAlertRule(ruleId as string, updates);
    
    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.json({ rule });
  } catch (err) {
    next(err);
  }
});

router.delete("/alert-rules/:ruleId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { ruleId } = req.params;
    const success = realTimeAnalyticsService.deleteAlertRule(ruleId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.get("/alerts", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const alerts = realTimeAnalyticsService.getActiveAlerts(userId);
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────

router.get("/statistics", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = realTimeAnalyticsService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

export default router;
