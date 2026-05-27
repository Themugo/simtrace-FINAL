// services/dashboardSecurity.js - Hierarchical Security Dashboard Services
import crypto from "crypto";
import bcrypt from "bcryptjs";
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

// ── Official Email Management ───────────────────────────────────────────────────────
export async function createOfficialEmail(data) {
  const emailId = `email_${crypto.randomBytes(16).toString("hex")}`;
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const officialEmail = await OfficialEmail.create({
    ...data,
    emailId,
    verificationToken,
    verificationExpiresAt,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // TODO: Send verification email to official email address
  console.log(`Verification email sent to ${data.officialEmail} with token ${verificationToken}`);

  return officialEmail;
}

export async function verifyOfficialEmail(emailId, token) {
  const email = await OfficialEmail.findOne({ emailId, verificationToken: token });
  if (!email) throw new Error("Invalid verification token");

  if (email.verificationExpiresAt < new Date()) {
    throw new Error("Verification token expired");
  }

  email.isVerified = true;
  email.verifiedAt = new Date();
  email.verificationToken = null;
  email.verificationExpiresAt = null;
  email.updatedAt = new Date();
  await email.save();

  return email;
}

export async function getOfficialEmail(emailId) {
  const email = await OfficialEmail.findOne({ emailId, status: "active" });
  if (!email) throw new Error("Official email not found");
  return email;
}

export async function getOfficialEmailByUser(userId) {
  const email = await OfficialEmail.findOne({ holderName: userId, status: "active" });
  return email;
}

export async function updateOfficialEmail(emailId, updates, updatedBy) {
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

export async function revokeOfficialEmail(emailId, revokedBy) {
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
export async function createSecurityOtp(data) {
  const otpId = `otp_${crypto.randomBytes(16).toString("hex")}`;
  const otpNumber = generateOtpNumber();

  const securityOtp = await SecurityOtp.create({
    ...data,
    otpId,
    otpNumber,
    createdBy: data.createdBy,
    updatedBy: data.createdBy,
  });

  // TODO: Send OTP number to official channel (secure delivery)
  console.log(`Security OTP number generated: ${otpNumber} for ${data.holderName}`);

  return securityOtp;
}

export async function verifySecurityOtp(otpId, otpNumber) {
  const otp = await SecurityOtp.findOne({ otpId, otpNumber, status: "active" });
  if (!otp) throw new Error("Invalid OTP number");

  otp.isVerified = true;
  otp.verifiedAt = new Date();
  otp.updatedAt = new Date();
  await otp.save();

  return otp;
}

export async function getSecurityOtp(otpId) {
  const otp = await SecurityOtp.findOne({ otpId, status: "active" });
  if (!otp) throw new Error("Security OTP not found");
  return otp;
}

export async function getSecurityOtpByUser(userId) {
  const otp = await SecurityOtp.findOne({ holderName: userId, status: "active" });
  return otp;
}

export async function updateSecurityOtp(otpId, updates, updatedBy) {
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

export async function reportLostOtp(otpId, reportedBy) {
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
  console.log(`Security OTP ${otpId} reported lost by ${reportedBy}`);
  
  return otp;
}

function generateOtpNumber() {
  // Generate a secure OTP number (e.g., 8-digit)
  return crypto.randomInt(10000000, 99999999).toString();
}

// ── Password Reset Workflow ─────────────────────────────────────────────────────────
export async function initiatePasswordReset(data) {
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
    verificationCode,
    verificationExpiresAt,
    status: "requested",
    createdBy: data.requesterId,
    updatedBy: data.requesterId,
  });

  // TODO: Send verification code to official email
  if (requesterEmail) {
    console.log(`Verification code sent to official email: ${verificationCode}`);
  }

  // TODO: Send notification via official channels
  getIO().to(`user:${data.userId}`).emit("password_reset_initiated", {
    requestId,
    requesterId: data.requesterId,
  });

  return resetRequest;
}

export async function verifyPasswordReset(requestId, verificationMethod, code, otpNumber) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");

  if (resetRequest.verificationExpiresAt < new Date()) {
    resetRequest.status = "expired";
    await resetRequest.save();
    throw new Error("Verification code expired");
  }

  if (verificationMethod === "official_email") {
    if (resetRequest.verificationCode !== code) {
      throw new Error("Invalid verification code");
    }
    resetRequest.emailVerified = true;
  } else if (verificationMethod === "security_otp") {
    const otp = await SecurityOtp.findOne({ otpNumber, status: "active" });
    if (!otp) throw new Error("Invalid OTP number");
    resetRequest.otpVerified = true;
  } else if (verificationMethod === "both") {
    if (resetRequest.verificationCode !== code) {
      throw new Error("Invalid verification code");
    }
    const otp = await SecurityOtp.findOne({ otpNumber, status: "active" });
    if (!otp) throw new Error("Invalid OTP number");
    resetRequest.emailVerified = true;
    resetRequest.otpVerified = true;
  }

  resetRequest.status = "verified";
  resetRequest.updatedAt = new Date();
  await resetRequest.save();

  return resetRequest;
}

export async function approvePasswordReset(requestId, approverId, approvalReason) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");

  if (resetRequest.status !== "verified") {
    throw new Error("Request must be verified before approval");
  }

  resetRequest.approverId = approverId;
  resetRequest.approvalStatus = "approved";
  resetRequest.approvalReason = approvalReason;
  resetRequest.approvedAt = new Date();
  resetRequest.status = "approved";
  resetRequest.updatedAt = new Date();
  await resetRequest.save();

  // TODO: Notify requester and user
  getIO().to(`user:${resetRequest.userId}`).emit("password_reset_approved", {
    requestId,
    approverId,
  });

  return resetRequest;
}

export async function rejectPasswordReset(requestId, approverId, rejectionReason) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");

  resetRequest.approverId = approverId;
  resetRequest.approvalStatus = "rejected";
  resetRequest.approvalReason = rejectionReason;
  resetRequest.status = "rejected";
  resetRequest.updatedAt = new Date();
  await resetRequest.save();

  // TODO: Notify requester
  getIO().to(`user:${resetRequest.requesterId}`).emit("password_reset_rejected", {
    requestId,
    reason: rejectionReason,
  });

  return resetRequest;
}

