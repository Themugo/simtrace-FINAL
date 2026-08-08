// routes/superAdmin.ts - Super admin API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  createSuperAdmin,
  getSuperAdmin,
  getSuperAdminByPersonalEmail,
  getSuperAdminByOfficialEmail,
  updateSuperAdmin,
  lockSuperAdmin,
  unlockSuperAdmin,
  addOfficialEmail,
  removeOfficialEmail,
  setPrimaryOfficialEmail,
  setBackupOfficialEmail,
  verifyOfficialEmail,
  updateSystemSettings,
  getSystemSettings,
  getManagedAdmins,
  getAdminStatistics,
  recordLogin,
  getLoginHistory,
} from "../services/superAdmin.js";

const router = Router();
// Cluster-level guard: privileged surface (added in enforcement pass)
router.use(authenticate, requireRole("super_admin"));

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Super Admin Management ─────────────────────────────────────────────────────────────
router.post("/", authenticate, requireRole("super_admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      personalEmail: z.string().email(),
      fullName: z.string(),
      phoneNumber: z.string(),
      recoveryEmail: z.string().email().optional(),
    });

    const data = schema.parse(req.body);
    const superAdmin = await createSuperAdmin(data);
    res.status(201).json(superAdmin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:superAdminId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const superAdmin = await getSuperAdmin(superAdminId as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.get("/personal-email/:personalEmail", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { personalEmail } = req.params;
    const superAdmin = await getSuperAdminByPersonalEmail(personalEmail as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.get("/official-email/:officialEmail", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { officialEmail } = req.params;
    const superAdmin = await getSuperAdminByOfficialEmail(officialEmail as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.patch("/:superAdminId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const superAdmin = await updateSuperAdmin(superAdminId as string, req.body);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/lock", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const superAdmin = await lockSuperAdmin(superAdminId as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/unlock", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const superAdmin = await unlockSuperAdmin(superAdminId as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

// ── Official Email Management ───────────────────────────────────────────────────────────
router.post("/:superAdminId/official-emails", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      isPrimary: z.boolean().optional(),
      isBackup: z.boolean().optional(),
      officialEmailId: z.string(),
      securityOtpId: z.string(),
    });

    const { superAdminId } = req.params;
    const data = schema.parse(req.body);
    const superAdmin = await addOfficialEmail(superAdminId as string, data);
    res.json(superAdmin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/:superAdminId/official-emails/:email", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId, email } = req.params;
    const superAdmin = await removeOfficialEmail(superAdminId as string, email as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/official-emails/:email/primary", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId, email } = req.params;
    const superAdmin = await setPrimaryOfficialEmail(superAdminId as string, email as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/official-emails/:email/backup", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId, email } = req.params;
    const superAdmin = await setBackupOfficialEmail(superAdminId as string, email as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/official-emails/:email/verify", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId, email } = req.params;
    const superAdmin = await verifyOfficialEmail(superAdminId as string, email as string);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

// ── System Settings Management ─────────────────────────────────────────────────────────
router.patch("/:superAdminId/system-settings", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      maintenanceMode: z.boolean().optional(),
      allowNewRegistrations: z.boolean().optional(),
      maxAdmins: z.number().optional(),
    });

    const { superAdminId } = req.params;
    const data = schema.parse(req.body);
    const superAdmin = await updateSystemSettings(superAdminId as string, data);
    res.json(superAdmin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:superAdminId/system-settings", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const settings = await getSystemSettings(superAdminId as string);
    res.json(settings);
  } catch (err) { next(err); }
});

// ── Admin Management ───────────────────────────────────────────────────────────────────
router.get("/:superAdminId/admins", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const admins = await getManagedAdmins(superAdminId as string);
    res.json({ admins, count: admins.length });
  } catch (err) { next(err); }
});

router.get("/:superAdminId/admins/statistics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const stats = await getAdminStatistics(superAdminId as string);
    res.json(stats);
  } catch (err) { next(err); }
});

// ── Login History ─────────────────────────────────────────────────────────────────────
router.post("/:superAdminId/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      ipAddress: z.string(),
      userAgent: z.string(),
      success: z.boolean(),
    });

    const { superAdminId } = req.params;
    const data = schema.parse(req.body);
    const superAdmin = await recordLogin(superAdminId as string, data.ipAddress, data.userAgent, data.success);
    res.json(superAdmin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:superAdminId/login-history", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const limit = parseInt((req.query.limit as string) || "50");
    const history = await getLoginHistory(superAdminId as string, limit);
    res.json({ history, count: history.length });
  } catch (err) { next(err); }
});

export default router;
