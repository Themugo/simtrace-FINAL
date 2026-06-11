// routes/financials.ts - Financial Projections & Revenue Tracking API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createFinancialProjection,
  getFinancialProjection,
  getProjectionsByPeriod,
  getCurrentProjection,
  updateProjectionMetrics,
  calculateRevenue,
  calculateUserMetrics,
  estimateCosts,
  updateCurrentProjections,
  getFinancialDashboard,
  generateBusinessPlanProjections,
} from "../services/financials.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Projection Management ─────────────────────────────────────────────────────────
router.post("/projections", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      period: z.enum(["monthly", "quarterly", "yearly"]),
      startDate: z.date(),
      endDate: z.date(),
      targetRevenue: z.number().optional(),
      targetUsers: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const projection = await createFinancialProjection(data);

    res.status(201).json(projection);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/projections/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const projection = await getFinancialProjection(id as string);

    if (!projection) {
      return res.status(404).json({ error: "Projection not found" });
    }

    res.json(projection);
  } catch (err) { next(err); }
});

router.get("/projections", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query;
    
    let projections;
    if (period) {
      projections = await getProjectionsByPeriod(period as string);
    } else {
      projections = await getCurrentProjection("monthly");
    }

    res.json({ projections, count: Array.isArray(projections) ? projections.length : 1 });
  } catch (err) { next(err); }
});

router.get("/projections/current/:period", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period } = req.params;
    const projection = await getCurrentProjection(period as string);
    res.json(projection);
  } catch (err) { next(err); }
});

router.patch("/projections/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const projection = await updateProjectionMetrics(id as string, req.body);
    res.json(projection);
  } catch (err) { next(err); }
});

// ── Revenue & Metrics Calculation ───────────────────────────────────────────────
router.get("/revenue", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      startDate: z.date(),
      endDate: z.date(),
    });

    const { startDate, endDate } = schema.parse(req.query);
    const revenue = await calculateRevenue(new Date(startDate as unknown as string), new Date(endDate as unknown as string));

    res.json(revenue);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/metrics/users", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      startDate: z.date(),
      endDate: z.date(),
    });

    const { startDate, endDate } = schema.parse(req.query);
    const metrics = await calculateUserMetrics(new Date(startDate as unknown as string), new Date(endDate as unknown as string));

    res.json(metrics);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/costs/:period", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period } = req.params;
    const costs = await estimateCosts(period as string);
    res.json(costs);
  } catch (err) { next(err); }
});

// ── Auto-Update Projections ─────────────────────────────────────────────────────
router.post("/projections/update", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projections = await updateCurrentProjections();
    res.json(projections);
  } catch (err) { next(err); }
});

// ── Financial Dashboard ───────────────────────────────────────────────────────
router.get("/dashboard", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dashboard = await getFinancialDashboard();
    res.json(dashboard);
  } catch (err) { next(err); }
});

// ── Business Plan Projections ─────────────────────────────────────────────────
router.post("/projections/business-plan", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projections = await generateBusinessPlanProjections();
    res.status(201).json({ projections, count: projections.length });
  } catch (err) { next(err); }
});

export default router;
