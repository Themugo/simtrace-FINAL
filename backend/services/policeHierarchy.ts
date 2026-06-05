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
  User,
  PoliceReport,
  Device,
} from "../db/index.js";
import { getIO } from "./socket.js";

// ── Police Hierarchy Management ───────────────────────────────────────────────────────
export async function createHierarchyUnit(data: any) {
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
  const tree: Record<string, any[]> = {};
  units.forEach((unit: any) => {
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

  (assignment as any).status = "revoked";
  (assignment as any).revokedBy = revokedBy;
  (assignment as any).revokedAt = new Date();
  (assignment as any).revocationReason = reason;
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
export async function createRole(data: any) {
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

  const role = (assignment as any).role;
  const permission = (role as any).permissions.find((p: any) => p.resource === resource);

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
export async function createAuditLog(data: any) {
  const log = await AuditLog.create({
    ...data,
    timestamp: new Date(),
    immutable: true,
  });
  return log;
}

export async function getAuditLogs(filters: any = {}) {
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

export function encryptData(data: string): any {
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
  if ((encrypted as any).owner.toString() === requester.toString()) {
    const decrypted = decryptData((encrypted as any).encryptedData, ((encrypted as any).iv ?? (encrypted as any).encryptionKey), (encrypted as any).authTag);
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

  const decrypted = decryptData((encrypted as any).encryptedData, ((encrypted as any).iv ?? (encrypted as any).encryptionKey), (encrypted as any).authTag);
  
  // Log access
  (accessControl as any).accessLog.push({
    timestamp: new Date(),
    action: "view",
    performedBy: requester,
    details: "Decrypted data viewed",
  });
  await accessControl.save();

  return decrypted;
}

// ── Time-Bound Data Access Control ─────────────────────────────────────────────────
export async function requestDataAccess(data: any) {
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
  } = data;

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

  (accessControl as any).status = "approved";
  (accessControl as any).approvedBy = approvedBy;
  (accessControl as any).approvedAt = new Date();
  (accessControl as any).approvalNotes = approvalNotes;
  accessControl.updatedAt = new Date();
  await accessControl.save();

  // Decrypt data for the requester
  const encrypted = await EncryptedData.findOne({
    entityType: (accessControl as any).entityType,
    entityId: (accessControl as any).entityId,
  });

  if (encrypted) {
    (encrypted as any).status = "decrypted";
    (encrypted as any).caseId = (accessControl as any).caseId;
    (encrypted as any).accessGrantedAt = new Date();
    (encrypted as any).accessExpiresAt = (accessControl as any).expiresAt;
    (encrypted as any).authorizedViewers.push((accessControl as any).requestedBy);
    (encrypted as any).accessReason = (accessControl as any).accessReason;
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

  (accessControl as any).status = "revoked";
  (accessControl as any).revokedBy = revokedBy;
  (accessControl as any).revokedAt = new Date();
  (accessControl as any).revocationReason = reason;
  accessControl.updatedAt = new Date();
  await accessControl.save();

  // Re-encrypt data
  const encrypted = await EncryptedData.findOne({
    entityType: (accessControl as any).entityType,
    entityId: (accessControl as any).entityId,
  });

  if (encrypted) {
    (encrypted as any).status = "encrypted";
    (encrypted as any).caseId = null;
    (encrypted as any).accessGrantedAt = null;
    (encrypted as any).accessExpiresAt = null;
    (encrypted as any).authorizedViewers = [];
    (encrypted as any).accessReason = null;
    await encrypted.save();
  }

  return accessControl;
}

// ── Agency Cooperation Delay Alerts ─────────────────────────────────────────────────
export async function createCooperationAlert(data: any) {
  const {
    caseId,
    deviceId,
    requestingUnit,
    respondingUnit,
    requestType,
    expectedResponseHours = 24,
  } = data;

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
    expectedResponseBy: (alert as any).expectedResponseBy,
  });

  return alert;
}

export async function respondToCooperationAlert(alertId: string, response: string, respondedBy: string) {
  const alert = await CooperationAlert.findById(alertId);
  if (!alert) throw new Error("Cooperation alert not found");

  (alert as any).respondedAt = new Date();
  (alert as any).status = "responded";
  alert.updatedAt = new Date();
  await alert.save();

  // Notify requesting unit
  getIO().to(`unit:${(alert as any).requestingUnit}`).emit("cooperation_response", {
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
    const delayDuration = Math.floor((+now - (alert as any).expectedResponseBy) / (1000 * 60 * 60));
    
    (alert as any).isDelayed = true;
    (alert as any).delayDuration = delayDuration;
    
    if (delayDuration > 48) {
      (alert as any).escalationLevel = "critical";
    } else if (delayDuration > 24) {
      (alert as any).escalationLevel = "warning";
    }
    
    (alert as any).status = "escalated";
    alert.updatedAt = new Date();
    await alert.save();

    // Notify all relevant parties
    getIO().to(`unit:${(alert as any).requestingUnit}`).emit("cooperation_delayed", {
      alertId: alert._id,
      delayDuration,
      escalationLevel: (alert as any).escalationLevel,
    });

    getIO().to(`unit:${(alert as any).respondingUnit}`).emit("cooperation_delay_alert", {
      alertId: alert._id,
      delayDuration,
      escalationLevel: (alert as any).escalationLevel,
    });
  }

  return delayedAlerts;
}

// ── Senior Officer Confirmation Workflow ─────────────────────────────────────────────
export async function createSeniorConfirmation(data: any) {
  const {
    caseId,
    deviceId,
    originalRequest,
    seniorOfficer,
    seniorUnit,
  } = data;

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

  (seniorConfirmation as any).confirmedAt = new Date();
  (seniorConfirmation as any).confirmation = confirmation;
  (seniorConfirmation as any).confirmationNotes = confirmationNotes;
  (seniorConfirmation as any).overrideReason = overrideReason;
  (seniorConfirmation as any).status = "confirmed";
  seniorConfirmation.updatedAt = new Date();
  
  (seniorConfirmation as any).auditTrail.push({
    timestamp: new Date(),
    action: "confirm",
    performedBy: (seniorConfirmation as any).seniorOfficer,
    notes: confirmationNotes,
  });
  
  await seniorConfirmation.save();

  // Notify relevant parties
  getIO().to(`unit:${(seniorConfirmation as any).seniorUnit}`).emit("senior_confirmation", {
    confirmationId: seniorConfirmation._id,
    confirmation,
  });

  return seniorConfirmation;
}

export async function escalateConfirmation(confirmationId: string, escalationNotes: string) {
  const seniorConfirmation = await SeniorConfirmation.findById(confirmationId);
  if (!seniorConfirmation) throw new Error("Senior confirmation not found");

  (seniorConfirmation as any).confirmation = "escalated";
  (seniorConfirmation as any).confirmationNotes = escalationNotes;
  (seniorConfirmation as any).status = "escalated";
  seniorConfirmation.updatedAt = new Date();
  
  (seniorConfirmation as any).auditTrail.push({
    timestamp: new Date(),
    action: "escalate",
    performedBy: (seniorConfirmation as any).seniorOfficer,
    notes: escalationNotes,
  });
  
  await seniorConfirmation.save();

  return seniorConfirmation;
}

// ── Missing Person Declaration Rules ─────────────────────────────────────────────────
export async function createMissingPersonRule(data: any) {
  const rule = await MissingPersonRule.create(data);
  return rule;
}

export async function getMissingPersonRule(country: string) {
  const rule = await MissingPersonRule.findOne({ country, status: "active" });
  return rule;
}

export async function updateMissingPersonRule(country: string, updates: any, updatedBy: string) {
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

  let thresholdHours: number;
  if (specialConditions.some((c: string) => (rule as any).immediateDeclarationConditions.includes(c))) {
    return { canDeclare: true, thresholdHours: 0 };
  }

  if (personAge < 18) {
    thresholdHours = (rule as any).childThreshold;
  } else if (personAge >= 65) {
    thresholdHours = (rule as any).elderlyThreshold;
  } else {
    thresholdHours = (rule as any).adultThreshold;
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
