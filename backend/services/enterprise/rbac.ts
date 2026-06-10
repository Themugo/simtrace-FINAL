// services/enterprise/rbac.ts - Advanced RBAC and permissions
import crypto from 'crypto';

export interface Role {
  roleId: string;
  tenantId: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Permission {
  permissionId: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: 'device' | 'user' | 'tenant' | 'report' | 'admin' | 'api' | 'other';
}

export interface UserRole {
  userId: string;
  tenantId: string;
  roleId: string;
  assignedAt: number;
  assignedBy: string;
}

export interface ResourcePolicy {
  policyId: string;
  tenantId: string;
  resourceType: string;
  resourceId: string;
  roleId: string;
  permissions: string[];
  conditions?: {
    attribute?: string;
    operator?: string;
    value?: any;
  };
  createdAt: number;
}

export class RBACService {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userRoles: Map<string, UserRole> = new Map();
  private resourcePolicies: Map<string, ResourcePolicy> = new Map();

  constructor() {
    this.initializePermissions();
    this.initializeSystemRoles();
  }

  /**
   * Initialize default permissions
   */
  private initializePermissions(): void {
    const permissions: Permission[] = [
      // Device permissions
      { permissionId: 'device:read', name: 'Read Device', resource: 'device', action: 'read', description: 'View device information', category: 'device' },
      { permissionId: 'device:create', name: 'Create Device', resource: 'device', action: 'create', description: 'Add new devices', category: 'device' },
      { permissionId: 'device:update', name: 'Update Device', resource: 'device', action: 'update', description: 'Modify device information', category: 'device' },
      { permissionId: 'device:delete', name: 'Delete Device', resource: 'device', action: 'delete', description: 'Remove devices', category: 'device' },
      { permissionId: 'device:track', name: 'Track Device', resource: 'device', action: 'track', description: 'Track device location', category: 'device' },
      { permissionId: 'device:lock', name: 'Lock Device', resource: 'device', action: 'lock', description: 'Lock device remotely', category: 'device' },
      { permissionId: 'device:wipe', name: 'Wipe Device', resource: 'device', action: 'wipe', description: 'Wipe device data', category: 'device' },

      // User permissions
      { permissionId: 'user:read', name: 'Read User', resource: 'user', action: 'read', description: 'View user information', category: 'user' },
      { permissionId: 'user:create', name: 'Create User', resource: 'user', action: 'create', description: 'Add new users', category: 'user' },
      { permissionId: 'user:update', name: 'Update User', resource: 'user', action: 'update', description: 'Modify user information', category: 'user' },
      { permissionId: 'user:delete', name: 'Delete User', resource: 'user', action: 'delete', description: 'Remove users', category: 'user' },
      { permissionId: 'user:assign_role', name: 'Assign Role', resource: 'user', action: 'assign_role', description: 'Assign roles to users', category: 'user' },

      // Tenant permissions
      { permissionId: 'tenant:read', name: 'Read Tenant', resource: 'tenant', action: 'read', description: 'View tenant information', category: 'tenant' },
      { permissionId: 'tenant:update', name: 'Update Tenant', resource: 'tenant', action: 'update', description: 'Modify tenant settings', category: 'tenant' },
      { permissionId: 'tenant:manage_billing', name: 'Manage Billing', resource: 'tenant', action: 'manage_billing', description: 'Manage tenant billing', category: 'tenant' },
      { permissionId: 'tenant:manage_subscription', name: 'Manage Subscription', resource: 'tenant', action: 'manage_subscription', description: 'Manage tenant subscription', category: 'tenant' },

      // Report permissions
      { permissionId: 'report:read', name: 'Read Report', resource: 'report', action: 'read', description: 'View reports', category: 'report' },
      { permissionId: 'report:create', name: 'Create Report', resource: 'report', action: 'create', description: 'Generate reports', category: 'report' },
      { permissionId: 'report:export', name: 'Export Report', resource: 'report', action: 'export', description: 'Export reports', category: 'report' },

      // Admin permissions
      { permissionId: 'admin:read', name: 'Read Admin', resource: 'admin', action: 'read', description: 'View admin information', category: 'admin' },
      { permissionId: 'admin:manage', name: 'Manage Admin', resource: 'admin', action: 'manage', description: 'Manage admin settings', category: 'admin' },
      { permissionId: 'admin:audit', name: 'Audit Logs', resource: 'admin', action: 'audit', description: 'View audit logs', category: 'admin' },

      // API permissions
      { permissionId: 'api:read', name: 'Read API', resource: 'api', action: 'read', description: 'View API information', category: 'api' },
      { permissionId: 'api:create_key', name: 'Create API Key', resource: 'api', action: 'create_key', description: 'Create API keys', category: 'api' },
      { permissionId: 'api:revoke_key', name: 'Revoke API Key', resource: 'api', action: 'revoke_key', description: 'Revoke API keys', category: 'api' }
    ];

    for (const permission of permissions) {
      this.permissions.set(permission.permissionId, permission);
    }
  }

