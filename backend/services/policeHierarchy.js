// services/policeHierarchy.js - Police Hierarchy, RBAC, Data Encryption, and Audit System
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
export async function createHierarchyUnit(data) {
  const unit = await PoliceHierarchy.create(data);
  return unit;
}

export async function getHierarchyByCountry(country) {
  const units = await PoliceHierarchy.find({ country, status: "active" })
    .sort({ level: 1, name: 1 });
  return units;
}

export async function getHierarchyTree(country) {
  const units = await PoliceHierarchy.find({ country, status: "active" })
    .sort({ level: 1 });
  
  // Build tree structure
  const tree = {};
  units.forEach(unit => {
    if (!tree[unit.level]) tree[unit.level] = [];
    tree[unit.level].push(unit);
  });
  
  return tree;
}

export async function assignUserToHierarchy(userId, roleId, unitId, assignedBy, validUntil = null) {
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

export async function revokeUserAssignment(assignmentId, revokedBy, reason) {
  const assignment = await PoliceUserAssignment.findById(assignmentId);
  if (!assignment) throw new Error("Assignment not found");

  assignment.status = "revoked";
  assignment.revokedBy = revokedBy;
  assignment.revokedAt = new Date();
  assignment.revocationReason = reason;
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
export async function createRole(data) {
  const role = await PoliceRole.create(data);
  return role;
}

export async function getRolesByCountry(country) {
  const roles = await PoliceRole.find({ country, status: "active" })
    .sort({ roleLevel: 1 });
  return roles;
}

export async function checkPermission(userId, resource, action, scope) {
  const assignment = await PoliceUserAssignment.findOne({
    user: userId,
    status: "active",
  }).populate("role");

  if (!assignment) return false;

  const role = assignment.role;
  const permission = role.permissions.find(p => p.resource === resource);

  if (!permission) return false;
  if (!permission.actions.includes(action)) return false;
  if (scope && permission.scope !== scope && permission.scope !== "all") return false;

  return true;
}

export async function getUserAssignments(userId) {
  const assignments = await PoliceUserAssignment.find({ user: userId, status: "active" })
    .populate("role")
    .populate("hierarchyUnit")
    .populate("assignedBy", "name email");
  return assignments;
}

// ── Immutable Audit Logging ─────────────────────────────────────────────────────────
export async function createAuditLog(data) {
  const log = await AuditLog.create({
    ...data,
    timestamp: new Date(),
    immutable: true,
  });
  return log;
}

export async function getAuditLogs(filters = {}) {
  const logs = await AuditLog.find(filters)
    .populate("performedBy", "name email")
    .sort({ timestamp: -1 })
    .limit(100);
  return logs;
}

export async function getEntityAuditLogs(entityType, entityId) {
  const logs = await AuditLog.find({ entityType, entityId })
    .populate("performedBy", "name email")
    .sort({ timestamp: -1 });
  return logs;
}

// ── Data Encryption/Hashing ───────────────────────────────────────────────────────────
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = "aes-256-gcm";

export function hashData(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptData(encryptedData, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function storeEncryptedData(entityType, entityId, dataType, data, owner) {
  const originalHash = hashData(data);
  const { encryptedData, iv, authTag } = encryptData(data);

  const encrypted = await EncryptedData.create({
    entityType,
    entityId,
    dataType,
    originalHash,
    encryptedData,
    encryptionKey: iv,
    encryptionAlgorithm: ALGORITHM,
    owner,
    status: "encrypted",
  });

  return encrypted;
}

export async function getDecryptedData(entityType, entityId, dataType, requester, caseId) {
  const encrypted = await EncryptedData.findOne({
    entityType,
    entityId,
    dataType,
    status: "encrypted",
  });

  if (!encrypted) throw new Error("Encrypted data not found");

  // Check if requester is owner
  if (encrypted.owner.toString() === requester.toString()) {
    const decrypted = decryptData(encrypted.encryptedData, encrypted.encryptionKey, encrypted.authTag);
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

  const decrypted = decryptData(encrypted.encryptedData, encrypted.encryptionKey, encrypted.authTag);
  
  // Log access
  accessControl.accessLog.push({
    timestamp: new Date(),
    action: "view",
    performedBy: requester,
    details: "Decrypted data viewed",
  });
  await accessControl.save();

  return decrypted;
}

// ── Time-Bound Data Access Control ─────────────────────────────────────────────────
export async function requestDataAccess(data) {
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

export async function approveDataAccess(accessId, approvedBy, approvalNotes) {
  const accessControl = await DataAccessControl.findById(accessId);
  if (!accessControl) throw new Error("Access request not found");

  accessControl.status = "approved";
  accessControl.approvedBy = approvedBy;
  accessControl.approvedAt = new Date();
  accessControl.approvalNotes = approvalNotes;
  accessControl.updatedAt = new Date();
  await accessControl.save();

  // Decrypt data for the requester
  const encrypted = await EncryptedData.findOne({
    entityType: accessControl.entityType,
    entityId: accessControl.entityId,
  });

  if (encrypted) {
    encrypted.status = "decrypted";
    encrypted.caseId = accessControl.caseId;
    encrypted.accessGrantedAt = new Date();
    encrypted.accessExpiresAt = accessControl.expiresAt;
    encrypted.authorizedViewers.push(accessControl.requestedBy);
    encrypted.accessReason = accessControl.accessReason;
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

export async function revokeDataAccess(accessId, revokedBy, reason) {
  const accessControl = await DataAccessControl.findById(accessId);
  if (!accessControl) throw new Error("Access request not found");

  accessControl.status = "revoked";
  accessControl.revokedBy = revokedBy;
  accessControl.revokedAt = new Date();
  accessControl.revocationReason = reason;
  accessControl.updatedAt = new Date();
  await accessControl.save();

  // Re-encrypt data
  const encrypted = await EncryptedData.findOne({
    entityType: accessControl.entityType,
    entityId: accessControl.entityId,
  });

  if (encrypted) {
    encrypted.status = "encrypted";
    encrypted.caseId = null;
    encrypted.accessGrantedAt = null;
    encrypted.accessExpiresAt = null;
    encrypted.authorizedViewers = [];
    encrypted.accessReason = null;
    await encrypted.save();
  }

  return accessControl;
}

// ── Agency Cooperation Delay Alerts ─────────────────────────────────────────────────
export async function createCooperationAlert(data) {
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
    expectedResponseBy: alert.expectedResponseBy,
  });

  return alert;
}

export async function respondToCooperationAlert(alertId, response, respondedBy) {
  const alert = await CooperationAlert.findById(alertId);
  if (!alert) throw new Error("Cooperation alert not found");

  alert.respondedAt = new Date();
  alert.status = "responded";
  alert.updatedAt = new Date();
  await alert.save();

  // Notify requesting unit
  getIO().to(`unit:${alert.requestingUnit}`).emit("cooperation_response", {
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
    const delayDuration = Math.floor((now - alert.expectedResponseBy) / (1000 * 60 * 60));
    
    alert.isDelayed = true;
    alert.delayDuration = delayDuration;
    
    if (delayDuration > 48) {
      alert.escalationLevel = "critical";
    } else if (delayDuration > 24) {
      alert.escalationLevel = "warning";
    }
    
    alert.status = "escalated";
    alert.updatedAt = new Date();
    await alert.save();

    // Notify all relevant parties
    getIO().to(`unit:${alert.requestingUnit}`).emit("cooperation_delayed", {
      alertId: alert._id,
      delayDuration,
      escalationLevel: alert.escalationLevel,
    });

    getIO().to(`unit:${alert.respondingUnit}`).emit("cooperation_delay_alert", {
      alertId: alert._id,
      delayDuration,
      escalationLevel: alert.escalationLevel,
    });
  }

  return delayedAlerts;
}

// ── Senior Officer Confirmation Workflow ─────────────────────────────────────────────
export async function createSeniorConfirmation(data) {
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

export async function confirmBySenior(confirmationId, confirmation, confirmationNotes, overrideReason) {
  const seniorConfirmation = await SeniorConfirmation.findById(confirmationId);
  if (!seniorConfirmation) throw new Error("Senior confirmation not found");

  seniorConfirmation.confirmedAt = new Date();
  seniorConfirmation.confirmation = confirmation;
  seniorConfirmation.confirmationNotes = confirmationNotes;
  seniorConfirmation.overrideReason = overrideReason;
  seniorConfirmation.status = "confirmed";
  seniorConfirmation.updatedAt = new Date();
  
  seniorConfirmation.auditTrail.push({
    timestamp: new Date(),
    action: "confirm",
    performedBy: seniorConfirmation.seniorOfficer,
    notes: confirmationNotes,
  });
  
  await seniorConfirmation.save();

  // Notify relevant parties
  getIO().to(`unit:${seniorConfirmation.seniorUnit}`).emit("senior_confirmation", {
    confirmationId: seniorConfirmation._id,
    confirmation,
  });

  return seniorConfirmation;
}

export async function escalateConfirmation(confirmationId, escalationNotes) {
  const seniorConfirmation = await SeniorConfirmation.findById(confirmationId);
  if (!seniorConfirmation) throw new Error("Senior confirmation not found");

  seniorConfirmation.confirmation = "escalated";
  seniorConfirmation.confirmationNotes = escalationNotes;
  seniorConfirmation.status = "escalated";
  seniorConfirmation.updatedAt = new Date();
  
  seniorConfirmation.auditTrail.push({
    timestamp: new Date(),
    action: "escalate",
    performedBy: seniorConfirmation.seniorOfficer,
    notes: escalationNotes,
  });
  
  await seniorConfirmation.save();

  return seniorConfirmation;
}

// ── Missing Person Declaration Rules ─────────────────────────────────────────────────
export async function createMissingPersonRule(data) {
  const rule = await MissingPersonRule.create(data);
  return rule;
}

export async function getMissingPersonRule(country) {
  const rule = await MissingPersonRule.findOne({ country, status: "active" });
  return rule;
}

export async function updateMissingPersonRule(country, updates, updatedBy) {
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

export async function canDeclareMissing(personAge, country, specialConditions = []) {
  const rule = await getMissingPersonRule(country);
  if (!rule) {
    // Default thresholds if no rule exists
    return { canDeclare: true, thresholdHours: 24 };
  }

  let thresholdHours;
  if (specialConditions.some(c => rule.immediateDeclarationConditions.includes(c))) {
    return { canDeclare: true, thresholdHours: 0 };
  }

  if (personAge < 18) {
    thresholdHours = rule.childThreshold;
  } else if (personAge >= 65) {
    thresholdHours = rule.elderlyThreshold;
  } else {
    thresholdHours = rule.adultThreshold;
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
