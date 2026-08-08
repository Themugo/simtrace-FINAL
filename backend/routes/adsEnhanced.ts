// routes/adsEnhanced.ts - Enhanced Advertisement Board API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createAdCampaign,
  submitCampaignForReview,
  reviewCampaign,
  updateCampaignStatus,
  trackAdEvent,
  getCampaign,
  getCampaignsByAdvertiser,
  getActiveCampaigns,
  getCampaignsByPlacement,
  selectAdForPlacement,
  deliverAd,
  optimizeCampaign,
  enableAutoOptimization,
  getCampaignAnalytics,
  getPlatformRevenue,
  getAdBoardStatistics,
} from "../services/adsEnhanced.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Campaign Management ───────────────────────────────────────────────────────────
router.post("/campaigns", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      advertiser: z.string(),
      whiteLabel: z.string().optional(),
      budget: z.object({
        total: z.number().optional(),
        daily: z.number().optional(),
        currency: z.string().optional(),
      }).optional(),
      bidding: z.object({
        strategy: z.enum(["cpc", "cpm", "cpa"]).optional(),
        maxBid: z.number().optional(),
        currentBid: z.number().optional(),
      }).optional(),
      targeting: z.object({
        locations: z.array(z.string()).optional(),
        devices: z.array(z.string()).optional(),
        userRoles: z.array(z.string()).optional(),
        userPlans: z.array(z.string()).optional(),
        imeiStatuses: z.array(z.string()).optional(),
        customAudiences: z.array(z.string()).optional(),
      }).optional(),
      creatives: z.array(z.object({
        type: z.enum(["banner", "video", "native", "interstitial"]),
        title: z.string(),
        body: z.string(),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        ctaText: z.string(),
        ctaUrl: z.string().url(),
        dimensions: z.object({
          width: z.number(),
          height: z.number(),
        }).optional(),
      })).optional(),
      placements: z.array(z.object({
        type: z.enum(["dashboard_banner", "imei_sidebar", "devices_footer", "alert_feed", "recovery_modal", "checkout_page"]),
        priority: z.number().optional(),
      })).optional(),
      schedule: z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        timeOfDay: z.object({
          start: z.string(),
          end: z.string(),
        }).optional(),
        daysOfWeek: z.array(z.number()).optional(),
      }).optional(),
    });

    const data = schema.parse(req.body);
    const campaign = await createAdCampaign({
      ...data,
      advertiser: req.user!.id,
    });

    res.status(201).json(campaign);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/campaigns/:id/submit", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await submitCampaignForReview(id as string);
    res.json(campaign);
  } catch (err) { next(err); }
});

router.post("/campaigns/:id/review", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      approved: z.boolean(),
      rejectionReason: z.string().optional(),
    });

    const { id } = req.params;
    const { approved, rejectionReason } = schema.parse(req.body);
    const campaign = await reviewCampaign(id as string, approved, rejectionReason);
    res.json(campaign);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/campaigns/:id/status", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      status: z.enum(["draft", "pending", "active", "paused", "completed", "exhausted"]),
    });

    const { id } = req.params;
    const { status } = schema.parse(req.body);
    const campaign = await updateCampaignStatus(id as string, status);
    res.json(campaign);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Campaign Queries ───────────────────────────────────────────────────────────────
router.get("/campaigns/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await getCampaign(id as string);

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json(campaign);
  } catch (err) { next(err); }
});

router.get("/campaigns", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { advertiserId, status, placement } = req.query;

    let campaigns;
    if (advertiserId) {
      campaigns = await getCampaignsByAdvertiser(advertiserId as string);
    } else if (status === "active") {
      campaigns = await getActiveCampaigns();
    } else if (placement) {
      campaigns = await getCampaignsByPlacement(placement as string);
    } else {
      return res.status(400).json({ error: "Specify advertiserId, status, or placement" });
    }

    res.json({ campaigns, count: campaigns.length });
  } catch (err) { next(err); }
});

// ── Ad Delivery & Tracking ───────────────────────────────────────────────────────
router.post("/select", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      placement: z.string(),
      user: z.object({
        id: z.string().optional(),
        role: z.string().optional(),
      }).optional(),
      location: z.object({
        country: z.string().optional(),
      }).optional(),
      imeiStatus: z.string().optional(),
    });

    const context = schema.parse(req.body);
    const campaign = await selectAdForPlacement(context);

    if (!campaign) {
      return res.json({ campaign: null, message: "No eligible campaigns" });
    }

    res.json({ campaign });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/deliver/:campaignId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;
    const context = req.body;
    const ad = await deliverAd(campaignId as string, context);
    res.json(ad);
  } catch (err) { next(err); }
});

router.post("/track", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      campaignId: z.string(),
      creativeId: z.string().optional(),
      userId: z.string().optional(),
      whiteLabelId: z.string().optional(),
      type: z.enum(["impression", "click", "conversion", "view"]),
      context: z.object({
        page: z.string().optional(),
        placement: z.string().optional(),
        deviceType: z.string().optional(),
        imei: z.string().optional(),
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }).optional(),
        ip: z.string().optional(),
        userAgent: z.string().optional(),
      }).optional(),
      attribution: z.object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        referrer: z.string().optional(),
      }).optional(),
      revenue: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const event = await trackAdEvent(data);
    res.status(201).json(event);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Campaign Optimization ─────────────────────────────────────────────────────────
router.post("/campaigns/:id/optimize", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await optimizeCampaign(id as string);
    res.json(campaign);
  } catch (err) { next(err); }
});

router.post("/campaigns/:id/auto-optimize", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = await enableAutoOptimization(id as string);
    res.json(campaign);
  } catch (err) { next(err); }
});

// ── Analytics & Revenue ───────────────────────────────────────────────────────────
router.get("/campaigns/:id/analytics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { period } = req.query;
    const analytics = await getCampaignAnalytics(id as string, period as string);
    res.json(analytics);
  } catch (err) { next(err); }
});

router.get("/revenue", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query;
    const revenue = await getPlatformRevenue(period as string);
    res.json(revenue);
  } catch (err) { next(err); }
});

router.get("/stats", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getAdBoardStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