export async function completePasswordReset(requestId, newPassword) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");

  if (resetRequest.status !== "approved") {
    throw new Error("Request must be approved before completion");
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update user password (preserve all other data)
  const user = await User.findById(resetRequest.userId);
  if (!user) throw new Error("User not found");

  user.password = newPasswordHash;
  await user.save();

  // Update reset request
  resetRequest.newPasswordHash = newPasswordHash;
  resetRequest.passwordChangedAt = new Date();
  resetRequest.status = "completed";
  resetRequest.updatedAt = new Date();
  await resetRequest.save();

  // TODO: Log the password change in audit log
  // TODO: Notify user via official channels
  getIO().to(`user:${resetRequest.userId}`).emit("password_reset_completed", {
    requestId,
  });

  return resetRequest;
}

export async function getPasswordResetRequest(requestId) {
  const resetRequest = await PasswordResetRequest.findOne({ requestId });
  if (!resetRequest) throw new Error("Password reset request not found");
  return resetRequest;
}

export async function getPasswordResetRequestsByUser(userId) {
  const resetRequests = await PasswordResetRequest.find({ userId }).sort({ createdAt: -1 });
  return resetRequests;
}

// ── Network Change Workflow ────────────────────────────────────────────────────────
export async function initiateNetworkChange(data) {
  const requestId = `nc_${crypto.randomBytes(16).toString("hex")}`;

  // Verify requester has official email or OTP
  const requesterEmail = await OfficialEmail.findOne({ holderName: data.requesterId, status: "active" });
  const requesterOtp = await SecurityOtp.findOne({ holderName: data.requesterId, status: "active" });

  if (!requesterEmail && !requesterOtp) {
    throw new Error("Requester must have official email or security OTP");
  }

  // Determine required approval levels based on change scope
  const requiredApprovals = determineRequiredApprovals(data.approvalLevel);

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
  getIO().to(`role:admin`).emit("network_change_requested", {
    requestId,
    approvalLevel: data.approvalLevel,
  });

  return networkChangeRequest;
}

