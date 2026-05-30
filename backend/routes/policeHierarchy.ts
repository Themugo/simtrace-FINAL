// routes/policeHierarchy.ts - Police Hierarchy, RBAC, Data Encryption, and Audit API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createHierarchyUnit,
  getHierarchyByCountry,
  getHierarchyTree,
  assignUserToHierarchy,
  revokeUserAssignment,
  createRole,
  getRolesByCountry,
  checkPermission,
  getUserAssignments,
  createAuditLog,
  getAuditLogs,
  getEntityAuditLogs,
  storeEncryptedData,
  getDecryptedData,
  requestDataAccess,
  approveDataAccess,
  revokeDataAccess,
  createCooperationAlert,
  respondToCooperationAlert,
  checkDelayedAlerts,
  createSeniorConfirmation,
  confirmBySenior,
  escalateConfirmation,
  createMissingPersonRule,
  getMissingPersonRule,
  updateMissingPersonRule,
  canDeclareMissing,
  getHierarchyStatistics,
} from "../services/policeHierarchy.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Police Hierarchy Management ─────────────────────────────────────────────────────
router.post("/hierarchy", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      country: z.string(),
      level: z.enum(["national", "division", "region", "station"]),
      parent: z.string().optional(),
      name: z.string(),
      code: z.string(),
      address: z.string().optional(),
      county: z.string().optional(),
      subCounty: z.string().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }).optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      headOfUnit: z.string().optional(),
      deputies: z.array(z.string()).optional(),
      jurisdiction: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);
    const unit = await createHierarchyUnit(data);
    res.status(201).json(unit);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/hierarchy/:country", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country } = req.params;
    const units = await getHierarchyByCountry(country);
    res.json({ units, count: units.length });
  } catch (err) { next(err); }
});

router.get("/hierarchy/:country/tree", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country } = req.params;
    const tree = await getHierarchyTree(country);
    res.json(tree);
  } catch (err) { next(err); }
});

router.post("/hierarchy/assign", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      roleId: z.string(),
      unitId: z.string(),
      validUntil: z.date().optional(),
    });

    const data = schema.parse(req.body);
    const assignment = await assignUserToHierarchy(
      data.userId,
      data.roleId,
      data.unitId,
      req.user!.id,
      data.validUntil
    );
    res.status(201).json(assignment);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/hierarchy/assignments/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { id } = req.params;
    const { reason } = schema.parse(req.body);
    const assignment = await revokeUserAssignment(id, req.user!.id, reason);
    res.json(assignment);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── RBAC System ─────────────────────────────────────────────────────────────────────
router.post("/roles", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      country: z.string(),
      roleLevel: z.enum(["national_commissioner", "regional_commissioner", "county_commander", "division_commander", "station_oc", "investigator", "admin", "officer"]),
      roleName: z.string(),
      permissions: z.array(z.object({
        resource: z.string(),
        actions: z.array(z.string()),
        scope: z.string(),
      })),
      canAssignRoles: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);
    const role = await createRole({ ...data, assignedBy: req.user!.id });
    res.status(201).json(role);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/roles/:country", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country } = req.params;
    const roles = await getRolesByCountry(country);
    res.json({ roles, count: roles.length });
  } catch (err) { next(err); }
});

router.get("/users/:userId/assignments", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const assignments = await getUserAssignments(userId);
    res.json({ assignments, count: assignments.length });
  } catch (err) { next(err); }
});

router.post("/check-permission", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      resource: z.string(),
      action: z.string(),
      scope: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const hasPermission = await checkPermission(req.user!.id, data.resource, data.action, data.scope);
    res.json({ hasPermission });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Immutable Audit Logging ─────────────────────────────────────────────────────────
router.get("/audit-logs", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: any = {};
    if (req.query.entityType) filters.entityType = req.query.entityType;
    if (req.query.entityId) filters.entityId = req.query.entityId;
    if (req.query.performedBy) filters.performedBy = req.query.performedBy;

    const logs = await getAuditLogs(filters);
    res.json({ logs, count: logs.length });
  } catch (err) { next(err); }
});

router.get("/audit-logs/:entityType/:entityId", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = req.params;
    const logs = await getEntityAuditLogs(entityType, entityId);
    res.json({ logs, count: logs.length });
  } catch (err) { next(err); }
});

// ── Data Encryption/Hashing ───────────────────────────────────────────────────────────
router.post("/encrypt", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      entityType: z.string(),
      entityId: z.string(),
      dataType: z.string(),
      data: z.string(),
    });

    const data = schema.parse(req.body);
    const encrypted = await storeEncryptedData(
      data.entityType,
      data.entityId,
      data.dataType,
      data.data,
      req.user!.id
    );
    res.status(201).json(encrypted);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/decrypt", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      entityType: z.string(),
      entityId: z.string(),
      dataType: z.string(),
    });

    const data = schema.parse(req.body);
    const decrypted = await getDecryptedData(
      data.entityType,
      data.entityId,
      data.dataType,
      req.user!.id
    );
    res.json(decrypted);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Data Access Control ─────────────────────────────────────────────────────────────
