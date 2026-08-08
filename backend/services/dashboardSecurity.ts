// services/dashboardSecurity.ts - Hierarchical Security Dashboard Services
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendSMS, sendEmail } from "./notify.js";

// Keyed, deterministic hash for single-use verification secrets so they can be
// matched via findOne while never stored in plaintext (enforcement pass).
const SECRET_HASH_KEY = process.env.SECRET_HASH_KEY || process.env.JWT_SECRET || "simtrace-dev-secret-hash";
function hashSecret(value: string): string {
  return crypto.createHmac("sha256", SECRET_HASH_KEY).update(String(value)).digest("hex");
}
import {
  OfficialEmail,
  SecurityOtp,
  PasswordResetRequest,
  NetworkChangeRequest,
  DashboardAccessLog,
  MinisterDashboard,
  PoliceGeneralDashboard,
  StationAdminDashboard,
  UserDashboard,
  User,
} from "../db/index.js";
import { getIO } from "./socket.js";
import mongoose from "mongoose";

// Mongoose models use strict: false with no generic type parameter.
// Document fields are any at the TS level — this type is used for
// spread-into-create/findOneAndUpdate payloads instead of `any`.
type DashboardInput = Record<string, unknown>;

interface IOfficialEmailDoc extends mongoose.Document {
  emailId: string;
  officialEmail: string;
  verificationToken: string | null;
  verificationExpiresAt: Date | null;
  isVerified: boolean;
  verifiedAt: Date;
  status: string;
  createdBy: string;
  updatedBy: string;
}

interface ISecurityOtpDoc extends mongoose.Document {
  otpId: string;
  otpNumber: string;
  holderName: string;
  purpose: string;
  expiresAt: Date;
  isVerified: boolean;
  verifiedAt: Date;
  used: boolean;
  status: string;
  createdBy: string;
  updatedBy: string;
}

interface IPasswordResetRequestDoc extends mongoose.Document {
  requestId: string;
  requesterId: string;
  requesterEmailId: string;
  requesterOtpId: string;
  verificationCode: string;
  verificationExpiresAt: Date;
  status: string;
  emailVerified: boolean;
  otpVerified: boolean;
  approverId: string;
  approvalStatus: string;
  approvalReason: string;
  approvedAt: Date;
  userId: string;
  newPasswordHash: string;
  passwordChangedAt: Date;
  createdBy: string;
  updatedBy: string;
}

interface INetworkChangeRequestDoc extends mongoose.Document {
  requestId: string;
  requesterId: string;
  requesterEmailId: string;
  requesterOtpId: string;
  requiredApprovals: string[];
  approvals: Array<{ approverId: string; approverEmailId: string; approverOtpId: string; status: string; comment: string; approvedAt: Date }>;
  status: string;
  emailVerified: boolean;
  otpVerified: boolean;
  executionStatus: string;
  executedAt: Date;
  executedBy: string;
  executionLog: string;
  rollbackRequired: boolean;
  rollbackStatus: string;
  rollbackAt: Date;
  rollbackReason: string;
  createdBy: string;
  updatedBy: string;
}

interface IDashboardAccessLogDoc extends mongoose.Document {
  logId: string;
  suspiciousActivity: boolean;
  riskScore: number;
}

interface IUserDoc extends mongoose.Document {
  password: string;
}

interface IDashboardDoc extends mongoose.Document {
  allowedIPs: string[];
  allowedTimeRanges: Array<{ dayOfWeek: number[]; startTime: string; endTime: string }>;
}

