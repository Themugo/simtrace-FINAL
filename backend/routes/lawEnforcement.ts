// routes/lawEnforcement.ts - Law enforcement agency API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createLawEnforcementAgency,
  getLawEnforcementAgency,
  getLawEnforcementAgencyByEmail,
  updateLawEnforcementAgency,
  suspendLawEnforcementAgency,
  verifyLawEnforcementAgency,
  getLawEnforcementAgenciesByCountry,
  getLawEnforcementAgenciesByRegion,
  getLawEnforcementAgenciesByType,
  generateLawEnforcementApiKey,
  revokeLawEnforcementApiKey,
  validateLawEnforcementApiKey,
  checkLawEnforcementPermission,
  linkHierarchyUnit,
  unlinkHierarchyUnit,
  getAgencyCases,
  getLawEnforcementStatistics,
  getLawEnforcementAgencyStatistics,
} from "../services/lawEnforcement.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Law Enforcement Agency Management ───────────────────────────────────────────────────
router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      agencyName: z.string(),
      agencyType: z.enum(["police", "fbi", "cia", "customs", "immigration", "interpol", "other"]),
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
    });

    const data = schema.parse(req.body);
    const agency = await createLawEnforcementAgency({ ...data, createdBy: req.user!.id });
    res.status(201).json(agency);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:agencyId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agencyId } = req.params;
    const agency = await getLawEnforcementAgency(agencyId);
    res.json(agency);
  } catch (err) { next(err); }
});

router.get("/email/:officialEmail", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { officialEmail } = req.params;
    const agency = await getLawEnforcementAgencyByEmail(officialEmail);
    res.json(agency);
  } catch (err) { next(err); }
});

router.patch("/:agencyId", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agencyId } = req.params;
    const agency = await updateLawEnforcementAgency(agencyId, req.body, req.user!.id);
    res.json(agency);
  } catch (err) { next(err); }
});

router.post("/:agencyId/suspend", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agencyId } = req.params;
    const agency = await suspendLawEnforcementAgency(agencyId, req.user!.id);
    res.json(agency);
  } catch (err) { next(err); }
});

router.post("/:agencyId/verify", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agencyId } = req.params;
    const agency = await verifyLawEnforcementAgency(agencyId, req.user!.id);
    res.json(agency);
  } catch (err) { next(err); }
});

router.get("/country/:countryCode", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode } = req.params;
    const agencies = await getLawEnforcementAgenciesByCountry(countryCode);
    res.json({ agencies, count: agencies.length });
  } catch (err) { next(err); }
});

router.get("/country/:countryCode/region/:region", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode, region } = req.params;
    const agencies = await getLawEnforcementAgenciesByRegion(countryCode, region);
    res.json({ agencies, count: agencies.length });
  } catch (err) { next(err); }
});

router.get("/type/:agencyType", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agencyType } = req.params;
    const agencies = await getLawEnforcementAgenciesByType(agencyType);
    res.json({ agencies, count: agencies.length });
  } catch (err) { next(err); }
});

// ── API Key Management ─────────────────────────────────────────────────────────────
router.post("/:agencyId/api-keys", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permissions: z.array(z.string()),
      expiresAt: z.date().optional(),
    });

    const { agencyId } = req.params;
    const data = schema.parse(req.body);
    const apiKey = await generateLawEnforcementApiKey(agencyId, data.permissions, data.expiresAt);
    res.json({ apiKey });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/:agencyId/api-keys/:apiKey", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agencyId, apiKey } = req.params;
    const agency = await revokeLawEnforcementApiKey(agencyId, apiKey);
    res.json(agency);
  } catch (err) { next(err); }
});

router.post("/validate-api-key", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      apiKey: z.string(),
    });

    const data = schema.parse(req.body);
    const result = await validateLawEnforcementApiKey(data.apiKey);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Permission Checks ──────────────────────────────────────────────────────────────
router.post("/:agencyId/check-permission", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permission: z.string(),
    });

    const { agencyId } = req.params;
    const data = schema.parse(req.body);
    const result = await checkLawEnforcementPermission(agencyId, data.permission);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Police Hierarchy Integration ───────────────────────────────────────────────────────
router.post("/:agencyId/hierarchy/:hierarchyUnitId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agencyId, hierarchyUnitId } = req.params;
    const agency = await linkHierarchyUnit(agencyId, hierarchyUnitId, req.user!.id);
    res.json(agency);
  } catch (err) { next(err); }
});

router.delete("/:agencyId/hierarchy/:hierarchyUnitId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agencyId, hierarchyUnitId } = req.params;
    const agency = await unlinkHierarchyUnit(agencyId, hierarchyUnitId, req.user!.id);
    res.json(agency);
  } catch (err) { next(err); }
});

// ── Case Management ───────────────────────────────────────────────────────────────────
router.get("/:agencyId/cases", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agencyId } = req.params;
    const cases = await getAgencyCases(agencyId);
    res.json(cases);
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────────
router.get("/:agencyId/statistics", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agencyId } = req.params;
    const stats = await getLawEnforcementStatistics(agencyId);
    res.json(stats);
  } catch (err) { next(err); }
});

router.get("/statistics", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getLawEnforcementAgencyStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
