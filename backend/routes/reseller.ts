// routes/reseller.ts - Phone Reseller & Repair Shop Portal API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createResellerProfile,
  getResellerProfile,
  getResellerByUser,
  updateResellerProfile,
  verifyReseller,
  updateResellerStatus,
  addInventoryItem,
  updateInventoryItem,
  removeInventoryItem,
  recordTransaction,
  getResellersByType,
  getResellersByCountry,
  getVerifiedResellers,
  getPendingVerification,
  searchResellers,
  addResellerRating,
  getResellerStatistics,
  verifyDeviceForReseller,
} from "../services/reseller.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Reseller Profile Management ───────────────────────────────────────────────────
router.post("/profile", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      businessName: z.string().min(2).max(100),
      businessType: z.enum(["reseller", "repair_shop", "both"]),
      licenseNumber: z.string(),
      address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        region: z.string().optional(),
        country: z.string(),
        postalCode: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
      phone: z.string(),
      email: z.string().email(),
      services: z.array(z.string()),
    });

    const data = schema.parse(req.body);
    const reseller = await createResellerProfile({
      ...data,
      userId: req.user!.id,
    });

    res.status(201).json(reseller);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/profile", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reseller = await getResellerByUser(req.user!.id);

    if (!reseller) {
      return res.status(404).json({ error: "Reseller profile not found" });
    }

    res.json(reseller);
  } catch (err) { next(err); }
});

router.get("/profile/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reseller = await getResellerProfile(id);

    if (!reseller) {
      return res.status(404).json({ error: "Reseller not found" });
    }

    res.json(reseller);
  } catch (err) { next(err); }
});

router.patch("/profile", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reseller = await getResellerByUser(req.user!.id);
    if (!reseller) {
      return res.status(404).json({ error: "Reseller profile not found" });
    }

    const updated = await updateResellerProfile(reseller._id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
});

router.post("/profile/:id/verify", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const reseller = await verifyReseller(id, req.user!.id);
    res.json(reseller);
  } catch (err) { next(err); }
});

router.patch("/profile/:id/status", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      status: z.enum(["active", "suspended", "inactive"]),
    });

    const { id } = req.params;
    const { status } = schema.parse(req.body);
    const reseller = await updateResellerStatus(id, status);

    res.json(reseller);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Inventory Management ───────────────────────────────────────────────────────
router.post("/inventory", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reseller = await getResellerByUser(req.user!.id);
    if (!reseller) {
      return res.status(404).json({ error: "Reseller profile not found" });
    }

    const schema = z.object({
      deviceId: z.string(),
      status: z.enum(["in_stock", "sold", "reserved", "repair"]).default("in_stock"),
      price: z.number(),
    });

    const item = schema.parse(req.body);
    const updated = await addInventoryItem(reseller._id, item);

    res.json(updated);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/inventory/:inventoryId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reseller = await getResellerByUser(req.user!.id);
    if (!reseller) {
      return res.status(404).json({ error: "Reseller profile not found" });
    }

    const { inventoryId } = req.params;
    const updated = await updateInventoryItem(reseller._id, inventoryId, req.body);

    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/inventory/:inventoryId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reseller = await getResellerByUser(req.user!.id);
    if (!reseller) {
      return res.status(404).json({ error: "Reseller profile not found" });
    }

    const { inventoryId } = req.params;
    const updated = await removeInventoryItem(reseller._id, inventoryId);

    res.json(updated);
  } catch (err) { next(err); }
});

router.post("/transactions", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reseller = await getResellerByUser(req.user!.id);
    if (!reseller) {
      return res.status(404).json({ error: "Reseller profile not found" });
    }

    const schema = z.object({
      type: z.enum(["sale", "purchase", "repair"]),
      imei: z.string(),
      amount: z.number(),
    });

    const transaction = schema.parse(req.body);
    const updated = await recordTransaction(reseller._id, transaction);

    res.json(updated);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Reseller Queries ───────────────────────────────────────────────────────────
router.get("/", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { businessType, country, status } = req.query;

    let resellers;
    if (businessType) {
      resellers = await getResellersByType(businessType as string);
    } else if (country) {
      resellers = await getResellersByCountry(country as string);
    } else if (status === "verified") {
      resellers = await getVerifiedResellers();
    } else if (status === "pending") {
      resellers = await getPendingVerification();
    } else {
      return res.status(400).json({ error: "Specify businessType, country, or status" });
    }

    res.json({ resellers, count: resellers.length });
  } catch (err) { next(err); }
});

router.get("/search", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search query required" });
    }

    const resellers = await searchResellers(q as string);
    res.json({ resellers, count: resellers.length });
  } catch (err) { next(err); }
});

// ── Rating & Reviews ───────────────────────────────────────────────────────────
router.post("/profile/:id/rating", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      rating: z.number().min(0).max(5),
      review: z.string().optional(),
    });

    const { id } = req.params;
    const { rating, review } = schema.parse(req.body);
    const reseller = await addResellerRating(id, rating, review);

    res.json(reseller);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Device Verification ───────────────────────────────────────────────────────
router.post("/verify-device", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
    });

    const { imei } = schema.parse(req.body);
    const result = await verifyDeviceForReseller(imei);

    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getResellerStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
