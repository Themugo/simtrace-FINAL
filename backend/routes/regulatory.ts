// routes/regulatory.ts - Regulatory Blocking System API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  createRegulatoryBlock,
  getRegulatoryBlock,
  getBlocksByImei,
  getBlocksByAuthority,
  getActiveBlocks,
  updateBlockStatus,
  syncWithCeir,
  syncWithNationalRegulator,
  submitAppeal,
  updateAppealStatus,
  checkBlockExpiry,
  getRegulatoryStatistics,
  checkCeirStatus,
  addToCeirBlacklist,
  removeFromCeirBlacklist,
} from "../services/regulatory.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Block Management ─────────────────────────────────────────────────────────────
router.post("/blocks", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      deviceId: z.string().optional(),
      authority: z.string(),
      authorityId: z.string(),
      country: z.string().length(2),
      blockType: z.enum(["blacklist", "greylist", "whitelist", "temporary"]),
      blockReason: z.string(),
      blockReference: z.string(),
      expiresAt: z.date().optional(),
    });

    const data = schema.parse(req.body);
    const block = await createRegulatoryBlock(data);

    res.status(201).json(block);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/blocks/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const block = await getRegulatoryBlock(id as string);

    if (!block) {
      return res.status(404).json({ error: "Block not found" });
    }

    res.json(block);
  } catch (err) { next(err); }
});

router.get("/blocks/imei/:imei", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const blocks = await getBlocksByImei(imei as string);
    res.json({ blocks, count: blocks.length });
  } catch (err) { next(err); }
});

router.get("/blocks", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { authority, country } = req.query;
    
    let blocks;
    if (authority) {
      blocks = await getBlocksByAuthority(authority as string, country as string);
    } else {
      blocks = await getActiveBlocks();
    }

    res.json({ blocks, count: blocks.length });
  } catch (err) { next(err); }
});

router.patch("/blocks/:id/status", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      status: z.enum(["active", "expired", "lifted", "appealed"]),
    });

    const { id } = req.params;
    const { status } = schema.parse(req.body);
    const block = await updateBlockStatus(id as string, status);

    res.json(block);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Sync with Authorities ───────────────────────────────────────────────────────
router.post("/sync/ceir/:imei", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const result = await syncWithCeir(imei as string);
    res.json(result);
  } catch (err) { next(err); }
});

router.post("/sync/national/:country/:imei", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { country, imei } = req.params;
    const result = await syncWithNationalRegulator(country as string, imei as string);
    res.json(result);
  } catch (err) { next(err); }
});

// ── Appeal Management ───────────────────────────────────────────────────────────
router.post("/blocks/:id/appeal", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      appealNotes: z.string(),
    });

    const { id } = req.params;
    const { appealNotes } = schema.parse(req.body);
    const block = await submitAppeal(id as string, appealNotes);

    res.json(block);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/blocks/:id/appeal", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      appealStatus: z.enum(["submitted", "under_review", "approved", "rejected"]),
    });

    const { id } = req.params;
    const { appealStatus } = schema.parse(req.body);
    const block = await updateAppealStatus(id as string, appealStatus);

    res.json(block);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── CEIR Integration ─────────────────────────────────────────────────────────────
router.get("/ceir/:imei", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const status = await checkCeirStatus(imei as string);
    res.json(status);
  } catch (err) { next(err); }
});

router.post("/ceir/blacklist", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      reason: z.string(),
      reference: z.string(),
    });

    const data = schema.parse(req.body);
    const block = await addToCeirBlacklist(data.imei, data.reason, data.reference);

    res.status(201).json(block);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/ceir/remove/:imei", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const result = await removeFromCeirBlacklist(imei as string);
    res.json(result);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getRegulatoryStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Block Expiry Check ─────────────────────────────────────────────────────────
router.post("/check-expiry", authenticate, requireRole("telecom", "admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expiredCount = await checkBlockExpiry();
    res.json({ message: "Expiry check completed", expiredCount });
  } catch (err) { next(err); }
});

export default router;
