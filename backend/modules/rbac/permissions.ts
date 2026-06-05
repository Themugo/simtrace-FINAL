// Role-based access control permissions

export enum Permission {
  // User management
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  
  // Device management
  DEVICE_READ = 'device:read',
  DEVICE_WRITE = 'device:write',
  DEVICE_DELETE = 'device:delete',
  DEVICE_LOCK = 'device:lock',
  DEVICE_UNLOCK = 'device:unlock',
  
  // IMEI operations
  IMEI_READ = 'imei:read',
  IMEI_WRITE = 'imei:write',
  IMEI_DELETE = 'imei:delete',
  
  // Alerts
  ALERT_READ = 'alert:read',
  ALERT_WRITE = 'alert:write',
  ALERT_DELETE = 'alert:delete',
  
  // Billing
  BILLING_READ = 'billing:read',
  BILLING_WRITE = 'billing:write',
  
  // Admin operations
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_DELETE = 'admin:delete',
  
  // Audit logs
  AUDIT_READ = 'audit:read',
  AUDIT_WRITE = 'audit:write',
  
  // Reports
  REPORT_READ = 'report:read',
  REPORT_WRITE = 'report:write',
  
  // AI features
  AI_READ = 'ai:read',
  AI_WRITE = 'ai:write',
  
  // Community
  COMMUNITY_READ = 'community:read',
  COMMUNITY_WRITE = 'community:write',
  COMMUNITY_DELETE = 'community:delete',
  
  // Partners
  PARTNER_READ = 'partner:read',
  PARTNER_WRITE = 'partner:write',
  PARTNER_DELETE = 'partner:delete',
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest',
}

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.DEVICE_READ,
    Permission.DEVICE_WRITE,
    Permission.DEVICE_LOCK,
    Permission.DEVICE_UNLOCK,
    Permission.IMEI_READ,
    Permission.IMEI_WRITE,
    Permission.ALERT_READ,
    Permission.ALERT_WRITE,
    Permission.BILLING_READ,
    Permission.BILLING_WRITE,
    Permission.ADMIN_READ,
    Permission.ADMIN_WRITE,
    Permission.AUDIT_READ,
    Permission.REPORT_READ,
    Permission.REPORT_WRITE,
    Permission.AI_READ,
    Permission.AI_WRITE,
    Permission.COMMUNITY_READ,
    Permission.COMMUNITY_WRITE,
    Permission.COMMUNITY_DELETE,
    Permission.PARTNER_READ,
    Permission.PARTNER_WRITE,
  ],
  
  [Role.MODERATOR]: [
    Permission.DEVICE_READ,
    Permission.DEVICE_WRITE,
    Permission.IMEI_READ,
    Permission.ALERT_READ,
    Permission.ALERT_WRITE,
    Permission.COMMUNITY_READ,
    Permission.COMMUNITY_WRITE,
    Permission.COMMUNITY_DELETE,
  ],
  
  [Role.USER]: [
    Permission.DEVICE_READ,
    Permission.DEVICE_WRITE,
    Permission.IMEI_READ,
    Permission.ALERT_READ,
    Permission.BILLING_READ,
    Permission.REPORT_READ,
    Permission.AI_READ,
    Permission.COMMUNITY_READ,
    Permission.COMMUNITY_WRITE,
  ],
  
  [Role.GUEST]: [
    Permission.IMEI_READ,
    Permission.COMMUNITY_READ,
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some(p => rolePermissions.includes(p));
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.every(p => rolePermissions.includes(p));
}
