// services/policeHierarchy.ts - Police Hierarchy, RBAC, Data Encryption, and Audit System
import crypto from "crypto";
import {
  PoliceHierarchy,
  PoliceRole,
  PoliceUserAssignment,
  AuditLog,
  EncryptedData,
  DataAccessControl,
  CooperationAlert,
  SeniorConfirmation,
  MissingPersonRule,
  
  
  
} from "../db/index.js";
import { getIO } from "./socket.js";

// ── Minimal interfaces for document property access ──────────────────────────
interface IAssignmentDoc {
  status: string;
  revokedBy?: string;
  revokedAt?: Date;
  revocationReason?: string;
  role?: {
    _id: unknown;
    permissions: Array<{ resource: string; actions: string[]; scope: string }>;
  };
}
interface IEncryptedDoc {
  owner: { toString(): string };
  encryptedData: string;
  iv?: string;
  encryptionKey?: string;
  authTag: string;
  status: string;
  caseId?: string | null;
  accessGrantedAt?: Date | null;
  accessExpiresAt?: Date | null;
  authorizedViewers: string[];
  accessReason?: string | null;
}
interface IAccessControlDoc {
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  approvalNotes?: string;
  revokedBy?: string;
  revokedAt?: Date;
  revocationReason?: string;
  entityType: string;
  entityId: string;
  accessLog: Array<{
    timestamp: Date;
    action: string;
    performedBy: string;
    details: string;
  }>;
  requestedBy: string;
  expiresAt: Date;
  caseId: string;
  accessReason?: string;
}
interface ICooperationAlertDoc {
  expectedResponseBy: Date;
  requestingUnit: string;
  respondingUnit: string;
  respondedAt?: Date;
  status: string;
  isDelayed?: boolean;
  delayDuration?: number;
  escalationLevel?: string;
}
interface ISeniorConfirmationDoc {
  confirmedAt?: Date;
  confirmation: string;
  confirmationNotes: string;
  overrideReason: string;
  status: string;
  auditTrail: Array<{
    timestamp: Date;
    action: string;
    performedBy: string;
    notes: string;
  }>;
  seniorOfficer: string;
  seniorUnit: string;
}
interface IMissingPersonRuleDoc {
  immediateDeclarationConditions: string[];
  childThreshold: number;
  elderlyThreshold: number;
  adultThreshold: number;
}
interface IEncryptedResult {
  encryptedData: string;
  iv: string;
  authTag: string;
}

// ── Police Hierarchy Management ───────────────────────────────────────────────────────
export async function createHierarchyUnit(data: Record<string, unknown>) {
  const unit = await PoliceHierarchy.create(data);
  return unit;
}

export async function getHierarchyByCountry(country: string) {
  const units = await PoliceHierarchy.find({ country, status: "active" })
    .sort({ level: 1, name: 1 });
  return units;
}

export async function getHierarchyTree(country: string) {
  const units = await PoliceHierarchy.find({ country, status: "active" })
    .sort({ level: 1 });
  
  // Build tree structure
  const tree: Record<string, (typeof units)[number][]> = {};
  units.forEach((unit) => {
    if (!tree[unit.level]) tree[unit.level] = [];
    tree[unit.level].push(unit);
  });
  
  return tree;
}

export async function assignUserToHierarchy(userId: string, roleId: string, unitId: string, assignedBy: string, validUntil: Date | null = null) {
  const assignment = await PoliceUserAssignment.create({
    user: userId,
    role: roleId,
    hierarchyUnit: unitId,
    assignedBy,
    validFrom: new Date(),
    validUntil,
    status: "active",
  });

  // Log the assignment
  await createAuditLog({
    entityType: "PoliceUserAssignment",
    entityId: assignment._id.toString(),
    action: "create",
    performedBy: assignedBy,
    actionDetails: { userId, roleId, unitId },
  });

  return assignment;
}

export async function revokeUserAssignment(assignmentId: string, revokedBy: string, reason: string) {
  const assignment = await PoliceUserAssignment.findById(assignmentId);
  if (!assignment) throw new Error("Assignment not found");

  const a = assignment as unknown as IAssignmentDoc;
  a.status = "revoked";
  a.revokedBy = revokedBy;
  a.revokedAt = new Date();
  a.revocationReason = reason;
  assignment.updatedAt = new Date();
  await assignment.save();

  // Log the revocation
  await createAuditLog({
    entityType: "PoliceUserAssignment",
    entityId: assignmentId,
    action: "revoke",
    performedBy: revokedBy,
    reason,
  });

  return assignment;
}