  /**
   * Initialize system roles
   */
  private initializeSystemRoles(): void {
    const systemRoles: Role[] = [
      {
        roleId: 'super_admin',
        tenantId: 'system',
        name: 'Super Admin',
        description: 'Full system access',
        isSystem: true,
        permissions: Array.from(this.permissions.keys()),
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        roleId: 'tenant_admin',
        tenantId: 'system',
        name: 'Tenant Admin',
        description: 'Full tenant access',
        isSystem: true,
        permissions: [
          'device:read', 'device:create', 'device:update', 'device:delete', 'device:track', 'device:lock', 'device:wipe',
          'user:read', 'user:create', 'user:update', 'user:delete', 'user:assign_role',
          'tenant:read', 'tenant:update',
          'report:read', 'report:create', 'report:export',
          'api:read', 'api:create_key', 'api:revoke_key'
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        roleId: 'tenant_user',
        tenantId: 'system',
        name: 'Tenant User',
        description: 'Standard user access',
        isSystem: true,
        permissions: [
          'device:read', 'device:track',
          'user:read',
          'report:read'
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        roleId: 'tenant_viewer',
        tenantId: 'system',
        name: 'Tenant Viewer',
        description: 'Read-only access',
        isSystem: true,
        permissions: [
          'device:read',
          'user:read',
          'report:read'
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    for (const role of systemRoles) {
      this.roles.set(role.roleId, role);
    }
  }

  /**
   * Create custom role
   */
  createRole(
    tenantId: string,
    name: string,
    description: string,
    permissions: string[]
  ): Role {
    const roleId = crypto.randomBytes(16).toString('hex');

    // Validate permissions
    for (const permissionId of permissions) {
      if (!this.permissions.has(permissionId)) {
        throw new Error(`Invalid permission: ${permissionId}`);
      }
    }

    const role: Role = {
      roleId,
      tenantId,
      name,
      description,
      isSystem: false,
      permissions,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.roles.set(roleId, role);
    return role;
  }

  /**
   * Get role by ID
   */
  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null;
  }

  /**
   * Get roles for tenant
   */
  getRolesForTenant(tenantId: string): Role[] {
    return Array.from(this.roles.values())
      .filter(r => r.tenantId === tenantId || r.tenantId === 'system');
  }

  /**
   * Update role
   */
  updateRole(roleId: string, updates: {
    name?: string;
    description?: string;
    permissions?: string[];
  }): Role | null {
    const role = this.roles.get(roleId);
    
    if (!role) {
      return null;
    }

    if (role.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    if (updates.name) role.name = updates.name;
    if (updates.description) role.description = updates.description;
    
    if (updates.permissions) {
      // Validate permissions
      for (const permissionId of updates.permissions) {
        if (!this.permissions.has(permissionId)) {
          throw new Error(`Invalid permission: ${permissionId}`);
        }
      }
      role.permissions = updates.permissions;
    }

    role.updatedAt = Date.now();
    this.roles.set(roleId, role);

    return role;
  }

  /**
   * Delete role
   */
  deleteRole(roleId: string): boolean {
    const role = this.roles.get(roleId);
    
    if (role) {
      if (role.isSystem) {
        throw new Error('Cannot delete system roles');
      }
      
      // Remove role assignments
      for (const [key, userRole] of this.userRoles.entries()) {
        if (userRole.roleId === roleId) {
          this.userRoles.delete(key);
        }
      }
      
      return this.roles.delete(roleId);
    }

    return false;
  }

  /**
   * Assign role to user
   */
  assignRole(userId: string, tenantId: string, roleId: string, assignedBy: string): UserRole {
    const role = this.roles.get(roleId);
    
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.tenantId !== tenantId && role.tenantId !== 'system') {
      throw new Error('Role does not belong to tenant');
    }

    const userRole: UserRole = {
      userId,
      tenantId,
      roleId,
      assignedAt: Date.now(),
      assignedBy
    };

    this.userRoles.set(`${userId}:${tenantId}`, userRole);
    return userRole;
  }

  /**
   * Remove role from user
   */
  removeRole(userId: string, tenantId: string): boolean {
    return this.userRoles.delete(`${userId}:${tenantId}`);
  }

  /**
   * Get user roles
   */
  getUserRoles(userId: string, tenantId: string): Role[] {
    const userRole = this.userRoles.get(`${userId}:${tenantId}`);
    
    if (!userRole) {
      return [];
    }

    const role = this.roles.get(userRole.roleId);
    return role ? [role] : [];
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category: string): Permission[] {
    return Array.from(this.permissions.values())
      .filter(p => p.category === category);
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, tenantId: string, permissionId: string): boolean {
    const userRoles = this.getUserRoles(userId, tenantId);
    
    for (const role of userRoles) {
      if (role.permissions.includes(permissionId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(userId: string, tenantId: string, permissionIds: string[]): boolean {
    for (const permissionId of permissionIds) {
      if (this.hasPermission(userId, tenantId, permissionId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(userId: string, tenantId: string, permissionIds: string[]): boolean {
    for (const permissionId of permissionIds) {
      if (!this.hasPermission(userId, tenantId, permissionId)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create resource policy
   */
  createResourcePolicy(
    tenantId: string,
    resourceType: string,
    resourceId: string,
    roleId: string,
    permissions: string[],
    conditions?: {
      attribute?: string;
      operator?: string;
      value?: any;
    }
  ): ResourcePolicy {
    const policyId = crypto.randomBytes(16).toString('hex');

    const policy: ResourcePolicy = {
      policyId,
      tenantId,
      resourceType,
      resourceId,
      roleId,
      permissions,
      conditions,
      createdAt: Date.now()
    };

    this.resourcePolicies.set(policyId, policy);
    return policy;
  }

  /**
   * Get resource policies
   */
  getResourcePolicies(tenantId: string, resourceType: string, resourceId: string): ResourcePolicy[] {
    return Array.from(this.resourcePolicies.values())
      .filter(p => p.tenantId === tenantId && p.resourceType === resourceType && p.resourceId === resourceId);
  }

  /**
   * Check resource access
   */
  checkResourceAccess(
    userId: string,
    tenantId: string,
    resourceType: string,
    resourceId: string,
    requiredPermission: string,
    context?: any
  ): boolean {
    // First check global permissions
    if (this.hasPermission(userId, tenantId, requiredPermission)) {
      return true;
    }

    // Check resource-specific policies
    const policies = this.getResourcePolicies(tenantId, resourceType, resourceId);
    const userRoles = this.getUserRoles(userId, tenantId);

    for (const policy of policies) {
      // Check if user has the role
      const hasRole = userRoles.some(r => r.roleId === policy.roleId);
      
      if (hasRole && policy.permissions.includes(requiredPermission)) {
        // Check conditions if present
        if (policy.conditions && context) {
          if (this.evaluateCondition(policy.conditions, context)) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Evaluate policy condition
   */
  private evaluateCondition(condition: any, context: any): boolean {
    if (!condition.attribute || !condition.operator) {
      return true;
    }

    const contextValue = context[condition.attribute];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return contextValue === conditionValue;
      case 'not_equals':
        return contextValue !== conditionValue;
      case 'contains':
        return Array.isArray(contextValue) && contextValue.includes(conditionValue);
      case 'greater_than':
        return contextValue > conditionValue;
      case 'less_than':
        return contextValue < conditionValue;
      default:
        return true;
    }
  }

  /**
   * Delete resource policy
   */
  deleteResourcePolicy(policyId: string): boolean {
    return this.resourcePolicies.delete(policyId);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRoles: number;
    totalPermissions: number;
    totalUserRoles: number;
    totalPolicies: number;
    rolesByTenant: { [key: string]: number };
    permissionsByCategory: { [key: string]: number };
  } {
    const roles = Array.from(this.roles.values());
    const policies = Array.from(this.resourcePolicies.values());

    const rolesByTenant: { [key: string]: number } = {};
    const permissionsByCategory: { [key: string]: number } = {};

    for (const role of roles) {
      rolesByTenant[role.tenantId] = (rolesByTenant[role.tenantId] || 0) + 1;
    }

    for (const permission of this.permissions.values()) {
      permissionsByCategory[permission.category] = (permissionsByCategory[permission.category] || 0) + 1;
    }

    return {
      totalRoles: roles.length,
      totalPermissions: this.permissions.size,
      totalUserRoles: this.userRoles.size,
      totalPolicies: policies.length,
      rolesByTenant,
      permissionsByCategory
    };
  }
}

export const rbacService = new RBACService();
