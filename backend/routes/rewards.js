// routes/rewards.js - Recovery Reward System API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createRecoveryReward,
  getReward,
  getRewardsByDevice,
  getRewardsByRecipient,
  claimReward,
  payReward,
  updateReward,
  cancelReward,
  checkRewardExpiry,
  getRewardStatistics,
  getAvailableRewards,
  getRewardsByLocation,
} from "../services/rewards.js";

const router = Router();

// ── Reward Management ───────────────────────────────────────────────────────────
router.post("/rewards", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      recoveryCaseId: z.string(),
      deviceId: z.string(),
      imei: z.string(),
      rewardAmount: z.number().positive(),
      currency: z.string().default("USD"),
      expiresAt: z.date().optional(),
      terms: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const reward = await createRecoveryReward(data);

    res.status(201).json(reward);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/rewards/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await getReward(id);

    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }

    res.json(reward);
  } catch (err) { next(err); }
});

router.get("/rewards/device/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const rewards = await getRewardsByDevice(deviceId);
    res.json({ rewards, count: rewards.length });
  } catch (err) { next(err); }
});

router.get("/rewards/recipient/:recipientId", authenticate, async (req, res, next) => {
  try {
    const { recipientId } = req.params;
    const rewards = await getRewardsByRecipient(recipientId);
    res.json({ rewards, count: rewards.length });
  } catch (err) { next(err); }
});

// ── Reward Claiming ─────────────────────────────────────────────────────────────
router.post("/rewards/:id/claim", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      recipientType: z.enum(["agent", "community_member", "finder"]).optional(),
    });

    const { id } = req.params;
    const { recipientType } = schema.parse(req.body);
    const reward = await claimReward(id, req.user.id, recipientType);

    res.json(reward);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Reward Payment ─────────────────────────────────────────────────────────────
router.post("/rewards/:id/pay", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      paymentMethod: z.enum(["mpesa", "paypal", "bank_transfer", "crypto"]),
      paymentReference: z.string(),
    });

    const { id } = req.params;
    const { paymentMethod, paymentReference } = schema.parse(req.body);
    const reward = await payReward(id, paymentMethod, paymentReference);

    res.json(reward);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Reward Management ───────────────────────────────────────────────────────────
router.patch("/rewards/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await updateReward(id, req.body);
    res.json(reward);
  } catch (err) { next(err); }
});

router.post("/rewards/:id/cancel", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const reward = await cancelReward(id);
    res.json(reward);
  } catch (err) { next(err); }
});

// ── Available Rewards ───────────────────────────────────────────────────────────
router.get("/rewards/available", async (req, res, next) => {
  try {
    const { limit } = req.query;
    const rewards = await getAvailableRewards(limit ? parseInt(limit) : 50);
    res.json({ rewards, count: rewards.length });
  } catch (err) { next(err); }
});

router.get("/rewards/nearby", async (req, res, next) => {
  try {
    const { lat, lng, radius, limit } = req.query;
    const rewards = await getRewardsByLocation(
      parseFloat(lat),
      parseFloat(lng),
      radius ? parseFloat(radius) : 50,
      limit ? parseInt(limit) : 20
    );
    res.json({ rewards, count: rewards.length });
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getRewardStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Expiry Check ───────────────────────────────────────────────────────────────
router.post("/check-expiry", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const expiredCount = await checkRewardExpiry();
    res.json({ message: "Expiry check completed", expiredCount });
  } catch (err) { next(err); }
});

export default router;
