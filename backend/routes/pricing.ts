import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { PricingConfig, User, Subscription } from "../db/index.js";
import { PLANS } from "../services/billing.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── GET /api/pricing/plans — Get all plans with custom pricing applied ─────────────
router.get("/plans", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const customPricing = await PricingConfig.find({ customForUser: userId, isActive: true });
    
    const plans = PLANS.map(plan => {
      const custom = customPricing.find(cp => cp.planId === plan.id);
      if (custom) {
        return {
          ...plan,
          priceKES: custom.priceKES ?? plan.priceKES,
          priceUSD: custom.priceUSD ?? plan.priceUSD,
          deviceLimit: custom.deviceLimit ?? plan.deviceLimit,
          extraDeviceKES: custom.extraDeviceKES ?? plan.extraDeviceKES,
          features: custom.features ?? plan.features,
          imeiChecksPerDay: custom.imeiChecksPerDay ?? plan.imeiChecksPerDay,
          aiReportsPerMonth: custom.aiReportsPerMonth ?? plan.aiReportsPerMonth,
          slaHours: custom.slaHours ?? plan.slaHours,
          discountPercent: custom.discountPercent,
          discountValidUntil: custom.discountValidUntil,
          waiverReason: custom.waiverReason,
          isCustom: true,
        };
      }
      return { ...plan, isCustom: false };
    });

    res.json({ plans });
  } catch (err) { next(err); }
});

// ── GET /api/pricing/admin/plans — Admin: Get all plans with all custom configs ───────
router.get("/admin/plans", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customConfigs = await PricingConfig.find().populate('customForUser', 'name email');
    const plans = PLANS.map(plan => ({
      ...plan,
      customConfigs: customConfigs.filter(cc => cc.planId === plan.id),
    }));
    res.json({ plans });
  } catch (err) { next(err); }
});

// ── POST /api/pricing/admin/custom — Admin: Create custom pricing for user ───────────
router.post("/admin/custom", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      planId: z.string(),
      priceKES: z.number().min(0).optional(),
      priceUSD: z.number().min(0).optional(),
      deviceLimit: z.number().min(0).optional(),
      extraDeviceKES: z.number().min(0).optional(),
      features: z.array(z.string()).optional(),
      imeiChecksPerDay: z.number().min(0).optional(),
      aiReportsPerMonth: z.number().min(0).optional(),
      slaHours: z.number().nullable().optional(),
      discountPercent: z.number().min(0).max(100).optional(),
      discountValidUntil: z.date().optional(),
      waiverReason: z.string().optional(),
    });

    const data = schema.parse(req.body);
    
    const user = await User.findById(data.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const customPricing = await PricingConfig.create({
      ...data,
      customForUser: data.userId,
      isActive: true,
    });

    res.status(201).json({ message: "Custom pricing created", customPricing });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── PATCH /api/pricing/admin/custom/:id — Admin: Update custom pricing ──────────────
router.patch("/admin/custom/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      priceKES: z.number().min(0).optional(),
      priceUSD: z.number().min(0).optional(),
      deviceLimit: z.number().min(0).optional(),
      extraDeviceKES: z.number().min(0).optional(),
      features: z.array(z.string()).optional(),
      imeiChecksPerDay: z.number().min(0).optional(),
      aiReportsPerMonth: z.number().min(0).optional(),
      slaHours: z.number().nullable().optional(),
      discountPercent: z.number().min(0).max(100).optional(),
      discountValidUntil: z.date().optional(),
      waiverReason: z.string().optional(),
      isActive: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as Record<string, unknown>;
    data.updatedAt = new Date();

    const customPricing = await PricingConfig.findByIdAndUpdate(id, data, { new: true });
    if (!customPricing) return res.status(404).json({ error: "Custom pricing not found" });

    res.json({ message: "Custom pricing updated", customPricing });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── DELETE /api/pricing/admin/custom/:id — Admin: Delete custom pricing ─────────────
router.delete("/admin/custom/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const customPricing = await PricingConfig.findByIdAndDelete(id);
    if (!customPricing) return res.status(404).json({ error: "Custom pricing not found" });

    res.json({ message: "Custom pricing deleted" });
  } catch (err) { next(err); }
});

// ── POST /api/pricing/admin/waiver — Admin: Waive price for user ─────────────────────
router.post("/admin/waiver", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      planId: z.string(),
      reason: z.string().min(10).max(500),
      durationMonths: z.number().min(1).max(36).optional(),
    });

    const data = schema.parse(req.body);
    
    const user = await User.findById(data.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const plan = PLANS.find(p => p.id === data.planId);
    if (!plan) return res.status(400).json({ error: "Invalid plan" });

    const discountValidUntil = data.durationMonths 
      ? new Date(Date.now() + data.durationMonths * 30 * 24 * 60 * 60 * 1000)
      : undefined;

    const customPricing = await PricingConfig.create({
      planId: data.planId,
      priceKES: 0,
      priceUSD: 0,
      customForUser: data.userId,
      discountPercent: 100,
      discountValidUntil,
      waiverReason: data.reason,
      isActive: true,
    });

    res.status(201).json({ message: "Price waiver applied", customPricing });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── POST /api/pricing/admin/discount — Admin: Apply discount for user ────────────────
router.post("/admin/discount", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      planId: z.string(),
      discountPercent: z.number().min(1).max(99),
      durationMonths: z.number().min(1).max(36),
      reason: z.string().min(10).max(500),
    });

    const data = schema.parse(req.body);
    
    const user = await User.findById(data.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const plan = PLANS.find(p => p.id === data.planId);
    if (!plan) return res.status(400).json({ error: "Invalid plan" });

    const discountValidUntil = new Date(Date.now() + data.durationMonths * 30 * 24 * 60 * 60 * 1000);

    const customPricing = await PricingConfig.create({
      planId: data.planId,
      customForUser: data.userId,
      discountPercent: data.discountPercent,
      discountValidUntil,
      waiverReason: data.reason,
      isActive: true,
    });

    res.status(201).json({ message: "Discount applied", customPricing });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── GET /api/pricing/admin/users/:userId — Admin: Get user's custom pricing ───────────
router.get("/admin/users/:userId", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const customPricing = await PricingConfig.find({ customForUser: userId }).populate('customForUser', 'name email');
    res.json({ customPricing });
  } catch (err) { next(err); }
});

// ── GET /api/pricing/admin/stats — Admin: Get pricing statistics ─────────────────────
router.get("/admin/stats", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalCustom, activeWaivers, activeDiscounts, expiringSoon] = await Promise.all([
      PricingConfig.countDocuments(),
      PricingConfig.countDocuments({ discountPercent: 100, isActive: true }),
      PricingConfig.countDocuments({ discountPercent: { $gt: 0, $lt: 100 }, isActive: true }),
      PricingConfig.countDocuments({
        discountValidUntil: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        isActive: true,
      }),
    ]);

    res.json({
      totalCustomPricing: totalCustom,
      activeWaivers,
      activeDiscounts,
      expiringSoon,
    });
  } catch (err) { next(err); }
});

export default router;