// ── RBAC System ─────────────────────────────────────────────────────────────────────
export async function createRole(data: Record<string, unknown>) {
  const role = await PoliceRole.create(data);
  return role;
}

export async function getRolesByCountry(country: string) {
  const roles = await PoliceRole.find({ country, status: "active" })
    .sort({ roleLevel: 1 });
  return roles;
}

export async function checkPermission(userId: string, resource: string, action: string, scope: string): Promise<boolean> {
  const assignment = await PoliceUserAssignment.findOne({
    user: userId,
    status: "active",
  }).populate("role");

  if (!assignment) return false;

  const role = (assignment as unknown as IAssignmentDoc).role!;
  const permission = role.permissions.find((p: { resource: string; actions: string[]; scope: string }) => p.resource === resource);

  if (!permission) return false;
  if (!permission.actions.includes(action)) return false;
  if (scope && permission.scope !== scope && permission.scope !== "all") return false;

  return true;
}

export async function getUserAssignments(userId: string) {
  const assignments = await PoliceUserAssignment.find({ user: userId, status: "active" })
    .populate("role")
    .populate("hierarchyUnit")
    .populate("assignedBy", "name email");
  return assignments;
}

// ── Immutable Audit Logging ─────────────────────────────────────────────────────────
export async function createAuditLog(data: Record<string, unknown>) {
  const log = await AuditLog.create({
    ...data,
    timestamp: new Date(),
    immutable: true,
  });
  return log;
}

export async function getAuditLogs(filters: Record<string, unknown> = {}) {
  const logs = await AuditLog.find(filters)
    .populate("performedBy", "name email")
    .sort({ timestamp: -1 })
    .limit(100);
  return logs;
}

export async function getEntityAuditLogs(entityType: string, entityId: string) {
  const logs = await AuditLog.find({ entityType, entityId })
    .populate("performedBy", "name email")
    .sort({ timestamp: -1 });
  return logs;
}

// ── Data Encryption/Hashing ───────────────────────────────────────────────────────────
const ALGORITHM = "aes-256-gcm";

