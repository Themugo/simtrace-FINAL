// services/superAdmin.ts - Super admin layer services
import crypto from "crypto";
import {
  SuperAdmin,
  Admin,
  OfficialEmail,
  SecurityOtp,
} from "../db/index.js";

// ── Super Admin Management ─────────────────────────────────────────────────────────────
export async function createSuperAdmin(data: any) {
  const superAdminId = `superadmin_${crypto.randomBytes(16).toString("hex")}`;

  const superAdmin = await SuperAdmin.create({
    ...data,
    superAdminId,
    immutable: true,
    status: "active",
  });

  return superAdmin;
}

export async function getSuperAdmin(superAdminId: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId, status: "active" });
  if (!superAdmin) throw new Error("Super admin not found");
  return superAdmin;
}

export async function getSuperAdminByPersonalEmail(personalEmail: string) {
  const superAdmin = await SuperAdmin.findOne({ personalEmail, status: "active" });
  return superAdmin;
}

export async function getSuperAdminByOfficialEmail(officialEmail: string) {
  const superAdmin = await SuperAdmin.findOne({
    "officialEmails.email": officialEmail,
    status: "active",
  });
  return superAdmin;
}

export async function updateSuperAdmin(superAdminId: string, updates: any) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  // Prevent changing immutable fields
  if (updates.personalEmail && updates.personalEmail !== superAdmin.personalEmail) {
    throw new Error("Cannot change personal email - immutable field");
  }

  const updated = await SuperAdmin.findOneAndUpdate(
    { superAdminId },
    {
      ...updates,
      updatedAt: new Date(),
    },
    { new: true }
  );

  return updated;
}

export async function lockSuperAdmin(superAdminId: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  if (superAdmin.immutable) {
    throw new Error("Cannot lock immutable super admin");
  }

  superAdmin.status = "locked";
  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

export async function unlockSuperAdmin(superAdminId: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  superAdmin.status = "active";
  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

// ── Official Email Management ───────────────────────────────────────────────────────────
export async function addOfficialEmail(superAdminId: string, emailData: any) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  // Check if email already exists
  const existingEmail = superAdmin.officialEmails.find((e: any) => e.email === emailData.email);
  if (existingEmail) throw new Error("Official email already exists");

  // If this is the first email, make it primary
  const isFirstEmail = superAdmin.officialEmails.length === 0;
  const isPrimary = emailData.isPrimary || isFirstEmail;

  // If setting as primary, remove primary from others
  if (isPrimary) {
    superAdmin.officialEmails.forEach((e: any) => {
      e.isPrimary = false;
    });
  }

  superAdmin.officialEmails.push({
    email: emailData.email,
    isPrimary,
    isBackup: emailData.isBackup || false,
    officialEmailId: emailData.officialEmailId,
    securityOtpId: emailData.securityOtpId,
    verified: false,
    createdAt: new Date(),
  });

  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

export async function removeOfficialEmail(superAdminId: string, email: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  const emailIndex = superAdmin.officialEmails.findIndex((e: any) => e.email === email);
  if (emailIndex === -1) throw new Error("Official email not found");

  // Prevent removing the only official email
  if (superAdmin.officialEmails.length === 1) {
    throw new Error("Cannot remove the only official email");
  }

  // If removing primary, set another as primary
  if (superAdmin.officialEmails[emailIndex].isPrimary) {
    superAdmin.officialEmails[emailIndex + 1]!.isPrimary = true;
  }

  superAdmin.officialEmails.splice(emailIndex, 1);
  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

export async function setPrimaryOfficialEmail(superAdminId: string, email: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  const emailObj = superAdmin.officialEmails.find((e: any) => e.email === email);
  if (!emailObj) throw new Error("Official email not found");

  // Remove primary from all
  superAdmin.officialEmails.forEach((e: any) => {
    e.isPrimary = false;
  });

  // Set as primary
  emailObj.isPrimary = true;
  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

export async function setBackupOfficialEmail(superAdminId: string, email: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  const emailObj = superAdmin.officialEmails.find((e: any) => e.email === email);
  if (!emailObj) throw new Error("Official email not found");

  // Remove backup from all
  superAdmin.officialEmails.forEach((e: any) => {
    e.isBackup = false;
  });

  // Set as backup
  emailObj.isBackup = true;
  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

export async function verifyOfficialEmail(superAdminId: string, email: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  const emailObj = superAdmin.officialEmails.find((e: any) => e.email === email);
  if (!emailObj) throw new Error("Official email not found");

  emailObj.verified = true;
  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

// ── System Settings Management ─────────────────────────────────────────────────────────
export async function updateSystemSettings(superAdminId: string, settings: any) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  superAdmin.systemSettings = {
    ...superAdmin.systemSettings,
    ...settings,
  };
  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

export async function getSystemSettings(superAdminId: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  return superAdmin.systemSettings;
}

// ── Admin Management ───────────────────────────────────────────────────────────────────
export async function getManagedAdmins(superAdminId: string) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId }).populate("managedAdmins");
  if (!superAdmin) throw new Error("Super admin not found");

  return superAdmin.managedAdmins;
}

export async function getAdminStatistics(superAdminId: string) {
  const superAdmin = await SuperAdmin.findById(superAdminId);
  if (!superAdmin) throw new Error("Super admin not found");

  const [
    totalAdmins,
    activeAdmins,
    suspendedAdmins,
    adminsByRole,
  ] = await Promise.all([
    Admin.countDocuments({ managedBy: superAdminId }),
    Admin.countDocuments({ managedBy: superAdminId, status: "active" }),
    Admin.countDocuments({ managedBy: superAdminId, status: "suspended" }),
    Admin.aggregate([
      { $match: { managedBy: superAdminId } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    total: totalAdmins,
    active: activeAdmins,
    suspended: suspendedAdmins,
    byRole: adminsByRole.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
}

// ── Login History ─────────────────────────────────────────────────────────────────────
export async function recordLogin(superAdminId: string, ipAddress: string, userAgent: string, success: boolean) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  superAdmin.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success,
  });

  // Keep only last 100 login attempts
  if (superAdmin.loginHistory.length > 100) {
    superAdmin.loginHistory = superAdmin.loginHistory.slice(-100);
  }

  if (success) {
    superAdmin.lastLogin = new Date();
  }

  superAdmin.updatedAt = new Date();
  await superAdmin.save();

  return superAdmin;
}

export async function getLoginHistory(superAdminId: string, limit = 50) {
  const superAdmin = await SuperAdmin.findOne({ superAdminId });
  if (!superAdmin) throw new Error("Super admin not found");

  return superAdmin.loginHistory.slice(-limit).reverse();
}
