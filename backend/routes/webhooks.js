// routes/webhooks.js - Webhook System API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createWebhookSubscription,
  getWebhookSubscription,
  getWebhookSubscriptionsByUser,
  updateWebhookSubscription,
  deleteWebhookSubscription,
  regenerateWebhookSecret,
  triggerWebhook,
  getWebhookDeliveryLogs,
  retryFailedWebhook,
  getWebhookStatistics,
  testWebhook,
  WEBHOOK_EVENTS,
} from "../services/webhooks.js";

const router = Router();

// ── Webhook Subscription Management ───────────────────────────────────────────────
router.post("/subscriptions", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      url: z.string().url(),
      events: z.array(z.string()),
      secret: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const subscription = await createWebhookSubscription({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json(subscription);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/subscriptions/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await getWebhookSubscription(id);

    if (!subscription) {
      return res.status(404).json({ error: "Webhook subscription not found" });
    }

    res.json(subscription);
  } catch (err) { next(err); }
});

router.get("/subscriptions", authenticate, async (req, res, next) => {
  try {
    const subscriptions = await getWebhookSubscriptionsByUser(req.user.id);
    res.json({ subscriptions, count: subscriptions.length });
  } catch (err) { next(err); }
});

router.patch("/subscriptions/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await updateWebhookSubscription(id, req.body);
    res.json(subscription);
  } catch (err) { next(err); }
});

router.delete("/subscriptions/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await deleteWebhookSubscription(id);
    res.json(subscription);
  } catch (err) { next(err); }
});

router.post("/subscriptions/:id/regenerate-secret", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await regenerateWebhookSecret(id);
    res.json(subscription);
  } catch (err) { next(err); }
});

router.post("/subscriptions/:id/test", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await testWebhook(id);
    res.json(delivery);
  } catch (err) { next(err); }
});

// ── Webhook Delivery Logs ───────────────────────────────────────────────────────
router.get("/subscriptions/:id/logs", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await getWebhookDeliveryLogs(id);
    res.json({ logs, count: logs.length });
  } catch (err) { next(err); }
});

router.post("/logs/:id/retry", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery = await retryFailedWebhook(id);
    res.json(delivery);
  } catch (err) { next(err); }
});

// ── Manual Webhook Trigger ───────────────────────────────────────────────────────
router.post("/trigger", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      event: z.string(),
      payload: z.any(),
    });

    const { event, payload } = schema.parse(req.body);
    const deliveries = await triggerWebhook(event, payload);

    res.json({ deliveries, count: deliveries.length });
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getWebhookStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Available Events ─────────────────────────────────────────────────────────────
router.get("/events", async (req, res, next) => {
  try {
    res.json({ events: WEBHOOK_EVENTS });
  } catch (err) { next(err); }
});

export default router;
