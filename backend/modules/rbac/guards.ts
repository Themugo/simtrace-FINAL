import { Permission, Role, hasPermission, hasAnyPermission, hasAllPermissions, ROLE_PERMISSIONS } from './permissions.js';

// Guard functions for programmatic permission checks
// These can be used in business logic, not just middleware

export class PermissionGuard {
  static check(userRole: Role, permission: Permission): boolean {
    return hasPermission(userRole, permission);
  }

  static checkAny(userRole: Role, permissions: Permission[]): boolean {
    return hasAnyPermission(userRole, permissions);
  }

  static checkAll(userRole: Role, permissions: Permission[]): boolean {
    return hasAllPermissions(userRole, permissions);
  }

  static assert(userRole: Role, permission: Permission, message = 'Permission denied'): void {
    if (!this.check(userRole, permission)) {
      throw new Error(message);
    }
  }

  static assertAny(userRole: Role, permissions: Permission[], message = 'Permission denied'): void {
    if (!this.checkAny(userRole, permissions)) {
      throw new Error(message);
    }
  }

  static assertAll(userRole: Role, permissions: Permission[], message = 'Permission denied'): void {
    if (!this.checkAll(userRole, permissions)) {
      throw new Error(message);
    }
  }
}

// Helper to get user permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if role is admin or higher
export function isAdminOrHigher(role: Role): boolean {
  return role === Role.SUPER_ADMIN || role === Role.ADMIN;
}

// Check if role is moderator or higher
export function isModeratorOrHigher(role: Role): boolean {
  return isAdminOrHigher(role) || role === Role.MODERATOR;
}
