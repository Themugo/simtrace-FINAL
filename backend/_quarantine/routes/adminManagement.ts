// routes/adminManagement.ts - Admin management API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import {
  createAdmin,
  getAdmin,
  getAdminByOfficialEmail,
  updateAdmin,
  suspendAdmin,
  activateAdmin,
  verifyAdmin,
  deleteAdmin,
  getAdminsBySuperAdmin,
  getAdminsByRole,
  getAdminsByLayer,
  addLayerAccess,
  removeLayerAccess,
  updateLayerPermissions,
  updateAdminRole,
  recordAdminLogin,
  getAdminLoginHistory,
  getAdminStatistics,
  getAllAdminStatistics,
} from "../services/admin.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Admin Management ─────────────────────────────────────────────────────────────────
router.post("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      officialEmail: z.string().email(),
      personalEmail: z.string().email(),
      phoneNumber: z.string(),
      fullName: z.string(),
      officialEmailId: z.string(),
      securityOtpId: z.string(),
      role: z.enum(["finance", "technical", "support", "marketing", "legal", "operations", "compliance", "audit"]),
      roleLevel: z.enum(["senior", "mid", "junior"]).optional(),
      managedBy: z.string(),
      layerAccess: z.array(z.object({
        layer: z.enum(["end_user", "seller_reseller", "repair_shop", "telecom", "law_enforcement"]),
        permissions: z.array(z.string()),
      })).optional(),
    });

    const data = schema.parse(req.body);
    const admin = await createAdmin(data);
    res.status(201).json(admin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:adminId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const admin = await getAdmin(adminId as string);
    res.json(admin);
  } catch (err) { next(err); }
});

router.get("/official-email/:officialEmail", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { officialEmail } = req.params;
    const admin = await getAdminByOfficialEmail(officialEmail as string);
    res.json(admin);
  } catch (err) { next(err); }
});

router.patch("/:adminId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const admin = await updateAdmin(adminId as string, req.body);
    res.json(admin);
  } catch (err) { next(err); }
});

router.post("/:adminId/suspend", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const admin = await suspendAdmin(adminId as string, req.user!.id);
    res.json(admin);
  } catch (err) { next(err); }
});

router.post("/:adminId/activate", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const admin = await activateAdmin(adminId as string);
    res.json(admin);
  } catch (err) { next(err); }
});

router.post("/:adminId/verify", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const admin = await verifyAdmin(adminId as string);
    res.json(admin);
  } catch (err) { next(err); }
});

router.delete("/:adminId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const admin = await deleteAdmin(adminId as string);
    res.json(admin);
  } catch (err) { next(err); }
});

router.get("/super-admin/:superAdminId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { superAdminId } = req.params;
    const admins = await getAdminsBySuperAdmin(superAdminId as string);
    res.json({ admins, count: admins.length });
  } catch (err) { next(err); }
});

router.get("/role/:role", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;
    const admins = await getAdminsByRole(role as string);
    res.json({ admins, count: admins.length });
  } catch (err) { next(err); }
});

router.get("/layer/:layer", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { layer } = req.params;
    const admins = await getAdminsByLayer(layer as string);
    res.json({ admins, count: admins.length });
  } catch (err) { next(err); }
});

// ── Layer Access Management ───────────────────────────────────────────────────────────
router.post("/:adminId/layer-access", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      layer: z.enum(["end_user", "seller_reseller", "repair_shop", "telecom", "law_enforcement"]),
      permissions: z.array(z.string()),
    });

    const { adminId } = req.params;
    const data = schema.parse(req.body);
    const admin = await addLayerAccess(adminId as string, data.layer, data.permissions);
    res.json(admin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/:adminId/layer-access/:layer", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId, layer } = req.params;
    const admin = await removeLayerAccess(adminId as string, layer as string);
    res.json(admin);
  } catch (err) { next(err); }
});

router.patch("/:adminId/layer-access/:layer", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permissions: z.array(z.string()),
    });

    const { adminId, layer } = req.params;
    const data = schema.parse(req.body);
    const admin = await updateLayerPermissions(adminId as string, layer as string, data.permissions);
    res.json(admin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Role Management ───────────────────────────────────────────────────────────────────
router.patch("/:adminId/role", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      role: z.enum(["finance", "technical", "support", "marketing", "legal", "operations", "compliance", "audit"]),
      roleLevel: z.enum(["senior", "mid", "junior"]).optional(),
    });

    const { adminId } = req.params;
    const data = schema.parse(req.body);
    const roleLevelMap: Record<string, number> = { senior: 3, mid: 2, junior: 1 };
    const admin = await updateAdminRole(adminId as string, data.role, data.roleLevel ? roleLevelMap[data.roleLevel] : undefined);
    res.json(admin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Login History ─────────────────────────────────────────────────────────────────────
router.post("/:adminId/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      ipAddress: z.string(),
      userAgent: z.string(),
      success: z.boolean(),
    });

    const { adminId } = req.params;
    const data = schema.parse(req.body);
    const admin = await recordAdminLogin(adminId as string, data.ipAddress, data.userAgent, data.success);
    res.json(admin);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:adminId/login-history", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const limit = parseInt((req.query.limit as string) || "50");
    const history = await getAdminLoginHistory(adminId as string, limit);
    res.json({ history, count: history.length });
  } catch (err) { next(err); }
});

// ── Statistics ───────────────────────────────────────────────────────────────────────
router.get("/:adminId/statistics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;
    const stats = await getAdminStatistics(adminId as string);
    res.json(stats);
  } catch (err) { next(err); }
});

router.get("/statistics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getAllAdminStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
