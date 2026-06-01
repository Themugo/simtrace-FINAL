// routes/telecomCompany.ts - Telecom company API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createTelecomCompany,
  getTelecomCompany,
  getTelecomCompanyByEmail,
  updateTelecomCompany,
  suspendTelecomCompany,
  verifyTelecomCompany,
  getTelecomCompaniesByCountry,
  getTelecomCompaniesByRegion,
  generateApiKey,
  revokeApiKey,
  validateApiKey,
  checkTelecomPermission,
  getTelecomStatistics,
  getTelecomCompanyStatistics,
} from "../services/telecomCompany.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Telecom Company Management ───────────────────────────────────────────────────────
router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      companyName: z.string(),
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
    const company = await createTelecomCompany({ ...data, createdBy: req.user!.id });
    res.status(201).json(company);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:companyId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const company = await getTelecomCompany(companyId);
    res.json(company);
  } catch (err) { next(err); }
});

router.get("/email/:officialEmail", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { officialEmail } = req.params;
    const company = await getTelecomCompanyByEmail(officialEmail);
    res.json(company);
  } catch (err) { next(err); }
});

router.patch("/:companyId", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const company = await updateTelecomCompany(companyId, req.body, req.user!.id);
    res.json(company);
  } catch (err) { next(err); }
});

router.post("/:companyId/suspend", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const company = await suspendTelecomCompany(companyId, req.user!.id);
    res.json(company);
  } catch (err) { next(err); }
});

router.post("/:companyId/verify", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const company = await verifyTelecomCompany(companyId, req.user!.id);
    res.json(company);
  } catch (err) { next(err); }
});

router.get("/country/:countryCode", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode } = req.params;
    const companies = await getTelecomCompaniesByCountry(countryCode);
    res.json({ companies, count: companies.length });
  } catch (err) { next(err); }
});

router.get("/country/:countryCode/region/:region", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode, region } = req.params;
    const companies = await getTelecomCompaniesByRegion(countryCode, region);
    res.json({ companies, count: companies.length });
  } catch (err) { next(err); }
});

// ── API Key Management ─────────────────────────────────────────────────────────────
router.post("/:companyId/api-keys", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permissions: z.array(z.string()),
      expiresAt: z.date().optional(),
    });

    const { companyId } = req.params;
    const data = schema.parse(req.body);
    const apiKey = await generateApiKey(companyId, data.permissions, data.expiresAt);
    res.json({ apiKey });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/:companyId/api-keys/:apiKey", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, apiKey } = req.params;
    const company = await revokeApiKey(companyId, apiKey);
    res.json(company);
  } catch (err) { next(err); }
});

router.post("/validate-api-key", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      apiKey: z.string(),
    });

    const data = schema.parse(req.body);
    const result = await validateApiKey(data.apiKey);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Permission Checks ──────────────────────────────────────────────────────────────
router.post("/:companyId/check-permission", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permission: z.string(),
    });

    const { companyId } = req.params;
    const data = schema.parse(req.body);
    const result = await checkTelecomPermission(companyId, data.permission);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────────
router.get("/:companyId/statistics", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const stats = await getTelecomStatistics(companyId);
    res.json(stats);
  } catch (err) { next(err); }
});

router.get("/statistics", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getTelecomCompanyStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
