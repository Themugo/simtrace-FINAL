// routes/partnerMarketplace.ts - Partner Marketplace API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createPartnerListing,
  getPartnerListing,
  getPartnerListingsByUser,
  updatePartnerListing,
  deletePartnerListing,
  verifyPartnerListing,
  rejectPartnerListing,
  suspendPartnerListing,
  searchPartnerListings,
  getPartnersByCategory,
  getPartnersByCountry,
  getVerifiedPartners,
  getPendingVerifications,
  incrementPartnerViews,
  incrementPartnerClicks,
  incrementPartnerInquiries,
  getMarketplaceStatistics,
} from "../services/partnerMarketplace.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Partner Listing Management ───────────────────────────────────────────────────
router.post("/listings", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      organizationId: z.string().optional(),
      name: z.string().min(2).max(100),
      category: z.enum(["telecom", "insurance", "recovery", "verification", "other"]),
      description: z.string(),
      services: z.array(z.string()).optional(),
      countries: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      pricingModel: z.enum(["free", "paid", "freemium", "custom"]).optional(),
      pricingDetails: z.string().optional(),
      website: z.string().url().optional(),
      email: z.string().email(),
      phone: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const listing = await createPartnerListing({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(listing);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/listings/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await getPartnerListing(id);

    if (!listing) {
      return res.status(404).json({ error: "Partner listing not found" });
    }

    // Increment view count
    await incrementPartnerViews(id);

    res.json(listing);
  } catch (err) { next(err); }
});

router.get("/listings", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const listings = await getPartnerListingsByUser(req.user!.id);
    res.json({ listings, count: listings.length });
  } catch (err) { next(err); }
});

router.patch("/listings/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await updatePartnerListing(id, req.body);
    res.json(listing);
  } catch (err) { next(err); }
});

router.delete("/listings/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await deletePartnerListing(id);
    res.json(listing);
  } catch (err) { next(err); }
});

// ── Partner Verification ───────────────────────────────────────────────────────
router.post("/listings/:id/verify", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await verifyPartnerListing(id, req.user!.id);
    res.json(listing);
  } catch (err) { next(err); }
});

router.post("/listings/:id/reject", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await rejectPartnerListing(id);
    res.json(listing);
  } catch (err) { next(err); }
});

router.post("/listings/:id/suspend", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await suspendPartnerListing(id);
    res.json(listing);
  } catch (err) { next(err); }
});

// ── Partner Discovery ───────────────────────────────────────────────────────────
router.get("/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }

    const listings = await searchPartnerListings(q as string);
    res.json({ listings, count: listings.length });
  } catch (err) { next(err); }
});

router.get("/category/:category", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const listings = await getPartnersByCategory(category);
    res.json({ listings, count: listings.length });
  } catch (err) { next(err); }
});

router.get("/country/:country", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country } = req.params;
    const listings = await getPartnersByCountry(country);
    res.json({ listings, count: listings.length });
  } catch (err) { next(err); }
});

router.get("/verified", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await getVerifiedPartners();
    res.json({ listings, count: listings.length });
  } catch (err) { next(err); }
});

router.get("/pending", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listings = await getPendingVerifications();
    res.json({ listings, count: listings.length });
  } catch (err) { next(err); }
});

// ── Partner Metrics ─────────────────────────────────────────────────────────────
router.post("/listings/:id/click", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await incrementPartnerClicks(id);
    res.json(listing);
  } catch (err) { next(err); }
});

router.post("/listings/:id/inquire", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await incrementPartnerInquiries(id);
    res.json(listing);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getMarketplaceStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
