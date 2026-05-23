import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { Ad } from "../db/index.js";
import { serveAd, recordAdEvent, getAdStats } from "../services/ads.js";

const router = Router();


// GET /api/ads/serve?placement=dashboard_banner — serve one ad for a placement
router.get("/serve", async (req, res, next) => {
  try {
    const placement = req.query.placement || "dashboard_banner";
    const userId    = req.user?.id;                 // optional auth
    const ad = await serveAd({ placement, userId });
    res.json({ ad });                               // null if user is on paid plan
  } catch (err) { next(err); }
});


// POST /api/ads — create a new ad campaign
router.post("/", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      title:     z.string().min(3).max(80),
      body:      z.string().min(5).max(200),
      ctaText:   z.string().max(30).optional(),
      ctaUrl:    z.string().url(),
      imageUrl:  z.string().url().optional(),
      placement: z.enum(["dashboard_banner","imei_sidebar","devices_footer","alert_feed"]).optional(),
      budgetKES: z.number().min(500),
      cpcKES:    z.number().min(1).max(100).optional(),
      startDate: z.string().optional(),
      endDate:   z.string().optional(),
    });
    const data = schema.parse(req.body);
    const ad   = await Ad.create({
      ...data,
      advertiser: req.user.id,
      status: "pending",                             // admin must approve
    });
    res.status(201).json(ad);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});


// GET /api/ads/mine — advertiser's own campaigns
router.get("/mine", authenticate, async (req, res, next) => {
  try {
    const ads = await Ad.find({ advertiser: req.user.id }).sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) { next(err); }
});


// GET /api/ads/admin/all — all ads for review
router.get("/admin/all", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const ads = await Ad.find().populate("advertiser", "name email").sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) { next(err); }
});


// POST /api/ads/:id/click — record a click
router.post("/:id/click", async (req, res, next) => {
  try {
    await recordAdEvent({ adId: req.params.id, userId: req.user?.id, type: "click", ip: req.ip });
    res.json({ ok: true });
  } catch (err) { next(err); }
});


// GET /api/ads/:id/stats — campaign analytics
router.get("/:id/stats", authenticate, async (req, res, next) => {
  try {
    const stats = await getAdStats(req.params.id, req.user.id);
    if (!stats) return res.status(404).json({ error: "Ad not found" });
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Admin routes ──────────────────────────────────────────────────────────────


// PATCH /api/ads/:id/status — approve / reject / pause
router.patch("/:id/status", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = z.object({
      status: z.enum(["active","paused","rejected"])
    }).parse(req.body);

    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === "active" && { startDate: new Date() }) },
      { new: true }
    );
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    res.json(ad);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

export default router;
