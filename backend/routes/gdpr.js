// routes/gdpr.js - GDPR Compliance API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createGdprRequest,
  getGdprRequest,
  getGdprRequestsByUser,
  processGdprRequest,
  rejectGdprRequest,
  setDataResidency,
  getDataResidency,
  updateDataResidency,
  checkGdprCompliance,
  getGdprStatistics,
  getExportUrl,
} from "../services/gdpr.js";

const router = Router();

// ── GDPR Request Management ─────────────────────────────────────────────────────
router.post("/requests", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      requestType: z.enum(["data_export", "data_deletion", "access_request", "rectification"]),
    });

    const data = schema.parse(req.body);
    const request = await createGdprRequest({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json(request);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/requests/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await getGdprRequest(id);

    if (!request) {
      return res.status(404).json({ error: "GDPR request not found" });
    }

    res.json(request);
  } catch (err) { next(err); }
});

router.get("/requests", authenticate, async (req, res, next) => {
  try {
    const requests = await getGdprRequestsByUser(req.user.id);
    res.json({ requests, count: requests.length });
  } catch (err) { next(err); }
});

router.post("/requests/:id/process", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await processGdprRequest(id, req.user.id);
    res.json(request);
  } catch (err) { next(err); }
});

router.post("/requests/:id/reject", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { id } = req.params;
    const { reason } = schema.parse(req.body);
    const request = await rejectGdprRequest(id, reason);

    res.json(request);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/requests/:id/export", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const exportUrl = await getExportUrl(id);
    res.json({ exportUrl });
  } catch (err) { next(err); }
});

// ── Data Residency Management ─────────────────────────────────────────────────────
router.post("/residency", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      region: z.enum(["eu", "us", "africa", "asia", "global"]),
      storageLocations: z.array(z.object({
        provider: z.string(),
        region: z.string(),
        dataTypes: z.array(z.string()),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const residency = await setDataResidency({
      ...data,
      userId: req.user.id,
    });

    res.status(201).json(residency);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/residency", authenticate, async (req, res, next) => {
  try {
    const residency = await getDataResidency(req.user.id);
    res.json(residency);
  } catch (err) { next(err); }
});

router.patch("/residency", authenticate, async (req, res, next) => {
  try {
    const residency = await updateDataResidency(req.user.id, req.body);
    res.json(residency);
  } catch (err) { next(err); }
});

// ── Compliance Check ───────────────────────────────────────────────────────────
router.get("/compliance", authenticate, async (req, res, next) => {
  try {
    const compliance = await checkGdprCompliance(req.user.id);
    res.json(compliance);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getGdprStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
