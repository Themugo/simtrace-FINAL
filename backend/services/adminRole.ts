// services/adminRole.ts - Admin role and permission services
import {
  AdminRolePermission,
} from "../db/index.js";

interface LayerPermission {
  layer: string;
  permissions: string[];
}

interface RolePermissionInput {
  role: string;
  description?: string;
  layerPermissions?: LayerPermission[];
  systemPermissions?: string[];
}

// ── Admin Role Permission Management ───────────────────────────────────────────────────
export async function createAdminRolePermission(data: RolePermissionInput) {
  const rolePermission = await AdminRolePermission.create({
    ...data,
    status: "active",
  });

  return rolePermission;
}

export async function getAdminRolePermission(role: string) {
  const rolePermission = await AdminRolePermission.findOne({ role, status: "active" });
  if (!rolePermission) throw new Error("Admin role permission not found");
  return rolePermission;
}

export async function getAllAdminRolePermissions() {
  const rolePermissions = await AdminRolePermission.find({ status: "active" }).sort({ role: 1 });
  return rolePermissions;
}

export async function updateAdminRolePermission(role: string, updates: Record<string, unknown>) {
  const rolePermission = await AdminRolePermission.findOneAndUpdate(
    { role },
    {
      ...updates,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!rolePermission) throw new Error("Admin role permission not found");
  return rolePermission;
}

export async function updateLayerPermissions(role: string, layer: string, permissions: string[]) {
  const rolePermission = await AdminRolePermission.findOne({ role });
  if (!rolePermission) throw new Error("Admin role permission not found");

  const layerPermission = (rolePermission as any).layerPermissions.find((lp: { layer: string }) => lp.layer === layer);
  if (layerPermission) {
    layerPermission.permissions = permissions;
  } else {
    (rolePermission as any).layerPermissions.push({
      layer,
      permissions,
    });
  }

  rolePermission.updatedAt = new Date();
  await rolePermission.save();

  return rolePermission;
}

export async function updateSystemPermissions(role: string, systemPermissions: string[]) {
  const rolePermission = await AdminRolePermission.findOneAndUpdate(
    { role },
    {
      systemPermissions,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!rolePermission) throw new Error("Admin role permission not found");
  return rolePermission;
}

export async function deactivateAdminRolePermission(role: string) {
  const rolePermission = await AdminRolePermission.findOneAndUpdate(
    { role },
    {
      status: "inactive",
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!rolePermission) throw new Error("Admin role permission not found");
  return rolePermission;
}

export async function activateAdminRolePermission(role: string) {
  const rolePermission = await AdminRolePermission.findOneAndUpdate(
    { role },
    {
      status: "active",
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!rolePermission) throw new Error("Admin role permission not found");
  return rolePermission;
}

// ── Permission Checking ───────────────────────────────────────────────────────────────
export async function checkAdminPermission(role: string, layer: string, permission: string) {
  const rolePermission = await AdminRolePermission.findOne({ role, status: "active" });
  if (!rolePermission) return { allowed: false, reason: "Role permission not found or inactive" };

  const layerPermission = (rolePermission as any).layerPermissions.find((lp: { layer: string }) => lp.layer === layer);
  if (!layerPermission) return { allowed: false, reason: `Layer '${layer}' not accessible for this role` };

  if (!layerPermission.permissions.includes(permission)) {
    return { allowed: false, reason: `Permission '${permission}' not granted for layer '${layer}'` };
  }

  return { allowed: true, rolePermission };
}

export async function checkSystemPermission(role: string, permission: string) {
  const rolePermission = await AdminRolePermission.findOne({ role, status: "active" });
  if (!rolePermission) return { allowed: false, reason: "Role permission not found or inactive" };

  if (!(rolePermission as any).systemPermissions.includes(permission)) {
    return { allowed: false, reason: `System permission '${permission}' not granted for this role` };
  }

  return { allowed: true, rolePermission };
}

// ── Initialize Default Roles ───────────────────────────────────────────────────────────
export async function initializeDefaultRoles() {
  const defaultRoles: RolePermissionInput[] = [
    {
      role: "finance",
      description: "Financial management and reporting",
      layerPermissions: [
        { layer: "end_user", permissions: ["read", "audit"] },
        { layer: "seller_reseller", permissions: ["read", "write", "approve"] },
        { layer: "repair_shop", permissions: ["read", "write", "approve"] },
        { layer: "telecom", permissions: ["read", "audit"] },
        { layer: "law_enforcement", permissions: ["read"] },
      ],
      systemPermissions: ["view_analytics", "export_data", "view_logs"],
    },
    {
      role: "technical",
      description: "Technical operations and system maintenance",
      layerPermissions: [
        { layer: "end_user", permissions: ["read", "write", "manage"] },
        { layer: "seller_reseller", permissions: ["read", "write"] },
        { layer: "repair_shop", permissions: ["read", "write"] },
        { layer: "telecom", permissions: ["read", "write", "manage"] },
        { layer: "law_enforcement", permissions: ["read", "write"] },
      ],
      systemPermissions: ["view_analytics", "manage_settings", "view_logs"],
    },
    {
      role: "support",
      description: "Customer support and user assistance",
      layerPermissions: [
        { layer: "end_user", permissions: ["read", "write"] },
        { layer: "seller_reseller", permissions: ["read"] },
        { layer: "repair_shop", permissions: ["read"] },
        { layer: "telecom", permissions: ["read"] },
        { layer: "law_enforcement", permissions: ["read"] },
      ],
      systemPermissions: ["view_analytics", "view_logs"],
    },
    {
      role: "marketing",
      description: "Marketing and business development",
      layerPermissions: [
        { layer: "end_user", permissions: ["read", "audit"] },
        { layer: "seller_reseller", permissions: ["read", "write"] },
        { layer: "repair_shop", permissions: ["read"] },
        { layer: "telecom", permissions: ["read"] },
        { layer: "law_enforcement", permissions: ["read"] },
      ],
      systemPermissions: ["view_analytics", "export_data"],
    },
    {
      role: "legal",
      description: "Legal compliance and regulatory affairs",
      layerPermissions: [
        { layer: "end_user", permissions: ["read", "audit"] },
        { layer: "seller_reseller", permissions: ["read", "audit"] },
        { layer: "repair_shop", permissions: ["read", "audit"] },
        { layer: "telecom", permissions: ["read", "audit"] },
        { layer: "law_enforcement", permissions: ["read", "write", "approve"] },
      ],
      systemPermissions: ["view_analytics", "export_data", "view_logs", "audit"],
    },
    {
      role: "operations",
      description: "Operations management and coordination",
      layerPermissions: [
        { layer: "end_user", permissions: ["read", "write"] },
        { layer: "seller_reseller", permissions: ["read", "write", "approve"] },
        { layer: "repair_shop", permissions: ["read", "write", "approve"] },
        { layer: "telecom", permissions: ["read", "write"] },
        { layer: "law_enforcement", permissions: ["read", "write"] },
      ],
      systemPermissions: ["view_analytics", "manage_settings", "export_data"],
    },
    {
      role: "compliance",
      description: "Compliance monitoring and reporting",
      layerPermissions: [
        { layer: "end_user", permissions: ["read", "audit"] },
        { layer: "seller_reseller", permissions: ["read", "audit"] },
        { layer: "repair_shop", permissions: ["read", "audit"] },
        { layer: "telecom", permissions: ["read", "audit"] },
        { layer: "law_enforcement", permissions: ["read", "audit"] },
      ],
      systemPermissions: ["view_analytics", "export_data", "view_logs", "audit"],
    },
    {
      role: "audit",
      description: "Internal audit and quality assurance",
      layerPermissions: [
        { layer: "end_user", permissions: ["read", "audit"] },
        { layer: "seller_reseller", permissions: ["read", "audit"] },
        { layer: "repair_shop", permissions: ["read", "audit"] },
        { layer: "telecom", permissions: ["read", "audit"] },
        { layer: "law_enforcement", permissions: ["read", "audit"] },
      ],
      systemPermissions: ["view_analytics", "export_data", "view_logs", "audit"],
    },
  ];

  const createdRoles: unknown[] = [];
  for (const roleData of defaultRoles) {
    const existing = await AdminRolePermission.findOne({ role: roleData.role });
    if (!existing) {
      const created = await createAdminRolePermission(roleData);
      createdRoles.push(created);
    }
  }

  return createdRoles;
}
