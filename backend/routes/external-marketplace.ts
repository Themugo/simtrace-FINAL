import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  verifyJijiListing,
  verifyEbayListing,
  verifyFacebookListing,
  verifyAcrossMarketplaces,
  getListingDetails,
  reportSuspiciousListing,
  getMarketplaceStatistics
} from "../services/externalMarketplace.js";

const router = Router();

type AuthRequest = Request & { user?: { id: string; role: string } }

// POST /api/external-marketplace/verify/jiji — verify Jiji listing
router.post("/verify/jiji", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      listingId: z.string(),
      imei: z.string(),
    });
    const { listingId, imei } = schema.parse(req.body);

    const verification = await verifyJijiListing(listingId, imei);
    res.json(verification);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/external-marketplace/verify/ebay — verify eBay listing
router.post("/verify/ebay", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      listingId: z.string(),
      imei: z.string(),
    });
    const { listingId, imei } = schema.parse(req.body);

    const verification = await verifyEbayListing(listingId, imei);
    res.json(verification);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/external-marketplace/verify/facebook — verify Facebook Marketplace listing
router.post("/verify/facebook", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      listingId: z.string(),
      imei: z.string(),
    });
    const { listingId, imei } = schema.parse(req.body);

    const verification = await verifyFacebookListing(listingId, imei);
    res.json(verification);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/external-marketplace/verify/all — verify across all marketplaces
router.post("/verify/all", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      listingId: z.string(),
      imei: z.string(),
      marketplaces: z.array(z.enum(['jiji', 'ebay', 'facebook'])).optional(),
    });
    const { listingId, imei, marketplaces } = schema.parse(req.body);

    const verifications = await verifyAcrossMarketplaces(listingId, imei, marketplaces);
    res.json({ verifications });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/external-marketplace/listing/:marketplace/:listingId — get listing details
router.get("/listing/:marketplace/:listingId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { marketplace, listingId } = req.params;

    const listing = await getListingDetails(String(marketplace), String(listingId));
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json(listing);
  } catch (err) { next(err); }
});

// POST /api/external-marketplace/report — report suspicious listing
router.post("/report", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      marketplace: z.enum(['jiji', 'ebay', 'facebook']),
      listingId: z.string(),
      reason: z.string(),
    });
    const { marketplace, listingId, reason } = schema.parse(req.body);

    const success = await reportSuspiciousListing(marketplace, listingId, reason);
    res.json({ success });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/external-marketplace/statistics — get marketplace verification statistics (admin only)
router.get("/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = getMarketplaceStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