// ── Official Email Management ───────────────────────────────────────────────────────
export async function createOfficialEmail(data: DashboardInput) {
  const emailId = `email_${crypto.randomBytes(16).toString("hex")}`;
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const officialEmail = await OfficialEmail.create({
    ...data,
    emailId,
    verificationToken: hashSecret(verificationToken),
    verificationExpiresAt,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Deliver the verification token to the official email (SendGrid). Dev fallback
  // logs it only when SENDGRID_API_KEY is unset, so local testing still works.
  await sendEmail(String(data.officialEmail), "SimTrace — verify your official email",
    `Your SimTrace official-email verification token is: ${verificationToken}\nIf you did not request this, ignore this message.`);
  if (process.env.NODE_ENV !== "production" && !process.env.SENDGRID_API_KEY) console.log(`[dev] OfficialEmail ${data.officialEmail} verification token: ${verificationToken}`);

  return officialEmail;
}

export async function verifyOfficialEmail(emailId: string, token: string) {
  const email = await OfficialEmail.findOne({ emailId, verificationToken: hashSecret(token) });
  if (!email) throw new Error("Invalid verification token");

  if ((email as IOfficialEmailDoc).verificationExpiresAt! < new Date()) {
    throw new Error("Verification token expired");
  }

  (email as IOfficialEmailDoc).isVerified = true;
  (email as IOfficialEmailDoc).verifiedAt = new Date();
  (email as IOfficialEmailDoc).verificationToken = null;
  (email as IOfficialEmailDoc).verificationExpiresAt = null;
  email.updatedAt = new Date();
  await email.save();

  return email;
}

export async function getOfficialEmail(emailId: string) {
  const email = await OfficialEmail.findOne({ emailId, status: "active" });
  if (!email) throw new Error("Official email not found");
  return email;
}

export async function getOfficialEmailByUser(userId: string) {
  const email = await OfficialEmail.findOne({ holderName: userId, status: "active" });
  return email;
}

export async function updateOfficialEmail(emailId: string, updates: DashboardInput, updatedBy: string) {
  const email = await OfficialEmail.findOneAndUpdate(
    { emailId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!email) throw new Error("Official email not found");
  return email;
}

export async function revokeOfficialEmail(emailId: string, revokedBy: string) {
  const email = await OfficialEmail.findOneAndUpdate(
    { emailId },
    {
      status: "revoked",
      updatedBy: revokedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!email) throw new Error("Official email not found");
  return email;
}

// ── Security OTP Management ─────────────────────────────────────────────────────────
export async function createSecurityOtp(data: DashboardInput) {
  const otpId = `otp_${crypto.randomBytes(16).toString("hex")}`;
  const otpNumber = generateOtpNumber();

  const securityOtp = await SecurityOtp.create({
    ...data,
    otpId,
    otpNumber: hashSecret(otpNumber),
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // Deliver the OTP over the holder's secure channels (SMS + official email).
  const otpMsg = `SimTrace security OTP: ${otpNumber}. Do not share this code.`;
  if (data.phoneNumber)   await sendSMS(String(data.phoneNumber), otpMsg);
  if (data.officialEmail) await sendEmail(String(data.officialEmail), "SimTrace — security OTP", otpMsg);
  if (process.env.NODE_ENV !== "production" && !process.env.AT_API_KEY && !process.env.SENDGRID_API_KEY) console.log(`[dev] Security OTP for ${data.holderName}: ${otpNumber}`);

  return securityOtp;
}

export async function verifySecurityOtp(otpId: string, otpNumber: string) {
  const otp = await SecurityOtp.findOne({ otpId, otpNumber: hashSecret(otpNumber), status: "active" });
  if (!otp) throw new Error("Invalid OTP number");

  (otp as ISecurityOtpDoc).isVerified = true;
  (otp as ISecurityOtpDoc).verifiedAt = new Date();
  otp.updatedAt = new Date();
  await otp.save();

  return otp;
}

export async function getSecurityOtp(otpId: string) {
  const otp = await SecurityOtp.findOne({ otpId, status: "active" });
  if (!otp) throw new Error("Security OTP not found");
  return otp;
}

export async function getSecurityOtpByUser(userId: string) {
  const otp = await SecurityOtp.findOne({ holderName: userId, status: "active" });
  return otp;
}

export async function updateSecurityOtp(otpId: string, updates: DashboardInput, updatedBy: string) {
  const otp = await SecurityOtp.findOneAndUpdate(
    { otpId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!otp) throw new Error("Security OTP not found");
  return otp;
}

export async function reportLostOtp(otpId: string, reportedBy: string) {
  const otp = await SecurityOtp.findOneAndUpdate(
    { otpId },
    {
      status: "lost",
      updatedBy: reportedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!otp) throw new Error("Security OTP not found");
  
  // TODO: Notify security team about lost OTP
  console.warn(`[DashboardSecurity] Lost OTP notification not implemented — OTP ${otpId} lost by ${reportedBy}`);
  
  return otp;
}

function generateOtpNumber(): string {
  // Generate a secure OTP number (e.g., 8-digit)
  return crypto.randomInt(10000000, 99999999).toString();
}

// ── Password Reset Workflow ─────────────────────────────────────────────────────────
export async function initiatePasswordReset(data: DashboardInput) {
  const requestId = `pr_${crypto.randomBytes(16).toString("hex")}`;
  const verificationCode = crypto.randomBytes(6).toString("hex").toUpperCase();
  const verificationExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Verify requester has official email or OTP
  const requesterEmail = await OfficialEmail.findOne({ holderName: data.requesterId, status: "active" });
  const requesterOtp = await SecurityOtp.findOne({ holderName: data.requesterId, status: "active" });

  if (!requesterEmail && !requesterOtp) {
    throw new Error("Requester must have official email or security OTP");
  }

  const resetRequest = await PasswordResetRequest.create({
    ...data,
    requestId,
    requesterEmailId: requesterEmail?.emailId,
    requesterOtpId: requesterOtp?.otpId,
    verificationCode: hashSecret(verificationCode),
    verificationExpiresAt,
    status: "requested",
    createdBy: data.requesterId,
    updatedBy: data.requesterId,
  });

  // Deliver the password-reset code to the requester's email (SendGrid).
  if (requesterEmail) {
    await sendEmail(requesterEmail, "SimTrace — password reset code",
      `Your SimTrace password-reset verification code is: ${verificationCode}\nIf you did not request this, contact your administrator.`);
    if (process.env.NODE_ENV !== "production" && !process.env.SENDGRID_API_KEY) console.log(`[dev] Password-reset code: ${verificationCode}`);
  }

  // TODO: Send notification via official channels
  console.warn(`[DashboardSecurity] Official notification not sent for password reset ${requestId}`);
  getIO().to(`user:${data.userId}`).emit("password_reset_initiated", {
    requestId,
    requesterId: data.requesterId,
  });

  return resetRequest;
}

export async function verifyPasswordReset(requestId: string, verificationMethod: string, code: string, otpNumber: string) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");

  if ((resetRequest as IPasswordResetRequestDoc).verificationExpiresAt < new Date()) {
    (resetRequest as IPasswordResetRequestDoc).status = "expired";
    await resetRequest.save();
    throw new Error("Verification code expired");
  }

  if (verificationMethod === "official_email") {
    if ((resetRequest as IPasswordResetRequestDoc).verificationCode !== hashSecret(code)) {
      throw new Error("Invalid verification code");
    }
    (resetRequest as IPasswordResetRequestDoc).emailVerified = true;
  } else if (verificationMethod === "security_otp") {
    const otp = await SecurityOtp.findOne({ otpNumber: hashSecret(otpNumber), status: "active" });
    if (!otp) throw new Error("Invalid OTP number");
    (resetRequest as IPasswordResetRequestDoc).otpVerified = true;
  } else if (verificationMethod === "both") {
    if ((resetRequest as IPasswordResetRequestDoc).verificationCode !== hashSecret(code)) {
      throw new Error("Invalid verification code");
    }
    const otp = await SecurityOtp.findOne({ otpNumber: hashSecret(otpNumber), status: "active" });
    if (!otp) throw new Error("Invalid OTP number");
    (resetRequest as IPasswordResetRequestDoc).emailVerified = true;
    (resetRequest as IPasswordResetRequestDoc).otpVerified = true;
  }

  (resetRequest as IPasswordResetRequestDoc).status = "verified";
  resetRequest.updatedAt = new Date();
  await resetRequest.save();

  return resetRequest;
}

export async function approvePasswordReset(requestId: string, approverId: string, approvalReason: string) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");

  if ((resetRequest as IPasswordResetRequestDoc).status !== "verified") {
    throw new Error("Request must be verified before approval");
  }

  (resetRequest as IPasswordResetRequestDoc).approverId = approverId;
  (resetRequest as IPasswordResetRequestDoc).approvalStatus = "approved";
  (resetRequest as IPasswordResetRequestDoc).approvalReason = approvalReason;
  (resetRequest as IPasswordResetRequestDoc).approvedAt = new Date();
  (resetRequest as IPasswordResetRequestDoc).status = "approved";
  resetRequest.updatedAt = new Date();
  await resetRequest.save();

  // TODO: Notify requester and user
  console.warn(`[DashboardSecurity] Password reset approved notification not sent for ${requestId}`);
  getIO().to(`user:${(resetRequest as IPasswordResetRequestDoc).userId}`).emit("password_reset_approved", {
    requestId,
    approverId,
  });

  return resetRequest;
}

export async function rejectPasswordReset(requestId: string, approverId: string, rejectionReason: string) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");

  (resetRequest as IPasswordResetRequestDoc).approverId = approverId;
  (resetRequest as IPasswordResetRequestDoc).approvalStatus = "rejected";
  (resetRequest as IPasswordResetRequestDoc).approvalReason = rejectionReason;
  (resetRequest as IPasswordResetRequestDoc).status = "rejected";
  resetRequest.updatedAt = new Date();
  await resetRequest.save();

  // TODO: Notify requester
  getIO().to(`user:${(resetRequest as IPasswordResetRequestDoc).requesterId}`).emit("password_reset_rejected", {
    requestId,
    reason: rejectionReason,
  });

  return resetRequest;
}

export async function completePasswordReset(requestId: string, newPassword: string) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");

  if ((resetRequest as IPasswordResetRequestDoc).status !== "approved") {
    throw new Error("Request must be approved before completion");
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update user password (preserve all other data)
  const user = await User.findById((resetRequest as IPasswordResetRequestDoc).userId);
  if (!user) throw new Error("User not found");

  (user as unknown as IUserDoc).password = newPasswordHash;
  await user.save();

  // Update reset request
  (resetRequest as IPasswordResetRequestDoc).newPasswordHash = newPasswordHash;
  (resetRequest as IPasswordResetRequestDoc).passwordChangedAt = new Date();
  (resetRequest as IPasswordResetRequestDoc).status = "completed";
  resetRequest.updatedAt = new Date();
  await resetRequest.save();

  // TODO: Log the password change in audit log
  // TODO: Notify user via official channels
  console.warn(`[DashboardSecurity] Password change audit log / notification not sent for ${requestId}`);
  getIO().to(`user:${(resetRequest as IPasswordResetRequestDoc).userId}`).emit("password_reset_completed", {
    requestId,
  });

  return resetRequest;
}

export async function getPasswordResetRequest(requestId: string) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");
  return resetRequest;
}

export async function getPasswordResetRequestsByUser(userId: string) {
  const resetRequests = await PasswordResetRequest.find({ userId }).sort({ createdAt: -1 });
  return resetRequests;
}

// ── Network Change Workflow ────────────────────────────────────────────────────────
export async function initiateNetworkChange(data: DashboardInput) {
  const requestId = `nc_${crypto.randomBytes(16).toString("hex")}`;

  // Verify requester has official email or OTP
  const requesterEmail = await OfficialEmail.findOne({ holderName: data.requesterId, status: "active" });
  const requesterOtp = await SecurityOtp.findOne({ holderName: data.requesterId, status: "active" });

  if (!requesterEmail && !requesterOtp) {
    throw new Error("Requester must have official email or security OTP");
  }

  // Determine required approval levels based on change scope
  const requiredApprovals = determineRequiredApprovals(String(data.approvalLevel ?? ''));

  const networkChangeRequest = await NetworkChangeRequest.create({
    ...data,
    requestId,
    requesterEmailId: requesterEmail?.emailId,
    requesterOtpId: requesterOtp?.otpId,
    requiredApprovals,
    status: "requested",
    createdBy: data.requesterId,
    updatedBy: data.requesterId,
  });

  // TODO: Notify required approvers
  console.warn(`[DashboardSecurity] Network change approver notification not implemented for ${requestId}`);
  getIO().to(`role:admin`).emit("network_change_requested", {
    requestId,
    approvalLevel: data.approvalLevel,
  });

  return networkChangeRequest;
}

function determineRequiredApprovals(approvalLevel: string): string[] {
  const approvalChain: Record<string, string[]> = {
    station: ["station"],
    region: ["station", "region"],
    division: ["station", "region", "division"],
    national: ["station", "region", "division", "national"],
    minister: ["station", "region", "division", "national", "minister"],
  };
  return approvalChain[approvalLevel] || ["station"];
}

export async function verifyNetworkChange(requestId: string, verificationMethod: string, otpNumber: string) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  if (verificationMethod === "official_email") {
    (networkChange as INetworkChangeRequestDoc).emailVerified = true;
  } else if (verificationMethod === "security_otp") {
    const otp = await SecurityOtp.findOne({ otpNumber: hashSecret(otpNumber), status: "active" });
    if (!otp) throw new Error("Invalid OTP number");
    (networkChange as INetworkChangeRequestDoc).otpVerified = true;
  } else if (verificationMethod === "both") {
    (networkChange as INetworkChangeRequestDoc).emailVerified = true;
    const otp = await SecurityOtp.findOne({ otpNumber: hashSecret(otpNumber), status: "active" });
    if (!otp) throw new Error("Invalid OTP number");
    (networkChange as INetworkChangeRequestDoc).otpVerified = true;
  }

  (networkChange as INetworkChangeRequestDoc).status = "verified";
  networkChange.updatedAt = new Date();
  await networkChange.save();

  return networkChange;
}

export async function approveNetworkChange(requestId: string, approverId: string, approverEmailId: string, approverOtpId: string, comment: string) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  if ((networkChange as INetworkChangeRequestDoc).status !== "verified") {
    throw new Error("Request must be verified before approval");
  }

  // Add approval
  (networkChange as INetworkChangeRequestDoc).approvals.push({
    approverId,
    approverEmailId,
    approverOtpId,
    status: "approved",
    comment,
    approvedAt: new Date(),
  });

  // Check if all required approvals are received
  const approvedLevels = (networkChange as INetworkChangeRequestDoc).approvals
    .filter((a: { status: string; approverId: string }) => a.status === "approved")
    .map((a: { status: string; approverId: string }) => getApproverLevel(a.approverId));
  
  const allApproved = (networkChange as INetworkChangeRequestDoc).requiredApprovals.every((level: string) => approvedLevels.includes(level));

  if (allApproved) {
    (networkChange as INetworkChangeRequestDoc).status = "approved";
  }

  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Notify next approver or requester if all approved
  console.warn(`[DashboardSecurity] Network change approval notification not implemented for ${requestId}`);
  if (allApproved) {
    getIO().to(`user:${(networkChange as INetworkChangeRequestDoc).requesterId}`).emit("network_change_approved", {
      requestId,
    });
  }

  return networkChange;
}

export async function rejectNetworkChange(requestId: string, _approverId: string, rejectionReason: string) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  (networkChange as INetworkChangeRequestDoc).status = "rejected";
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Notify requester
  getIO().to(`user:${(networkChange as INetworkChangeRequestDoc).requesterId}`).emit("network_change_rejected", {
    requestId,
    reason: rejectionReason,
  });

  return networkChange;
}

export async function executeNetworkChange(requestId: string, executedBy: string, executionLog: string) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  if ((networkChange as INetworkChangeRequestDoc).status !== "approved") {
    throw new Error("Request must be approved before execution");
  }

  (networkChange as INetworkChangeRequestDoc).executionStatus = "in_progress";
  (networkChange as INetworkChangeRequestDoc).executedAt = new Date();
  (networkChange as INetworkChangeRequestDoc).executedBy = executedBy;
  (networkChange as INetworkChangeRequestDoc).executionLog = executionLog;
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Execute actual network change
  // TODO: Update system configuration with new network settings
  console.warn(`[DashboardSecurity] Network change execution not implemented for ${requestId} — marking completed as stub`);
  
  (networkChange as INetworkChangeRequestDoc).executionStatus = "completed";
  (networkChange as INetworkChangeRequestDoc).status = "completed";
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Notify all stakeholders
  console.warn(`[DashboardSecurity] Network change stakeholder notification not implemented for ${requestId}`);
  getIO().to(`role:admin`).emit("network_change_completed", {
    requestId,
  });

  return networkChange;
}

