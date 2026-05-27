// routes/paypal.js - PayPal Payment API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createPayPalOrder,
  capturePayPalPayment,
  getPayPalPayment,
  getPayPalPaymentsByUser,
  refundPayPalPayment,
  handlePayPalWebhook,
  convertCurrency,
  setCurrencyRate,
  getCurrencyRates,
  getPayPalStatistics,
} from "../services/paypal.js";

const router = Router();

// ── PayPal Payment Management ─────────────────────────────────────────────────────
router.post("/orders", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.string().default("USD"),
      description: z.string().optional(),
      type: z.enum(["subscription", "device_upgrade", "verification", "insurance_premium"]).optional(),
      relatedId: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const order = await createPayPalOrder({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json(order);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/capture/:orderId", authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payment = await capturePayPalPayment(orderId);
    res.json(payment);
  } catch (err) { next(err); }
});

router.get("/payments/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await getPayPalPayment(id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (err) { next(err); }
});

router.get("/payments", authenticate, async (req, res, next) => {
  try {
    const payments = await getPayPalPaymentsByUser(req.user.id);
    res.json({ payments, count: payments.length });
  } catch (err) { next(err); }
});

router.post("/payments/:id/refund", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { id } = req.params;
    const { reason } = schema.parse(req.body);
    const payment = await refundPayPalPayment(id, reason);

    res.json(payment);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── PayPal Webhook ───────────────────────────────────────────────────────────────
router.post("/webhook", async (req, res, next) => {
  try {
    const event = req.body;
    const result = await handlePayPalWebhook(event);
    res.json(result);
  } catch (err) { next(err); }
});

// ── Currency Management ─────────────────────────────────────────────────────────
router.post("/currency/convert", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      fromCurrency: z.string(),
      toCurrency: z.string(),
    });

    const { amount, fromCurrency, toCurrency } = schema.parse(req.body);
    const converted = await convertCurrency(amount, fromCurrency, toCurrency);

    res.json({ amount, fromCurrency, toCurrency, converted });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/currency/rates", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      fromCurrency: z.string(),
      toCurrency: z.string(),
      rate: z.number().positive(),
      source: z.string().default("manual"),
    });

    const data = schema.parse(req.body);
    const rate = await setCurrencyRate(data.fromCurrency, data.toCurrency, data.rate, data.source);

    res.status(201).json(rate);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/currency/rates", authenticate, async (req, res, next) => {
  try {
    const rates = await getCurrencyRates();
    res.json({ rates, count: rates.length });
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getPayPalStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