function determineRequiredApprovals(approvalLevel) {
  const approvalChain = {
    station: ["station"],
    region: ["station", "region"],
    division: ["station", "region", "division"],
    national: ["station", "region", "division", "national"],
    minister: ["station", "region", "division", "national", "minister"],
  };
  return approvalChain[approvalLevel] || ["station"];
}

export async function verifyNetworkChange(requestId, verificationMethod, otpNumber) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  if (verificationMethod === "official_email") {
    networkChange.emailVerified = true;
  } else if (verificationMethod === "security_otp") {
    const otp = await SecurityOtp.findOne({ otpNumber, status: "active" });
    if (!otp) throw new Error("Invalid OTP number");
    networkChange.otpVerified = true;
  } else if (verificationMethod === "both") {
    networkChange.emailVerified = true;
    const otp = await SecurityOtp.findOne({ otpNumber, status: "active" });
    if (!otp) throw new Error("Invalid OTP number");
    networkChange.otpVerified = true;
  }

  networkChange.status = "verified";
  networkChange.updatedAt = new Date();
  await networkChange.save();

  return networkChange;
}

export async function approveNetworkChange(requestId, approverId, approverEmailId, approverOtpId, comment) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  if (networkChange.status !== "verified") {
    throw new Error("Request must be verified before approval");
  }

  // Add approval
  networkChange.approvals.push({
    approverId,
    approverEmailId,
    approverOtpId,
    status: "approved",
    comment,
    approvedAt: new Date(),
  });

  // Check if all required approvals are received
  const approvedLevels = networkChange.approvals
    .filter(a => a.status === "approved")
    .map(a => getApproverLevel(a.approverId));
  
  const allApproved = networkChange.requiredApprovals.every(level => approvedLevels.includes(level));

  if (allApproved) {
    networkChange.status = "approved";
  }

  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Notify next approver or requester if all approved
  if (allApproved) {
    getIO().to(`user:${networkChange.requesterId}`).emit("network_change_approved", {
      requestId,
    });
  }

  return networkChange;
}

export async function rejectNetworkChange(requestId, approverId, rejectionReason) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  networkChange.status = "rejected";
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Notify requester
  getIO().to(`user:${networkChange.requesterId}`).emit("network_change_rejected", {
    requestId,
    reason: rejectionReason,
  });

  return networkChange;
}

export async function executeNetworkChange(requestId, executedBy, executionLog) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  if (networkChange.status !== "approved") {
    throw new Error("Request must be approved before execution");
  }

  networkChange.executionStatus = "in_progress";
  networkChange.executedAt = new Date();
  networkChange.executedBy = executedBy;
  networkChange.executionLog = executionLog;
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Execute actual network change
  // TODO: Update system configuration with new network settings
  
  networkChange.executionStatus = "completed";
  networkChange.status = "completed";
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Notify all stakeholders
  getIO().to(`role:admin`).emit("network_change_completed", {
    requestId,
  });

  return networkChange;
}

export async function rollbackNetworkChange(requestId, rollbackReason) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");

  networkChange.rollbackRequired = true;
  networkChange.rollbackStatus = "in_progress";
  networkChange.rollbackAt = new Date();
  networkChange.rollbackReason = rollbackReason;
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Execute rollback to previous network configuration
  // TODO: Restore previous system settings
  
  networkChange.rollbackStatus = "completed";
  networkChange.executionStatus = "rolled_back";
  networkChange.updatedAt = new Date();
  await networkChange.save();

  // TODO: Notify all stakeholders
  getIO().to(`role:admin`).emit("network_change_rolled_back", {
    requestId,
    reason: rollbackReason,
  });

  return networkChange;
}

export async function getNetworkChangeRequest(requestId) {
  const networkChange = await NetworkChangeRequest.findOne({ requestId });
  if (!networkChange) throw new Error("Network change request not found");
  return networkChange;
}

export async function getNetworkChangeRequestsByAgency(agencyId) {
  const networkChanges = await NetworkChangeRequest.find({ agencyId }).sort({ createdAt: -1 });
  return networkChanges;
}