export async function rollbackNetworkChange(requestId: string, rollbackReason: string) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  (networkChange as INetworkChangeRequestDoc).rollbackRequired = true;
  (networkChange as INetworkChangeRequestDoc).rollbackStatus = "in_progress";
  (networkChange as INetworkChangeRequestDoc).rollbackAt = new Date();
  (networkChange as INetworkChangeRequestDoc).rollbackReason = rollbackReason;
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Execute rollback to previous network configuration
  // TODO: Restore previous system settings
  console.warn(`[DashboardSecurity] Network change rollback execution not implemented for ${requestId}`);
  
  (networkChange as INetworkChangeRequestDoc).rollbackStatus = "completed";
  (networkChange as INetworkChangeRequestDoc).executionStatus = "rolled_back";
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Notify all stakeholders
  console.warn(`[DashboardSecurity] Network change rollback notification not implemented for ${requestId}`);
  getIO().to(`role:admin`).emit("network_change_rolled_back", {
    requestId,
    reason: rollbackReason,
  });

  return networkChange;
}

export async function getNetworkChangeRequest(requestId: string) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");
  return networkChange;
}

export async function getNetworkChangeRequestsByAgency(agencyId: string) {
  const networkChanges = await NetworkChangeRequest.find({ agencyId }).sort({ createdAt: -1 });
  return networkChanges;
}

