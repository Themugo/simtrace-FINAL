// routes/stripeEnhanced.ts - Enhanced Stripe API endpoints for Visa/Mastercard
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createEnhancedPaymentIntent,
  createPaymentMethod,
  getSavedPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  chargeSavedPaymentMethod,
  processRefund,
  getExchangeRate,
  getSupportedCurrencies,
  getCardTypeStatistics,
} from "../services/stripeEnhanced.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Payment Intent Creation ───────────────────────────────────────────────────────
router.post("/payment-intents", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.string(),
      description: z.string().optional(),
      paymentMethodTypes: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
    });

    const data = schema.parse(req.body);
    const paymentIntent = await createEnhancedPaymentIntent({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(paymentIntent);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Payment Method Management ─────────────────────────────────────────────────────
router.post("/payment-methods", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      paymentMethodId: z.string(),
      cardholderName: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const paymentMethod = await createPaymentMethod({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(paymentMethod);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/payment-methods", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const paymentMethods = await getSavedPaymentMethods(req.user!.id);
    res.json({ paymentMethods, count: paymentMethods.length });
  } catch (err) { next(err); }
});

router.delete("/payment-methods/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await deletePaymentMethod(req.user!.id, id);
    res.json(result);
  } catch (err) { next(err); }
});

router.post("/payment-methods/:id/default", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await setDefaultPaymentMethod(req.user!.id, id);
    res.json(result);
  } catch (err) { next(err); }
});

// ── Charge Saved Payment Method ───────────────────────────────────────────────────
router.post("/charge", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      paymentMethodId: z.string(),
      amount: z.number().positive(),
      currency: z.string(),
      description: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const data = schema.parse(req.body);
    const payment = await chargeSavedPaymentMethod({
      ...data,
      userId: req.user!.id,
    });

    res.json(payment);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Refunds ───────────────────────────────────────────────────────────────────────
router.post("/refunds/:paymentId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      reason: z.string().optional(),
    });

    const { paymentId } = req.params;
    const { reason } = schema.parse(req.body);
    const refund = await processRefund(paymentId, reason);

    res.json(refund);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Currency Management ───────────────────────────────────────────────────────────
router.get("/exchange-rate", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "from and to currencies required" });
    }

    const rate = await getExchangeRate(from as string, to as string);
    res.json(rate);
  } catch (err) { next(err); }
});

router.get("/currencies", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currencies = getSupportedCurrencies();
    res.json({ currencies });
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getCardTypeStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
