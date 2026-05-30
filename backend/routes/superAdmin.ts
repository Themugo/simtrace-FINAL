// routes/superAdmin.ts - Super admin API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
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

// ── Super Admin Management ─────────────────────────────────────────────────────────────
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
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

router.get("/:superAdminId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const superAdmin = await getSuperAdmin(superAdminId);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.get("/personal-email/:personalEmail", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { personalEmail } = req.params;
    const superAdmin = await getSuperAdminByPersonalEmail(personalEmail);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.get("/official-email/:officialEmail", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { officialEmail } = req.params;
    const superAdmin = await getSuperAdminByOfficialEmail(officialEmail);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.patch("/:superAdminId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const superAdmin = await updateSuperAdmin(superAdminId, req.body);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/lock", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const superAdmin = await lockSuperAdmin(superAdminId);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/unlock", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const superAdmin = await unlockSuperAdmin(superAdminId);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

// ── Official Email Management ───────────────────────────────────────────────────────────
router.post("/:superAdminId/official-emails", authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
    const superAdmin = await addOfficialEmail(superAdminId, data);
    res.json(superAdmin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/:superAdminId/official-emails/:email", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId, email } = req.params;
    const superAdmin = await removeOfficialEmail(superAdminId, email);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/official-emails/:email/primary", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId, email } = req.params;
    const superAdmin = await setPrimaryOfficialEmail(superAdminId, email);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/official-emails/:email/backup", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId, email } = req.params;
    const superAdmin = await setBackupOfficialEmail(superAdminId, email);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

router.post("/:superAdminId/official-emails/:email/verify", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId, email } = req.params;
    const superAdmin = await verifyOfficialEmail(superAdminId, email);
    res.json(superAdmin);
  } catch (err) { next(err); }
});

// ── System Settings Management ─────────────────────────────────────────────────────────
router.patch("/:superAdminId/system-settings", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      maintenanceMode: z.boolean().optional(),
      allowNewRegistrations: z.boolean().optional(),
      maxAdmins: z.number().optional(),
    });

    const { superAdminId } = req.params;
    const data = schema.parse(req.body);
    const superAdmin = await updateSystemSettings(superAdminId, data);
    res.json(superAdmin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:superAdminId/system-settings", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const settings = await getSystemSettings(superAdminId);
    res.json(settings);
  } catch (err) { next(err); }
});

// ── Admin Management ───────────────────────────────────────────────────────────────────
router.get("/:superAdminId/admins", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const admins = await getManagedAdmins(superAdminId);
    res.json({ admins, count: admins.length });
  } catch (err) { next(err); }
});

router.get("/:superAdminId/admins/statistics", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const stats = await getAdminStatistics(superAdminId);
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
    const superAdmin = await recordLogin(superAdminId, data.ipAddress, data.userAgent, data.success);
    res.json(superAdmin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:superAdminId/login-history", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const limit = parseInt((req.query.limit as string) || "50");
    const history = await getLoginHistory(superAdminId, limit);
    res.json({ history, count: history.length });
  } catch (err) { next(err); }
});

export default router;
