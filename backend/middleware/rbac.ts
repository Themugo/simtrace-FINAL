// Role-Based Access Control (RBAC)
// Permission matrix, role inheritance, fine-grained permissions

import { Request, Response, NextFunction } from 'express';

// Permission definitions
export const Permissions = {
  // Device management
  DEVICE_CREATE: 'device:create',
  DEVICE_READ: 'device:read',
  DEVICE_UPDATE: 'device:update',
  DEVICE_DELETE: 'device:delete',
  DEVICE_TRACK: 'device:track',
  
  // Alert management
  ALERT_CREATE: 'alert:create',
  ALERT_READ: 'alert:read',
  ALERT_UPDATE: 'alert:update',
  ALERT_DELETE: 'alert:delete',
  
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Admin functions
  ADMIN_READ_ALL: 'admin:read_all',
  ADMIN_MANAGE_USERS: 'admin:manage_users',
  ADMIN_MANAGE_TENANTS: 'admin:manage_tenants',
  ADMIN_VIEW_METRICS: 'admin:view_metrics',
  
  // Partner functions
  PARTNER_API_ACCESS: 'partner:api_access',
  PARTNER_WEBHOOK_CONFIG: 'partner:webhook_config',
  
  // Telecom functions
  TELECOM_LOOKUP: 'telecom:lookup',
  TELECOM_BLACKLIST: 'telecom:blacklist',
};

// Role definitions with permissions
export const Roles: Record<string, any> = {
  USER: {
    permissions: [
      Permissions.DEVICE_CREATE,
      Permissions.DEVICE_READ,
      Permissions.DEVICE_UPDATE,
      Permissions.DEVICE_TRACK,
      Permissions.ALERT_CREATE,
      Permissions.ALERT_READ,
      Permissions.ALERT_UPDATE,
    ],
  },
  
  ADMIN: {
    inherits: ['USER'],
    permissions: [
      Permissions.DEVICE_DELETE,
      Permissions.ALERT_DELETE,
      Permissions.USER_READ,
      Permissions.ADMIN_READ_ALL,
      Permissions.ADMIN_VIEW_METRICS,
    ],
  },
  
  TELECOM: {
    permissions: [
      Permissions.DEVICE_READ,
      Permissions.TELECOM_LOOKUP,
      Permissions.TELECOM_BLACKLIST,
      Permissions.PARTNER_API_ACCESS,
      Permissions.PARTNER_WEBHOOK_CONFIG,
    ],
  },
  
  LAW_ENFORCEMENT: {
    permissions: [
      Permissions.DEVICE_READ,
      Permissions.ALERT_READ,
      Permissions.TELECOM_LOOKUP,
    ],
  },
  
  SUPER_ADMIN: {
    inherits: ['ADMIN'],
    permissions: [
      Permissions.USER_CREATE,
      Permissions.USER_UPDATE,
      Permissions.USER_DELETE,
      Permissions.ADMIN_MANAGE_USERS,
      Permissions.ADMIN_MANAGE_TENANTS,
    ],
  },
};

// Permission matrix
const permissionMatrix: Record<string, string[]> = {};

// Build permission matrix from role definitions
function buildPermissionMatrix() {
  for (const [roleName, roleConfig] of Object.entries(Roles)) {
    const permissions = new Set(roleConfig.permissions || []);
    
    // Add inherited permissions
    if (roleConfig.inherits) {
      for (const inheritedRole of roleConfig.inherits) {
        const inheritedConfig = Roles[inheritedRole];
        if (inheritedConfig?.permissions) {
          inheritedConfig.permissions.forEach((perm: string) => permissions.add(perm));
        }
      }
    }
    
    permissionMatrix[roleName] = Array.from(permissions) as string[];
  }
}

buildPermissionMatrix();

// Check if user has permission
export function hasPermission(userRole: string, permission: string): boolean {
  const rolePermissions = permissionMatrix[userRole];
  return rolePermissions?.includes(permission) || false;
}

// Check if user has any of the required permissions
export function hasAnyPermission(userRole: string, permissions: string[]): boolean {
  const rolePermissions = permissionMatrix[userRole];
  return permissions.some(perm => rolePermissions?.includes(perm));
}

// Check if user has all required permissions
export function hasAllPermissions(userRole: string, permissions: string[]): boolean {
  const rolePermissions = permissionMatrix[userRole];
  return permissions.every(perm => rolePermissions?.includes(perm));
}

// RBAC middleware
export function rbacMiddleware(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.user as any)?.role;
    
    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }
    
    if (!hasPermission(userRole, requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermission,
      });
    }
    
    next();
  };
}

// Multiple permissions middleware (any)
export function rbacAnyMiddleware(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.user as any)?.role;
    
    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }
    
    if (!hasAnyPermission(userRole, requiredPermissions)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions,
      });
    }
    
    next();
  };
}

// Get all permissions for a role
export function getRolePermissions(role: string): string[] {
  return permissionMatrix[role] || [];
}

// Check role hierarchy
export function isRoleHigherOrEqual(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    USER: 1,
    TELECOM: 2,
    LAW_ENFORCEMENT: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4,
  };
  
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}
