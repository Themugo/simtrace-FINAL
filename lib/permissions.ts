import { UserRole } from './types';

export type PermissionAction =
  | 'VIEW_DEVICES'
  | 'REGISTER_DEVICE'
  | 'REPORT_STOLEN'
  | 'LOCK_REMOTE'
  | 'VIEW_POLICE_REPORTS'
  | 'UPDATE_BLACKLIST'
  | 'MANAGE_TELECOM'
  | 'ADMIN_ACCESS';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  CITIZEN: ['VIEW_DEVICES', 'REGISTER_DEVICE', 'REPORT_STOLEN', 'LOCK_REMOTE'],
  POLICE: ['VIEW_DEVICES', 'REPORT_STOLEN', 'LOCK_REMOTE', 'VIEW_POLICE_REPORTS', 'UPDATE_BLACKLIST'],
  TELECOM: ['VIEW_DEVICES', 'LOCK_REMOTE', 'UPDATE_BLACKLIST', 'MANAGE_TELECOM'],
  INSURANCE: ['VIEW_DEVICES', 'VIEW_POLICE_REPORTS'],
  ADMIN: [
    'VIEW_DEVICES',
    'REGISTER_DEVICE',
    'REPORT_STOLEN',
    'LOCK_REMOTE',
    'VIEW_POLICE_REPORTS',
    'UPDATE_BLACKLIST',
    'MANAGE_TELECOM',
    'ADMIN_ACCESS',
  ],
  RESELLER: ['VIEW_DEVICES', 'REGISTER_DEVICE'],
};

export function hasPermission(role: UserRole | string | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  const userRole = (role.toUpperCase() as UserRole) || 'CITIZEN';
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.CITIZEN;
  return permissions.includes(action);
}

export function isLawEnforcement(role?: string): boolean {
  return role?.toUpperCase() === 'POLICE' || role?.toUpperCase() === 'ADMIN';
}

export function isTelecomAgent(role?: string): boolean {
  return role?.toUpperCase() === 'TELECOM' || role?.toUpperCase() === 'ADMIN';
}
