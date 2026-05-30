// routes/adminRole.ts - Admin role and permission API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import {
  createAdminRolePermission,
  getAdminRolePermission,
  getAllAdminRolePermissions,
  updateAdminRolePermission,
  updateLayerPermissions,
  updateSystemPermissions,
  deactivateAdminRolePermission,
  activateAdminRolePermission,
  checkAdminPermission,
  checkSystemPermission,
  initializeDefaultRoles,
} from "../services/adminRole.js";

const router = Router();

// ── Admin Role Permission Management ───────────────────────────────────────────────────
router.post("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      role: z.enum(["finance", "technical", "support", "marketing", "legal", "operations", "compliance", "audit"]),
      description: z.string().optional(),
      layerPermissions: z.array(z.object({
        layer: z.enum(["end_user", "seller_reseller", "repair_shop", "telecom", "law_enforcement"]),
        permissions: z.array(z.string()),
      })),
      systemPermissions: z.array(z.string()),
    });

    const data = schema.parse(req.body);
    const rolePermission = await createAdminRolePermission(data);
    res.status(201).json(rolePermission);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:role", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;
    const rolePermission = await getAdminRolePermission(role);
    res.json(rolePermission);
  } catch (err) { next(err); }
});

router.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rolePermissions = await getAllAdminRolePermissions();
    res.json({ rolePermissions, count: rolePermissions.length });
  } catch (err) { next(err); }
});

router.patch("/:role", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;
    const rolePermission = await updateAdminRolePermission(role, req.body);
    res.json(rolePermission);
  } catch (err) { next(err); }
});

router.patch("/:role/layer/:layer", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permissions: z.array(z.string()),
    });

    const { role, layer } = req.params;
    const data = schema.parse(req.body);
    const rolePermission = await updateLayerPermissions(role, layer, data.permissions);
    res.json(rolePermission);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.patch("/:role/system-permissions", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      systemPermissions: z.array(z.string()),
    });

    const { role } = req.params;
    const data = schema.parse(req.body);
    const rolePermission = await updateSystemPermissions(role, data.systemPermissions);
    res.json(rolePermission);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:role/deactivate", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;
    const rolePermission = await deactivateAdminRolePermission(role);
    res.json(rolePermission);
  } catch (err) { next(err); }
});

router.post("/:role/activate", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.params;
    const rolePermission = await activateAdminRolePermission(role);
    res.json(rolePermission);
  } catch (err) { next(err); }
});

// ── Permission Checking ───────────────────────────────────────────────────────────────
router.post("/:role/check-permission", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      layer: z.enum(["end_user", "seller_reseller", "repair_shop", "telecom", "law_enforcement"]),
      permission: z.string(),
    });

    const { role } = req.params;
    const data = schema.parse(req.body);
    const result = await checkAdminPermission(role, data.layer, data.permission);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:role/check-system-permission", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      permission: z.string(),
    });

    const { role } = req.params;
    const data = schema.parse(req.body);
    const result = await checkSystemPermission(role, data.permission);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Initialize Default Roles ───────────────────────────────────────────────────────────
router.post("/initialize-default-roles", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await initializeDefaultRoles();
    res.json({ roles, count: roles.length });
  } catch (err) { next(err); }
});

export default router;
