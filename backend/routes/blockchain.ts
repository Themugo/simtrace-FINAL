// routes/blockchain.ts - Blockchain Device Ledger API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  recordBlockchainEvent,
  getDeviceBlockchainHistory,
  verifyTransaction,
  syncWithCeir,
  getBlockchainStatistics,
  recordDeviceRegistered,
  recordOwnershipTransfer,
  recordTheftReported,
  recordDeviceRecovered,
  recordDeviceBlacklisted,
  recordDnaVerified,
  recordCloneDetected,
  
  generateDeviceProof,
} from "../services/blockchain.js";

interface ZodErrorLike {
  errors: Array<{ message: string; path: (string | number)[] }>;
}

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── POST /api/blockchain/event ───────────────────────────────────────────────────
router.post("/event", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      eventType: z.enum([
        "device_registered", "ownership_transfer", "theft_reported",
        "device_recovered", "blacklisted", "whitelisted",
        "dna_verified", "clone_detected", "cross_border_request"
      ]),
      eventData: z.record(z.any()).optional(),
      fromAddress: z.string().optional(),
      toAddress: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const ledgerEntry = await recordBlockchainEvent({
      ...data,
      initiator: req.user!.id,
    });

    res.status(201).json(ledgerEntry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

// ── GET /api/blockchain/:imei/history ─────────────────────────────────────────────
router.get("/:imei/history", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const history = await getDeviceBlockchainHistory(String(imei));

    res.json({ history, count: history.length });
  } catch (err) { next(err); }
});

// ── POST /api/blockchain/verify ───────────────────────────────────────────────────
router.post("/verify", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      transactionHash: z.string(),
    });

    const { transactionHash } = schema.parse(req.body);
    const result = await verifyTransaction(transactionHash);

    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

// ── POST /api/blockchain/:imei/sync-ceir ────────────────────────────────────────────
router.post("/:imei/sync-ceir", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const { eventType } = req.body;

    const result = await syncWithCeir(String(imei), eventType);
    res.json(result);
  } catch (err) { next(err); }
});

// ── GET /api/blockchain/stats ───────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getBlockchainStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

// ── POST /api/blockchain/:imei/proof ───────────────────────────────────────────────
router.get("/:imei/proof", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const proof = await generateDeviceProof(String(imei));

    res.json(proof);
  } catch (err) { next(err); }
});

// ── Convenience endpoints for common events ──────────────────────────────────────────
router.post("/register", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      owner: z.string(),
    });

    const { imei, owner } = schema.parse(req.body);
    const entry = await recordDeviceRegistered(imei, owner);

    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/transfer", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      fromOwner: z.string(),
      toOwner: z.string(),
    });

    const { imei, fromOwner, toOwner } = schema.parse(req.body);
    const entry = await recordOwnershipTransfer(imei, fromOwner, toOwner);

    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/theft-report", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
    });

    const { imei } = schema.parse(req.body);
    const entry = await recordTheftReported(imei, req.user!.id);

    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/recovered", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
    });

    const { imei } = schema.parse(req.body);
    const entry = await recordDeviceRecovered(imei, req.user!.id);

    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/blacklist", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
    });

    const { imei } = schema.parse(req.body);
    const entry = await recordDeviceBlacklisted(imei, req.user!.id);

    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/dna-verified", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      confidence: z.number().min(0).max(100),
    });

    const { imei, confidence } = schema.parse(req.body);
    const entry = await recordDnaVerified(imei, confidence, req.user!.id);

    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/clone-detected", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      cloneCount: z.number(),
    });

    const { imei, cloneCount } = schema.parse(req.body);
    const entry = await recordCloneDetected(imei, cloneCount);

    res.status(201).json(entry);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

export default router;

