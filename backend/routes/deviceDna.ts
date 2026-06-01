// routes/deviceDna.ts - Global Device DNA API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  collectDeviceDna,
  verifyDeviceDna,
  getDeviceDna,
  searchByDnaFingerprint,
  getDnaStatistics,
  batchVerifyDna,
} from "../services/deviceDna.js";

const router = Router();

// ── POST /api/dna/collect ───────────────────────────────────────────────────────
router.post("/collect", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      chipset: z.object({
        manufacturer: z.string(),
        model: z.string(),
        socId: z.string(),
        cpuCores: z.number(),
        gpuModel: z.string(),
      }),
      radio: z.object({
        basebandVersion: z.string(),
        modemFirmware: z.string(),
        supportedBands: z.array(z.string()),
        imeiHash: z.string(),
      }),
      sensors: z.object({
        accelerometer: z.object({ bias: z.array(z.number()), scale: z.array(z.number()) }),
        gyroscope: z.object({ bias: z.array(z.number()), scale: z.array(z.number()) }),
        magnetometer: z.object({ bias: z.array(z.number()), scale: z.array(z.number()) }),
      }),
      entropy: z.object({
        bootTime: z.date(),
        uptime: z.number(),
        memoryPattern: z.string(),
        thermalProfile: z.string(),
      }),
    });

    const data = schema.parse(req.body);
    const dna = await collectDeviceDna(data);

    res.status(201).json({ dna, message: "Device DNA collected successfully" });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── POST /api/dna/verify ────────────────────────────────────────────────────────
router.post("/verify", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imei: z.string().min(15).max(17),
      providedDna: z.object({
        chipset: z.object({
          manufacturer: z.string(),
          model: z.string(),
          socId: z.string(),
          cpuCores: z.number(),
          gpuModel: z.string(),
        }).optional(),
        radio: z.object({
          basebandVersion: z.string(),
          modemFirmware: z.string(),
          supportedBands: z.array(z.string()),
          imeiHash: z.string(),
        }).optional(),
        sensors: z.object({
          accelerometer: z.object({ bias: z.array(z.number()), scale: z.array(z.number()) }),
          gyroscope: z.object({ bias: z.array(z.number()), scale: z.array(z.number()) }),
          magnetometer: z.object({ bias: z.array(z.number()), scale: z.array(z.number()) }),
        }).optional(),
        entropy: z.object({
          bootTime: z.date(),
          uptime: z.number(),
          memoryPattern: z.string(),
          thermalProfile: z.string(),
        }).optional(),
      }),
    });

    const { imei, providedDna } = schema.parse(req.body);
    const result = await verifyDeviceDna(imei, providedDna);

    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── GET /api/dna/:imei ───────────────────────────────────────────────────────────
router.get("/:imei", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imei } = req.params;
    const dna = await getDeviceDna(imei);

    if (!dna) {
      return res.status(404).json({ error: "DNA record not found" });
    }

    res.json(dna);
  } catch (err) { next(err); }
});

// ── POST /api/dna/search ─────────────────────────────────────────────────────────
router.post("/search", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      chipsetSig: z.string().optional(),
      radioSig: z.string().optional(),
      sensorSig: z.string().optional(),
    });

    const criteria = schema.parse(req.body);
    const matches = await searchByDnaFingerprint(criteria);

    res.json({ matches, count: matches.length });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── POST /api/dna/batch-verify ────────────────────────────────────────────────────
router.post("/batch-verify", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      imeiList: z.array(z.string().min(15).max(17)).min(1).max(100),
    });

    const { imeiList } = schema.parse(req.body);
    const results = await batchVerifyDna(imeiList);

    res.json({ results });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── GET /api/dna/stats ────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getDnaStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