function getApproverLevel(approverId) {
  // TODO: Implement logic to determine approver's level based on their role
  return "station"; // Placeholder
}

// ── Dashboard Access Logging ────────────────────────────────────────────────────────
export async function logDashboardAccess(data) {
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
  if (accessLog.suspiciousActivity) {
    // TODO: Send security alert
    console.log(`Suspicious activity detected: ${logId} with risk score ${riskScore}`);
    getIO().to(`role:admin`).emit("suspicious_activity", {
      logId,
      userId: data.userId,
      riskScore,
    });
  }

  return accessLog;
}

function calculateRiskScore(data) {
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

export async function getDashboardAccessLogs(userId, limit = 50) {
  const logs = await DashboardAccessLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return logs;
}

export async function getDashboardAccessLogsByLevel(dashboardLevel, limit = 100) {
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
export async function createMinisterDashboard(data) {
  const dashboardId = `md_${crypto.randomBytes(16).toString("hex")}`;

  const dashboard = await MinisterDashboard.create({
    ...data,
    dashboardId,
    createdBy: data.ministerId,
    updatedBy: data.ministerId,
  });

  return dashboard;
}

export async function getMinisterDashboard(ministerId) {
  const dashboard = await MinisterDashboard.findOne({ ministerId, status: "active" });
  if (!dashboard) throw new Error("Minister dashboard not found");
  return dashboard;
}

export async function updateMinisterDashboard(dashboardId, updates, updatedBy) {
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

export async function createPoliceGeneralDashboard(data) {
  const dashboardId = `pgd_${crypto.randomBytes(16).toString("hex")}`;

  const dashboard = await PoliceGeneralDashboard.create({
    ...data,
    dashboardId,
    createdBy: data.policeGeneralId,
    updatedBy: data.policeGeneralId,
  });

  return dashboard;
}

export async function getPoliceGeneralDashboard(policeGeneralId) {
  const dashboard = await PoliceGeneralDashboard.findOne({ policeGeneralId, status: "active" });
  if (!dashboard) throw new Error("Police general dashboard not found");
  return dashboard;
}

export async function updatePoliceGeneralDashboard(dashboardId, updates, updatedBy) {
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

export async function createStationAdminDashboard(data) {
  const dashboardId = `sad_${crypto.randomBytes(16).toString("hex")}`;

  const dashboard = await StationAdminDashboard.create({
    ...data,
    dashboardId,
    createdBy: data.stationAdminId,
    updatedBy: data.stationAdminId,
  });

  return dashboard;
}

export async function getStationAdminDashboard(stationAdminId) {
  const dashboard = await StationAdminDashboard.findOne({ stationAdminId, status: "active" });
  if (!dashboard) throw new Error("Station admin dashboard not found");
  return dashboard;
}

export async function updateStationAdminDashboard(dashboardId, updates, updatedBy) {
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

export async function createUserDashboard(data) {
  const dashboardId = `ud_${crypto.randomBytes(16).toString("hex")}`;

  const dashboard = await UserDashboard.create({
    ...data,
    dashboardId,
    createdBy: data.userId,
    updatedBy: data.userId,
  });

  return dashboard;
}

export async function getUserDashboard(userId) {
  const dashboard = await UserDashboard.findOne({ userId, status: "active" });
  if (!dashboard) throw new Error("User dashboard not found");
  return dashboard;
}

export async function updateUserDashboard(dashboardId, updates, updatedBy) {
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
export async function checkDashboardAccess(userId, dashboardLevel, ipAddress) {
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
  if (dashboard.allowedIPs && dashboard.allowedIPs.length > 0) {
    const ipAllowed = dashboard.allowedIPs.some(allowedIp => ipAddress.startsWith(allowedIp));
    if (!ipAllowed) {
      return { allowed: false, reason: "IP not whitelisted" };
    }
  }

  // Check time-based access
  if (dashboard.allowedTimeRanges && dashboard.allowedTimeRanges.length > 0) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const timeAllowed = dashboard.allowedTimeRanges.some(rule => {
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