// Derive a 32-byte key from the env secret (provide it from a KMS / secret store
// in production). The key is NEVER persisted with the ciphertext. Fail-closed in
// production if unset; deterministic insecure key in dev so round-trips work.
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required in production (provide via KMS/secret store)");
    }
    return crypto.createHash("sha256").update("dev-only-insecure-key").digest();
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function encryptData(data: string): IEncryptedResult {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptData(encryptedData: string, iv: string, authTag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function storeEncryptedData(entityType: string, entityId: string, dataType: string, data: string, owner: string) {
  const originalHash = hashData(data);
  const { encryptedData, iv, authTag } = encryptData(data);

  const encrypted = await EncryptedData.create({
    entityType,
    entityId,
    dataType,
    originalHash,
    encryptedData,
    iv,
    authTag,
    encryptionAlgorithm: ALGORITHM,
    owner,
    status: "encrypted",
  });

  return encrypted;
}

export async function getDecryptedData(entityType: string, entityId: string, dataType: string, requester: string, caseId: string) {
  const encrypted = await EncryptedData.findOne({
    entityType,
    entityId,
    dataType,
    status: "encrypted",
  });

  if (!encrypted) throw new Error("Encrypted data not found");

  // Check if requester is owner
  const enc = encrypted as unknown as IEncryptedDoc;
  if (enc.owner.toString() === requester.toString()) {
    const decrypted = decryptData(enc.encryptedData, enc.iv ?? enc.encryptionKey ?? "", enc.authTag);
    return decrypted;
  }

  // Check if there's an active case with access
  const accessControl = await DataAccessControl.findOne({
    entityType,
    entityId,
    caseId,
    requestedBy: requester,
    status: "approved",
    expiresAt: { $gt: new Date() },
  });

  if (!accessControl) throw new Error("Access denied");

  const decrypted = decryptData(enc.encryptedData, enc.iv ?? enc.encryptionKey ?? "", enc.authTag);
  
  // Log access
  const ac = accessControl as unknown as IAccessControlDoc;
  ac.accessLog.push({
    timestamp: new Date(),
    action: "view",
    performedBy: requester,
    details: "Decrypted data viewed",
  });
  await accessControl.save();

  return decrypted;
}

// ── Time-Bound Data Access Control ─────────────────────────────────────────────────
export async function requestDataAccess(data: Record<string, unknown>) {
  const {
    entityType,
    entityId,
    requestedBy,
    requestedRole,
    requestedUnit,
    caseId,
    accessType,
    accessReason,
    durationHours = 24,
  } = data as { entityType: string; entityId: string; requestedBy: string; requestedRole: string; requestedUnit: string; caseId: string; accessType: string; accessReason: string; durationHours?: number };

  const accessControl = await DataAccessControl.create({
    entityType,
    entityId,
    requestedBy,
    requestedRole,
    requestedUnit,
    caseId,
    accessType,
    accessReason,
    grantedAt: new Date(),
    expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000),
    status: "pending",
  });

  // Log the request
  await createAuditLog({
    entityType: "DataAccessControl",
    entityId: accessControl._id.toString(),
    action: "create",
    performedBy: requestedBy,
    actionDetails: { entityType, entityId, accessType },
  });

  return accessControl;
}

export async function approveDataAccess(accessId: string, approvedBy: string, approvalNotes: string) {
  const accessControl = await DataAccessControl.findById(accessId);
  if (!accessControl) throw new Error("Access request not found");

  const ac = accessControl as unknown as IAccessControlDoc;
  ac.status = "approved";
  ac.approvedBy = approvedBy;
  ac.approvedAt = new Date();
  ac.approvalNotes = approvalNotes;
  accessControl.updatedAt = new Date();
  await accessControl.save();

  // Decrypt data for the requester
  const encrypted = await EncryptedData.findOne({
    entityType: ac.entityType,
    entityId: ac.entityId,
  });

  if (encrypted) {
    const enc = encrypted as unknown as IEncryptedDoc;
    enc.status = "decrypted";
    enc.caseId = ac.caseId;
    enc.accessGrantedAt = new Date();
    enc.accessExpiresAt = ac.expiresAt;
    enc.authorizedViewers.push(ac.requestedBy);
    enc.accessReason = ac.accessReason;
    await encrypted.save();
  }

  // Log the approval
  await createAuditLog({
    entityType: "DataAccessControl",
    entityId: accessId,
    action: "approve",
    performedBy: approvedBy,
    approvalNotes,
  });

  return accessControl;
}

export async function revokeDataAccess(accessId: string, revokedBy: string, reason: string) {
  const accessControl = await DataAccessControl.findById(accessId);
  if (!accessControl) throw new Error("Access request not found");

  const ac = accessControl as unknown as IAccessControlDoc;
  ac.status = "revoked";
  ac.revokedBy = revokedBy;
  ac.revokedAt = new Date();
  ac.revocationReason = reason;
  accessControl.updatedAt = new Date();
  await accessControl.save();

  // Re-encrypt data
  const encrypted = await EncryptedData.findOne({
    entityType: ac.entityType,
    entityId: ac.entityId,
  });

  if (encrypted) {
    const enc = encrypted as unknown as IEncryptedDoc;
    enc.status = "encrypted";
    enc.caseId = null;
    enc.accessGrantedAt = null;
    enc.accessExpiresAt = null;
    enc.authorizedViewers = [];
    enc.accessReason = null;
    await encrypted.save();
  }

  return accessControl;
}

// ── Agency Cooperation Delay Alerts ─────────────────────────────────────────────────
export async function createCooperationAlert(data: Record<string, unknown>) {
  const {
    caseId,
    deviceId,
    requestingUnit,
    respondingUnit,
    requestType,
    expectedResponseHours = 24,
  } = data as { caseId: string; deviceId: string; requestingUnit: string; respondingUnit: string; requestType: string; expectedResponseHours?: number };

  const alert = await CooperationAlert.create({
    caseId,
    device: deviceId,
    requestingUnit,
    respondingUnit,
    requestType,
    requestedAt: new Date(),
    expectedResponseBy: new Date(Date.now() + expectedResponseHours * 60 * 60 * 1000),
    status: "pending",
  });

  // Notify responding unit
  getIO().to(`unit:${respondingUnit}`).emit("cooperation_request", {
    alertId: alert._id,
    requestType,
    expectedResponseBy: (alert as unknown as ICooperationAlertDoc).expectedResponseBy,
  });

  return alert;
}

export async function respondToCooperationAlert(alertId: string, response: string, _respondedBy: string) {
  const alert = await CooperationAlert.findById(alertId);
  if (!alert) throw new Error("Cooperation alert not found");

  const al = alert as unknown as ICooperationAlertDoc;
  al.respondedAt = new Date();
  al.status = "responded";
  alert.updatedAt = new Date();
  await alert.save();

  // Notify requesting unit
  getIO().to(`unit:${al.requestingUnit}`).emit("cooperation_response", {
    alertId: alert._id,
    response,
  });

  return alert;
}

export async function checkDelayedAlerts() {
  const now = new Date();
  const delayedAlerts = await CooperationAlert.find({
    status: "pending",
    expectedResponseBy: { $lt: now },
  });

  for (const alert of delayedAlerts) {
    const al = alert as unknown as ICooperationAlertDoc;
    const delayDuration = Math.floor((+now - +al.expectedResponseBy) / (1000 * 60 * 60));
    
    al.isDelayed = true;
    al.delayDuration = delayDuration;
    
    if (delayDuration > 48) {
      al.escalationLevel = "critical";
    } else if (delayDuration > 24) {
      al.escalationLevel = "warning";
    }
    
    al.status = "escalated";
    alert.updatedAt = new Date();
    await alert.save();

    // Notify all relevant parties
    getIO().to(`unit:${al.requestingUnit}`).emit("cooperation_delayed", {
      alertId: alert._id,
      delayDuration,
      escalationLevel: al.escalationLevel,
    });

    getIO().to(`unit:${al.respondingUnit}`).emit("cooperation_delay_alert", {
      alertId: alert._id,
      delayDuration,
      escalationLevel: al.escalationLevel,
    });
  }

  return delayedAlerts;
}

// ── Senior Officer Confirmation Workflow ─────────────────────────────────────────────
export async function createSeniorConfirmation(data: Record<string, unknown>) {
  const {
    caseId,
    deviceId,
    originalRequest,
    seniorOfficer,
    seniorUnit,
  } = data as { caseId: string; deviceId: string; originalRequest: string; seniorOfficer: string; seniorUnit: string };

  const confirmation = await SeniorConfirmation.create({
    caseId,
    device: deviceId,
    originalRequest,
    seniorOfficer,
    seniorUnit,
    status: "pending",
  });

  return confirmation;
}

export async function confirmBySenior(confirmationId: string, confirmation: string, confirmationNotes: string, overrideReason: string) {
  const seniorConfirmation = await SeniorConfirmation.findById(confirmationId);
  if (!seniorConfirmation) throw new Error("Senior confirmation not found");

  const sc = seniorConfirmation as unknown as ISeniorConfirmationDoc;
  sc.confirmedAt = new Date();
  sc.confirmation = confirmation;
  sc.confirmationNotes = confirmationNotes;
  sc.overrideReason = overrideReason;
  sc.status = "confirmed";
  seniorConfirmation.updatedAt = new Date();
  
  sc.auditTrail.push({
    timestamp: new Date(),
    action: "confirm",
    performedBy: sc.seniorOfficer,
    notes: confirmationNotes,
  });
  
  await seniorConfirmation.save();

  // Notify relevant parties
  getIO().to(`unit:${sc.seniorUnit}`).emit("senior_confirmation", {
    confirmationId: seniorConfirmation._id,
    confirmation,
  });

  return seniorConfirmation;
}

export async function escalateConfirmation(confirmationId: string, escalationNotes: string) {
  const seniorConfirmation = await SeniorConfirmation.findById(confirmationId);
  if (!seniorConfirmation) throw new Error("Senior confirmation not found");

  const sc = seniorConfirmation as unknown as ISeniorConfirmationDoc;
  sc.confirmation = "escalated";
  sc.confirmationNotes = escalationNotes;
  sc.status = "escalated";
  seniorConfirmation.updatedAt = new Date();
  
  sc.auditTrail.push({
    timestamp: new Date(),
    action: "escalate",
    performedBy: sc.seniorOfficer,
    notes: escalationNotes,
  });
  
  await seniorConfirmation.save();

  return seniorConfirmation;
}

// ── Missing Person Declaration Rules ─────────────────────────────────────────────────
export async function createMissingPersonRule(data: Record<string, unknown>) {
  const rule = await MissingPersonRule.create(data);
  return rule;
}

export async function getMissingPersonRule(country: string) {
  const rule = await MissingPersonRule.findOne({ country, status: "active" });
  return rule;
}

export async function updateMissingPersonRule(country: string, updates: Record<string, unknown>, updatedBy: string) {
  const rule = await MissingPersonRule.findOneAndUpdate(
    { country },
    {
      ...updates,
      lastUpdatedBy: updatedBy,
      lastUpdatedAt: new Date(),
    },
    { new: true, upsert: true }
  );
  return rule;
}

export async function canDeclareMissing(personAge: number, country: string, specialConditions: string[] = []) {
  const rule = await getMissingPersonRule(country);
  if (!rule) {
    // Default thresholds if no rule exists
    return { canDeclare: true, thresholdHours: 24 };
  }

  const ruleDoc = rule as unknown as IMissingPersonRuleDoc;
  let thresholdHours: number;
  if (specialConditions.some((c: string) => ruleDoc.immediateDeclarationConditions.includes(c))) {
    return { canDeclare: true, thresholdHours: 0 };
  }

  if (personAge < 18) {
    thresholdHours = ruleDoc.childThreshold;
  } else if (personAge >= 65) {
    thresholdHours = ruleDoc.elderlyThreshold;
  } else {
    thresholdHours = ruleDoc.adultThreshold;
  }

  return { canDeclare: true, thresholdHours };
}

// ── Statistics ─────────────────────────────────────────────────────────────────────
export async function getHierarchyStatistics() {
  const [
    totalHierarchyUnits,
    activeHierarchyUnits,
    totalRoles,
    activeRoles,
    totalAssignments,
    activeAssignments,
    totalAuditLogs,
    totalEncryptedData,
    activeDataAccess,
    totalCooperationAlerts,
    delayedAlerts,
    totalSeniorConfirmations,
    pendingConfirmations,
    totalMissingPersonRules,
    activeMissingPersonRules,
  ] = await Promise.all([
    PoliceHierarchy.countDocuments(),
    PoliceHierarchy.countDocuments({ status: "active" }),
    PoliceRole.countDocuments(),
    PoliceRole.countDocuments({ status: "active" }),
    PoliceUserAssignment.countDocuments(),
    PoliceUserAssignment.countDocuments({ status: "active" }),
    AuditLog.countDocuments(),
    EncryptedData.countDocuments(),
    DataAccessControl.countDocuments({ status: "approved", expiresAt: { $gt: new Date() } }),
    CooperationAlert.countDocuments(),
    CooperationAlert.countDocuments({ isDelayed: true }),
    SeniorConfirmation.countDocuments(),
    SeniorConfirmation.countDocuments({ status: "pending" }),
    MissingPersonRule.countDocuments(),
    MissingPersonRule.countDocuments({ status: "active" }),
  ]);

  return {
    hierarchy: {
      total: totalHierarchyUnits,
      active: activeHierarchyUnits,
    },
    roles: {
      total: totalRoles,
      active: activeRoles,
    },
    assignments: {
      total: totalAssignments,
      active: activeAssignments,
    },
    audit: {
      total: totalAuditLogs,
    },
    encryption: {
      totalEncrypted: totalEncryptedData,
      activeAccess: activeDataAccess,
    },
    cooperation: {
      totalAlerts: totalCooperationAlerts,
      delayed: delayedAlerts,
    },
    confirmations: {
      total: totalSeniorConfirmations,
      pending: pendingConfirmations,
    },
    missingPersonRules: {
      total: totalMissingPersonRules,
      active: activeMissingPersonRules,
    },
  };
}

