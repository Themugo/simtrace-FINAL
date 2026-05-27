// services/admin.js - Admin layer services
import crypto from "crypto";
import {
  Admin,
  SuperAdmin,
  AdminRolePermission,
} from "../db/index.js";

// ── Admin Management ─────────────────────────────────────────────────────────────────
export async function createAdmin(data) {
  const adminId = `admin_${crypto.randomBytes(16).toString("hex")}`;

  const admin = await Admin.create({
    ...data,
    adminId,
    status: "active",
    verified: false,
  });

  // Add to super admin's managed admins
  const superAdmin = await SuperAdmin.findById(data.managedBy);
  if (superAdmin) {
    superAdmin.managedAdmins.push(admin._id);
    await superAdmin.save();
  }

  return admin;
}

export async function getAdmin(adminId) {
  const admin = await Admin.findOne({ adminId, status: "active" }).populate("managedBy");
  if (!admin) throw new Error("Admin not found");
  return admin;
}

export async function getAdminByOfficialEmail(officialEmail) {
  const admin = await Admin.findOne({ officialEmail, status: "active" }).populate("managedBy");
  return admin;
}

export async function updateAdmin(adminId, updates) {
  const admin = await Admin.findOneAndUpdate(
    { adminId },
    {
      ...updates,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!admin) throw new Error("Admin not found");
  return admin;
}

export async function suspendAdmin(adminId, suspendedBy) {
  const admin = await Admin.findOneAndUpdate(
    { adminId },
    {
      status: "suspended",
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!admin) throw new Error("Admin not found");
  return admin;
}

export async function activateAdmin(adminId) {
  const admin = await Admin.findOneAndUpdate(
    { adminId },
    {
      status: "active",
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!admin) throw new Error("Admin not found");
  return admin;
}

export async function verifyAdmin(adminId) {
  const admin = await Admin.findOneAndUpdate(
    { adminId },
    {
      verified: true,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!admin) throw new Error("Admin not found");
  return admin;
}

export async function deleteAdmin(adminId) {
  const admin = await Admin.findOneAndDelete({ adminId });
  if (!admin) throw new Error("Admin not found");

  // Remove from super admin's managed admins
  const superAdmin = await SuperAdmin.findById(admin.managedBy);
  if (superAdmin) {
    superAdmin.managedAdmins = superAdmin.managedAdmins.filter(
      (id) => id.toString() !== admin._id.toString()
    );
    await superAdmin.save();
  }

  return admin;
}

export async function getAdminsBySuperAdmin(superAdminId) {
  const admins = await Admin.find({ managedBy: superAdminId }).sort({ createdAt: -1 });
  return admins;
}

export async function getAdminsByRole(role) {
  const admins = await Admin.find({ role, status: "active" }).sort({ createdAt: -1 });
  return admins;
}

export async function getAdminsByLayer(layer) {
  const admins = await Admin.find({
    "layerAccess.layer": layer,
    status: "active",
  }).sort({ createdAt: -1 });
  return admins;
}

// ── Layer Access Management ───────────────────────────────────────────────────────────
export async function addLayerAccess(adminId, layer, permissions) {
  const admin = await Admin.findOne({ adminId });
  if (!admin) throw new Error("Admin not found");

  // Check if layer access already exists
  const existingAccess = admin.layerAccess.find((la) => la.layer === layer);
  if (existingAccess) {
    existingAccess.permissions = permissions;
  } else {
    admin.layerAccess.push({
      layer,
      permissions,
    });
  }

  admin.updatedAt = new Date();
  await admin.save();

  return admin;
}

export async function removeLayerAccess(adminId, layer) {
  const admin = await Admin.findOne({ adminId });
  if (!admin) throw new Error("Admin not found");

  admin.layerAccess = admin.layerAccess.filter((la) => la.layer !== layer);
  admin.updatedAt = new Date();
  await admin.save();

  return admin;
}

export async function updateLayerPermissions(adminId, layer, permissions) {
  const admin = await Admin.findOne({ adminId });
  if (!admin) throw new Error("Admin not found");

  const layerAccess = admin.layerAccess.find((la) => la.layer === layer);
  if (!layerAccess) throw new Error("Layer access not found");

  layerAccess.permissions = permissions;
  admin.updatedAt = new Date();
  await admin.save();

  return admin;
}

// ── Role Management ───────────────────────────────────────────────────────────────────
export async function updateAdminRole(adminId, role, roleLevel) {
  const admin = await Admin.findOneAndUpdate(
    { adminId },
    {
      role,
      roleLevel,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!admin) throw new Error("Admin not found");
  return admin;
}

// ── Login History ─────────────────────────────────────────────────────────────────────
export async function recordAdminLogin(adminId, ipAddress, userAgent, success) {
  const admin = await Admin.findOne({ adminId });
  if (!admin) throw new Error("Admin not found");

  admin.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    success,
  });

  // Keep only last 100 login attempts
  if (admin.loginHistory.length > 100) {
    admin.loginHistory = admin.loginHistory.slice(-100);
  }

  if (success) {
    admin.lastLogin = new Date();
  }

  admin.updatedAt = new Date();
  await admin.save();

  return admin;
}

export async function getAdminLoginHistory(adminId, limit = 50) {
  const admin = await Admin.findOne({ adminId });
  if (!admin) throw new Error("Admin not found");

  return admin.loginHistory.slice(-limit).reverse();
}

// ── Statistics ───────────────────────────────────────────────────────────────────────
export async function getAdminStatistics(adminId) {
  const admin = await Admin.findById(adminId);
  if (!admin) throw new Error("Admin not found");

  return {
    role: admin.role,
    roleLevel: admin.roleLevel,
    layerAccess: admin.layerAccess,
    verified: admin.verified,
    status: admin.status,
    lastLogin: admin.lastLogin,
  };
}

export async function getAllAdminStatistics() {
  const [
    totalAdmins,
    activeAdmins,
    suspendedAdmins,
    verifiedAdmins,
    adminsByRole,
    adminsByRoleLevel,
  ] = await Promise.all([
    Admin.countDocuments(),
    Admin.countDocuments({ status: "active" }),
    Admin.countDocuments({ status: "suspended" }),
    Admin.countDocuments({ verified: true }),
    Admin.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    Admin.aggregate([
      { $group: { _id: "$roleLevel", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    total: totalAdmins,
    active: activeAdmins,
    suspended: suspendedAdmins,
    verified: verifiedAdmins,
    byRole: adminsByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byRoleLevel: adminsByRoleLevel.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
}
