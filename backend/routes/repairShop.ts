// routes/repairShop.ts - Repair shop API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createRepairShop,
  getRepairShop,
  getRepairShopByEmail,
  updateRepairShop,
  suspendRepairShop,
  verifyRepairShop,
  getRepairShopsByCountry,
  getRepairShopsByRegion,
  getRepairShopsBySpecialization,
  createRepairRecord,
  getRepairRecord,
  getRepairRecordsByShop,
  getRepairRecordsByDevice,
  updateRepairRecord,
  completeRepairRecord,
  cancelRepairRecord,
  checkRepairShopPermission,
  reportRecoveryContribution,
  getRecoveryContributionsByShop,
  getRepairShopStatistics,
} from "../services/repairShop.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Repair Shop Management ───────────────────────────────────────────────────────────
router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      shopName: z.string(),
      officialEmail: z.string().email(),
      phoneNumber: z.string(),
      physicalAddress: z.string(),
      registrationNumber: z.string(),
      taxId: z.string(),
      licenseNumber: z.string(),
      countryCode: z.string(),
      region: z.string(),
      city: z.string(),
      officialEmailId: z.string(),
      securityOtpId: z.string(),
      specializations: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);
    const shop = await createRepairShop({ ...data, createdBy: req.user!.id });
    res.status(201).json(shop);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:shopId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shopId } = req.params;
    const shop = await getRepairShop(shopId as string);
    res.json(shop);
  } catch (err) { next(err); }
});

router.get("/email/:officialEmail", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { officialEmail } = req.params;
    const shop = await getRepairShopByEmail(officialEmail as string);
    res.json(shop);
  } catch (err) { next(err); }
});

router.patch("/:shopId", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shopId } = req.params;
    const shop = await updateRepairShop(shopId as string, req.body, req.user!.id);
    res.json(shop);
  } catch (err) { next(err); }
});

router.post("/:shopId/suspend", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shopId } = req.params;
    const shop = await suspendRepairShop(shopId as string, req.user!.id);
    res.json(shop);
  } catch (err) { next(err); }
});

router.post("/:shopId/verify", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shopId } = req.params;
    const shop = await verifyRepairShop(shopId as string, req.user!.id);
    res.json(shop);
  } catch (err) { next(err); }
});

router.get("/country/:countryCode", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { countryCode } = req.params;
    const shops = await getRepairShopsByCountry(countryCode as string);
    res.json({ shops, count: shops.length });
  } catch (err) { next(err); }
});

router.get("/country/:countryCode/region/:region", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { countryCode, region } = req.params;
    const shops = await getRepairShopsByRegion(countryCode as string, region as string);
    res.json({ shops, count: shops.length });
  } catch (err) { next(err); }
});

router.get("/specialization/:specialization", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { specialization } = req.params;
    const shops = await getRepairShopsBySpecialization(specialization as string);
    res.json({ shops, count: shops.length });
  } catch (err) { next(err); }
});

// ── Repair Record Management ───────────────────────────────────────────────────────────
router.post("/repairs", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      shopId: z.string(),
      customerName: z.string(),
      customerEmail: z.string().email(),
      customerPhone: z.string(),
      repairDate: z.date(),
      repairType: z.enum(["diagnostic", "hardware", "software", "screen", "battery", "other"]),
      description: z.string(),
      repairCost: z.number(),
      deviceStatusBefore: z.enum(["active", "inactive", "stolen", "recovered"]).optional(),
    });

    const data = schema.parse(req.body);
    const repair = await createRepairRecord({ ...data, createdBy: req.user!.id });
    res.status(201).json(repair);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/repairs/:repairId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { repairId } = req.params;
    const repair = await getRepairRecord(repairId as string);
    res.json(repair);
  } catch (err) { next(err); }
});

router.get("/:shopId/repairs", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shopId } = req.params;
    const repairs = await getRepairRecordsByShop(shopId as string);
    res.json({ repairs, count: repairs.length });
  } catch (err) { next(err); }
});

router.get("/repairs/device/:deviceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const repairs = await getRepairRecordsByDevice(deviceId as string);
    res.json({ repairs, count: repairs.length });
  } catch (err) { next(err); }
});

router.patch("/repairs/:repairId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { repairId } = req.params;
    const repair = await updateRepairRecord(repairId as string, req.body, req.user!.id);
    res.json(repair);
  } catch (err) { next(err); }
});

router.post("/repairs/:repairId/complete", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      findings: z.string().optional(),
      deviceStatusAfter: z.enum(["active", "inactive", "stolen", "recovered"]),
      contributedToRecovery: z.boolean().optional(),
      recoveryNotes: z.string().optional(),
    });

    const { repairId } = req.params;
    const data = schema.parse(req.body);
    const repair = await completeRepairRecord(repairId as string, data, req.user!.id);
    res.json(repair);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/repairs/:repairId/cancel", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { repairId } = req.params;
    const repair = await cancelRepairRecord(repairId as string, req.user!.id);
    res.json(repair);
  } catch (err) { next(err); }
});

// ── Permission Checks ──────────────────────────────────────────────────────────────
router.post("/:shopId/check-permission", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permission: z.string(),
    });

    const { shopId } = req.params;
    const data = schema.parse(req.body);
    const result = await checkRepairShopPermission(shopId as string, data.permission);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Recovery Contribution ───────────────────────────────────────────────────────────
router.post("/repairs/:repairId/recovery-contribution", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      notes: z.string(),
    });

    const { repairId } = req.params;
    const data = schema.parse(req.body);
    const repair = await reportRecoveryContribution(repairId as string, data, req.user!.id);
    res.json(repair);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:shopId/recovery-contributions", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shopId } = req.params;
    const contributions = await getRecoveryContributionsByShop(shopId as string);
    res.json({ contributions, count: contributions.length });
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────────
router.get("/:shopId/statistics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { shopId } = req.params;
    const stats = await getRepairShopStatistics(shopId as string);
    res.json(stats);
  } catch (err) { next(err); }
});

router.get("/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getRepairShopStatistics("all");
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