function getApproverLevel(_approverId: string): string {
  // TODO: Implement logic to determine approver's level based on their role
  return "station"; // Placeholder
}

// ── Dashboard Access Logging ────────────────────────────────────────────────────────
export async function logDashboardAccess(data: DashboardInput) {
  const logId = `log_${crypto.randomBytes(16).toString("hex")}`;

  // Calculate risk score based on various factors
  const riskScore = calculateRiskScore(data);

  const accessLog = await DashboardAccessLog.create({
    ...data,
    logId,
    riskScore,
    suspiciousActivity: riskScore > 50,
  });

  // Alert if suspicious activity detected
  if ((accessLog as IDashboardAccessLogDoc).suspiciousActivity) {
    // TODO: Send security alert
    console.warn(`[DashboardSecurity] Suspicious activity alert not sent — ${logId} risk score ${riskScore}`);
    getIO().to(`role:admin`).emit("suspicious_activity", {
      logId,
      userId: data.userId,
      riskScore,
    });
  }

  return accessLog;
}

function calculateRiskScore(data: { accessType?: string; location?: { country?: string }; countryCode?: string }): number {
  let score = 0;

  // Check for unusual access patterns
  if (data.accessType === "admin") score += 20;
  if (data.accessType === "export") score += 15;
  if (data.accessType === "action") score += 10;

  // Check for unusual time (outside business hours)
  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) score += 15;

  // Check for unusual location (if provided)
  if (data.location && data.location.country !== data.countryCode) {
    score += 25;
  }

  return Math.min(score, 100);
}

