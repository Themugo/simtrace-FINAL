// routes/publicApi.js - Public API Key Management endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createApiKey,
  getApiKey,
  getApiKeysByUser,
  getApiKeysByOrganization,
  updateApiKey,
  revokeApiKey,
  deleteApiKey,
  authenticateApiKey,
  checkApiKeyRateLimit,
  checkApiKeyScope,
  getApiKeyStatistics,
  API_SCOPES,
} from "../services/publicApi.js";

const router = Router();

// ── API Key Management ───────────────────────────────────────────────────────────
router.post("/keys", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      keyName: z.string().min(1).max(100),
      organizationId: z.string().optional(),
      scopes: z.array(z.string()).optional(),
      rateLimit: z.number().optional(),
      expiresAt: z.date().optional(),
    });

    const data = schema.parse(req.body);
    const apiKey = await createApiKey({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json(apiKey);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/keys/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = await getApiKey(id);

    if (!key) {
      return res.status(404).json({ error: "API key not found" });
    }

    res.json(key);
  } catch (err) { next(err); }
});

router.get("/keys", authenticate, async (req, res, next) => {
  try {
    const { organizationId } = req.query;

    let keys;
    if (organizationId) {
      keys = await getApiKeysByOrganization(organizationId);
    } else {
      keys = await getApiKeysByUser(req.user.id);
    }

    res.json({ keys, count: keys.length });
  } catch (err) { next(err); }
});

router.patch("/keys/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = await updateApiKey(id, req.body);
    res.json(key);
  } catch (err) { next(err); }
});

router.post("/keys/:id/revoke", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = await revokeApiKey(id);
    res.json(key);
  } catch (err) { next(err); }
});

router.delete("/keys/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = await deleteApiKey(id);
    res.json(key);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getApiKeyStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Available Scopes ─────────────────────────────────────────────────────────────
router.get("/scopes", async (req, res, next) => {
  try {
    res.json(API_SCOPES);
  } catch (err) { next(err); }
});

export default router;
