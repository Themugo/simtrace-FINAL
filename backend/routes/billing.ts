import express from "express";
// @ts-ignore
import Stripe from "stripe";
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { Subscription, Payment } from "../db/index.js";
import {
  PLANS, getUserSubscription, checkDeviceLimit,
  initiateMpesaSTK, processMpesaCallback, queryMpesaSTK,
  createStripeIntent, getRevenueStats,
} from "../services/billing.js";

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
}

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/plans", (req: Request, res: Response) => res.json({ plans: PLANS }));

// ── Authenticated ─────────────────────────────────────────────────────────────
router.get("/subscription", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub  = await getUserSubscription(req.user!.id);
    const plan = PLANS.find(p => p.id === sub.plan) || PLANS[0];
    const limit = await checkDeviceLimit(req.user!.id);
    res.json({ ...sub.toObject(), planDetails: plan, ...limit });
  } catch (err) { next(err); }
});

router.get("/device-limit", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await checkDeviceLimit(req.user!.id)); }
  catch (err) { next(err); }
});

router.get("/invoices", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoices = await Payment.find({ user: req.user!.id, type: { $ne: "api_call" } })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json(invoices);
  } catch (err) { next(err); }
});

// ── M-Pesa STK Push — plan upgrade ───────────────────────────────────────────
router.post("/upgrade-mpesa", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { planId, phone } = z.object({
      planId: z.enum(["pro", "business"]),
      phone:  z.string().min(9).max(13),
    }).parse(req.body);

    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ error: "Invalid plan" });

    // Store intended plan on subscription — confirmed on callback
    await Subscription.findOneAndUpdate(
      { user: req.user!.id },
      { plan: planId, mpesaPhone: phone, updatedAt: new Date() },
      { upsert: true }
    );

    const result = await initiateMpesaSTK({
      phone,
      amountKES:   plan.priceKES,
      description: `SimTrace ${plan.name} - 1 month`,
      reference:   `ST-${planId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      userId:      req.user!.id,
      paymentType: "subscription",
    });

    res.json({ message: "STK push sent. Check your phone.", ...result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── M-Pesa STK Push — extra device slot ──────────────────────────────────────
router.post("/extra-device-mpesa", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone } = z.object({ phone: z.string().min(9) }).parse(req.body);
    const sub  = await getUserSubscription(req.user!.id);
    const plan = PLANS.find(p => p.id === sub.plan) || PLANS[0];

    if (!plan.extraDeviceKES) {
      return res.status(400).json({ error: "No extra device fee for your plan" });
    }

    const result = await initiateMpesaSTK({
      phone,
      amountKES:   plan.extraDeviceKES,
      description: "SimTrace extra device slot",
      reference:   `ST-DEVICE-${Date.now().toString(36).toUpperCase()}`,
      userId:      req.user!.id,
      paymentType: "extra_device",
    });

    res.json({ message: `STK push sent — KES ${plan.extraDeviceKES} for 1 extra device slot`, ...result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Stripe payment intent ─────────────────────────────────────────────────────

router.get("/mpesa-status/:checkoutId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { checkoutId } = req.params;

    // 1. Check our DB first
    const payment = await Payment.findOne({ reference: checkoutId }).lean();
    if (payment?.status === "completed") {
      return res.json({ status: "completed", payment, message: "Payment confirmed ✅" });
    }
    if (payment?.status === "failed") {
      return res.json({ status: "failed", message: "Payment was declined or cancelled" });
    }

    // 2. Query Daraja STK status
    try {
      const daraja = await queryMpesaSTK(String(checkoutId));
      res.json({ status: "pending", daraja, message: "Waiting for M-Pesa confirmation…" });
    } catch (err) {
      console.error("[Billing] M-Pesa status query failed:", err);
      res.json({ status: "pending", message: "Waiting for M-Pesa confirmation…" });
    }
  } catch (err) { next(err); }
});

router.post("/upgrade-stripe", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { planId } = z.object({ planId: z.enum(["pro", "business"]) }).parse(req.body);
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ error: "Invalid plan" });
    const result = await createStripeIntent({
      amountUSD:   plan.priceUSD,
      userId:      req.user!.id,
      description: `SimTrace ${plan.name}`,
      planId,
    });
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Stripe webhook — MUST be mounted with express.raw() in server.js ──────────
router.post("/stripe-webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  const sig    = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
  let event: Record<string, any>;

  try {
    if (secret && sig && stripe) {
      event = stripe.webhooks.constructEvent(req.body, sig, secret) as unknown as Record<string, any>;
    } else if (process.env.NODE_ENV === "production") {
      return res.status(400).json({ error: "Webhook signature verification required" });
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err instanceof Error ? err.message : String(err)}` });
  }

  try {
    const { ProcessedWebhookEvent } = await import("../db/index.js");
    if (event.id) {
      try { await ProcessedWebhookEvent.create({ provider: "stripe", eventId: event.id, eventType: event.type }); }
      catch (e: unknown) { if ((e as Record<string, unknown>)?.code === 11000) return res.json({ received: true, duplicate: true }); throw e; }
    }
    if (event.type === "payment_intent.succeeded") {
      const intent  = event.data.object;
      const payment = await Payment.findOne({ reference: intent.id });
      if (payment && payment.status !== "completed") {
        payment.status = "completed";
        payment.paidAt = new Date();
        await payment.save();
        const planId = intent.metadata?.planId;
        const period = new Date(); period.setMonth(period.getMonth() + 1);
        await Subscription.findOneAndUpdate(
          { user: payment.user },
          { plan: planId || "pro", status: "active", currentPeriodEnd: period, updatedAt: new Date() },
          { upsert: true }
        );
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const payment = await Payment.findOne({ reference: event.data.object.id });
      if (payment) { payment.status = "failed"; await payment.save(); }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("[Stripe webhook]", err);
    res.status(500).json({ error: "Handler error" });
  }
});

// ── Admin revenue ─────────────────────────────────────────────────────────────
router.get("/revenue", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await getRevenueStats()); }
  catch (err) { next(err); }
});

// ── M-Pesa callback — Safaricom posts here ────────────────────────────────────
// IP whitelist enforced in server.js via mpesaIpWhitelist middleware
router.post("/mpesa-callback", async (req: Request, res: Response) => {
  try {
    await processMpesaCallback(req.body);
    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (err) {
    console.error("[M-Pesa callback]", err);
    res.json({ ResultCode: 0, ResultDesc: "Accepted" }); // always 200 to Safaricom
  }
});

export default router;