router.post("/data-access", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      entityType: z.string(),
      entityId: z.string(),
      requestedRole: z.string().optional(),
      requestedUnit: z.string().optional(),
      caseId: z.string(),
      accessType: z.enum(["view", "edit", "export"]),
      accessReason: z.string(),
      durationHours: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const accessControl = await requestDataAccess({
      ...data,
      requestedBy: req.user!.id,
    });
    res.status(201).json(accessControl);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/data-access/:id/approve", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      approvalNotes: z.string().optional(),
    });

    const { id } = req.params;
    const { approvalNotes } = schema.parse(req.body);
    const accessControl = await approveDataAccess(id, req.user!.id, approvalNotes);
    res.json(accessControl);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/data-access/:id/revoke", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { id } = req.params;
    const { reason } = schema.parse(req.body);
    const accessControl = await revokeDataAccess(id, req.user!.id, reason);
    res.json(accessControl);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Agency Cooperation Delay Alerts ─────────────────────────────────────────────────
router.post("/cooperation-alerts", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      caseId: z.string(),
      deviceId: z.string(),
      requestingUnit: z.string(),
      respondingUnit: z.string(),
      requestType: z.enum(["case_transfer", "information_request", "location_request", "evidence_request"]),
      expectedResponseHours: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const alert = await createCooperationAlert(data);
    res.status(201).json(alert);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/cooperation-alerts/:id/respond", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      response: z.string(),
    });

    const { id } = req.params;
    const { response } = schema.parse(req.body);
    const alert = await respondToCooperationAlert(id, response, req.user!.id);
    res.json(alert);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/cooperation-alerts/check-delayed", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const delayedAlerts = await checkDelayedAlerts();
    res.json({ delayedAlerts, count: delayedAlerts.length });
  } catch (err) { next(err); }
});

// ── Senior Officer Confirmation Workflow ─────────────────────────────────────────────
router.post("/senior-confirmations", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      caseId: z.string(),
      deviceId: z.string(),
      originalRequest: z.object({
        requestedBy: z.string(),
        requestedAt: z.date().optional(),
        requestType: z.string(),
        requestDetails: z.any().optional(),
      }),
      seniorOfficer: z.string(),
      seniorUnit: z.string(),
    });

    const data = schema.parse(req.body);
    const confirmation = await createSeniorConfirmation(data);
    res.status(201).json(confirmation);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/senior-confirmations/:id/confirm", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      confirmation: z.enum(["approved", "rejected", "escalated"]),
      confirmationNotes: z.string().optional(),
      overrideReason: z.string().optional(),
    });

    const { id } = req.params;
    const data = schema.parse(req.body);
    const confirmation = await confirmBySenior(
      id,
      data.confirmation,
      data.confirmationNotes,
      data.overrideReason
    );
    res.json(confirmation);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/senior-confirmations/:id/escalate", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      escalationNotes: z.string(),
    });

    const { id } = req.params;
    const { escalationNotes } = schema.parse(req.body);
    const confirmation = await escalateConfirmation(id, escalationNotes);
    res.json(confirmation);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Missing Person Declaration Rules ─────────────────────────────────────────────────
router.post("/missing-person-rules", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      country: z.string(),
      adultThreshold: z.number(),
      childThreshold: z.number(),
      elderlyThreshold: z.number(),
      immediateDeclarationConditions: z.array(z.string()).optional(),
      requiresPoliceReport: z.boolean().optional(),
      requiresMedicalCertificate: z.boolean().optional(),
      notifyFamily: z.boolean().optional(),
      notifyEmbassy: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const rule = await createMissingPersonRule(data);
    res.status(201).json(rule);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/missing-person-rules/:country", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country } = req.params;
    const rule = await getMissingPersonRule(country);
    res.json(rule);
  } catch (err) { next(err); }
});

router.patch("/missing-person-rules/:country", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { country } = req.params;
    const rule = await updateMissingPersonRule(country, req.body, req.user!.id);
    res.json(rule);
  } catch (err) { next(err); }
});

router.post("/missing-person/check", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      personAge: z.number(),
      country: z.string(),
      specialConditions: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);
    const result = await canDeclareMissing(data.personAge, data.country, data.specialConditions);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── Statistics ─────────────────────────────────────────────────────────────────────
router.get("/stats", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getHierarchyStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