export async function getDashboardAccessLogs(userId: string, limit = 50) {
  const logs = await DashboardAccessLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return logs;
}

export async function getDashboardAccessLogsByLevel(dashboardLevel: string, limit = 100) {
  const logs = await DashboardAccessLog.find({ dashboardLevel })
    .sort({ createdAt: -1 })
    .limit(limit);
  return logs;
}

export async function getSuspiciousActivityLogs(limit = 50) {
  const logs = await DashboardAccessLog.find({ suspiciousActivity: true })
    .sort({ createdAt: -1 })
    .limit(limit);
  return logs;
}

// ── Dashboard Configuration Management ─────────────────────────────────────────────
export async function createMinisterDashboard(data: DashboardInput) {
  const dashboardId = `md_${crypto.randomBytes(16).toString("hex")}`;

  const dashboard = await MinisterDashboard.create({
    ...data,
    dashboardId,
    createdBy: data.ministerId,
    updatedBy: data.ministerId,
  });

  return dashboard;
}

export async function getMinisterDashboard(ministerId: string) {
  const dashboard = await MinisterDashboard.findOne({ ministerId, status: "active" });
  if (!dashboard) throw new Error("Minister dashboard not found");
  return dashboard;
}

export async function updateMinisterDashboard(dashboardId: string, updates: DashboardInput, updatedBy: string) {
  const dashboard = await MinisterDashboard.findOneAndUpdate(
    { dashboardId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Minister dashboard not found");
  return dashboard;
}

export async function createPoliceGeneralDashboard(data: DashboardInput) {
  const dashboardId = `pgd_${crypto.randomBytes(16).toString("hex")}`;

  const dashboard = await PoliceGeneralDashboard.create({
    ...data,
    dashboardId,
    createdBy: data.policeGeneralId,
    updatedBy: data.policeGeneralId,
  });

  return dashboard;
}

export async function getPoliceGeneralDashboard(policeGeneralId: string) {
  const dashboard = await PoliceGeneralDashboard.findOne({ policeGeneralId, status: "active" });
  if (!dashboard) throw new Error("Police general dashboard not found");
  return dashboard;
}

export async function updatePoliceGeneralDashboard(dashboardId: string, updates: DashboardInput, updatedBy: string) {
  const dashboard = await PoliceGeneralDashboard.findOneAndUpdate(
    { dashboardId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Police general dashboard not found");
  return dashboard;
}

export async function createStationAdminDashboard(data: DashboardInput) {
  const dashboardId = `sad_${crypto.randomBytes(16).toString("hex")}`;

  const dashboard = await StationAdminDashboard.create({
    ...data,
    dashboardId,
    createdBy: data.stationAdminId,
    updatedBy: data.stationAdminId,
  });

  return dashboard;
}

export async function getStationAdminDashboard(stationAdminId: string) {
  const dashboard = await StationAdminDashboard.findOne({ stationAdminId, status: "active" });
  if (!dashboard) throw new Error("Station admin dashboard not found");
  return dashboard;
}

export async function updateStationAdminDashboard(dashboardId: string, updates: DashboardInput, updatedBy: string) {
  const dashboard = await StationAdminDashboard.findOneAndUpdate(
    { dashboardId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("Station admin dashboard not found");
  return dashboard;
}

export async function createUserDashboard(data: DashboardInput) {
  const dashboardId = `ud_${crypto.randomBytes(16).toString("hex")}`;

  const dashboard = await UserDashboard.create({
    ...data,
    dashboardId,
    createdBy: data.userId,
    updatedBy: data.userId,
  });

  return dashboard;
}

export async function getUserDashboard(userId: string) {
  const dashboard = await UserDashboard.findOne({ userId, status: "active" });
  if (!dashboard) throw new Error("User dashboard not found");
  return dashboard;
}

export async function updateUserDashboard(dashboardId: string, updates: DashboardInput, updatedBy: string) {
  const dashboard = await UserDashboard.findOneAndUpdate(
    { dashboardId },
    {
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!dashboard) throw new Error("User dashboard not found");
  return dashboard;
}

// ── Dashboard Access Control ────────────────────────────────────────────────────────
export async function checkDashboardAccess(userId: string, dashboardLevel: string, ipAddress: string) {
  // Get user's dashboard configuration based on level
  let dashboard;
  switch (dashboardLevel) {
    case "minister":
      dashboard = await MinisterDashboard.findOne({ ministerId: userId, status: "active" });
      break;
    case "police_general":
      dashboard = await PoliceGeneralDashboard.findOne({ policeGeneralId: userId, status: "active" });
      break;
    case "station_admin":
      dashboard = await StationAdminDashboard.findOne({ stationAdminId: userId, status: "active" });
      break;
    case "user":
      dashboard = await UserDashboard.findOne({ userId, status: "active" });
      break;
    default:
      throw new Error("Invalid dashboard level");
  }

  if (!dashboard) {
    return { allowed: false, reason: "Dashboard not found or inactive" };
  }

  // Check IP whitelist
  if ((dashboard as IDashboardDoc).allowedIPs && (dashboard as IDashboardDoc).allowedIPs.length > 0) {
    const ipAllowed = (dashboard as IDashboardDoc).allowedIPs.some((allowedIp: string) => ipAddress.startsWith(allowedIp));
    if (!ipAllowed) {
      return { allowed: false, reason: "IP not whitelisted" };
    }
  }

  // Check time-based access
  if ((dashboard as IDashboardDoc).allowedTimeRanges && (dashboard as IDashboardDoc).allowedTimeRanges.length > 0) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const timeAllowed = (dashboard as IDashboardDoc).allowedTimeRanges.some((rule: { dayOfWeek: number[]; startTime: string; endTime: string }) => {
      if (rule.dayOfWeek.includes(dayOfWeek)) {
        const [startHour, startMin] = rule.startTime.split(":").map(Number);
        const [endHour, endMin] = rule.endTime.split(":").map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        return currentTime >= startTime && currentTime <= endTime;
      }
      return false;
    });

    if (!timeAllowed) {
      return { allowed: false, reason: "Outside allowed time range" };
    }
  }

  return { allowed: true, dashboard };
}

// ── Statistics ─────────────────────────────────────────────────────────────────────
export async function getDashboardStatistics() {
  const [
    totalOfficialEmails,
    activeOfficialEmails,
    totalSecurityOtps,
    activeSecurityOtps,
    totalPasswordResets,
    completedPasswordResets,
    totalNetworkChanges,
    approvedNetworkChanges,
    totalDashboardLogs,
    suspiciousActivities,
    totalMinisterDashboards,
    totalPoliceGeneralDashboards,
    totalStationAdminDashboards,
    totalUserDashboards,
  ] = await Promise.all([
    OfficialEmail.countDocuments(),
    OfficialEmail.countDocuments({ status: "active" }),
    SecurityOtp.countDocuments(),
    SecurityOtp.countDocuments({ status: "active" }),
    PasswordResetRequest.countDocuments(),
    PasswordResetRequest.countDocuments({ status: "completed" }),
    NetworkChangeRequest.countDocuments(),
    NetworkChangeRequest.countDocuments({ status: "approved" }),
    DashboardAccessLog.countDocuments(),
    DashboardAccessLog.countDocuments({ suspiciousActivity: true }),
    MinisterDashboard.countDocuments(),
    PoliceGeneralDashboard.countDocuments(),
    StationAdminDashboard.countDocuments(),
    UserDashboard.countDocuments(),
  ]);

  return {
    officialEmails: {
      total: totalOfficialEmails,
      active: activeOfficialEmails,
    },
    securityOtps: {
      total: totalSecurityOtps,
      active: activeSecurityOtps,
    },
    passwordResets: {
      total: totalPasswordResets,
      completed: completedPasswordResets,
    },
    networkChanges: {
      total: totalNetworkChanges,
      approved: approvedNetworkChanges,
    },
    dashboardLogs: {
      total: totalDashboardLogs,
      suspicious: suspiciousActivities,
    },
    dashboards: {
      minister: totalMinisterDashboards,
      policeGeneral: totalPoliceGeneralDashboards,
      stationAdmin: totalStationAdminDashboards,
      user: totalUserDashboards,
    },
  };
}
