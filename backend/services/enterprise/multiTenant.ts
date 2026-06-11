// services/enterprise/multiTenant.ts - Multi-tenant architecture
import crypto from 'crypto';

export interface Tenant {
  tenantId: string;
  name: string;
  slug: string;
  domain: string;
  status: 'active' | 'suspended' | 'pending' | 'deleted';
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  maxUsers: number;
  maxDevices: number;
  maxStorage: number; // in MB
  features: string[];
  createdAt: number;
  updatedAt: number;
  settings: {
    customBranding?: boolean;
    customDomain?: boolean;
    apiAccess?: boolean;
    ssoEnabled?: boolean;
    prioritySupport?: boolean;
  };
}

export interface TenantUser {
  userId: string;
  tenantId: string;
  email: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  status: 'active' | 'invited' | 'suspended' | 'deleted';
  joinedAt: number;
  lastActive: number;
}

export interface TenantQuota {
  tenantId: string;
  usersUsed: number;
  devicesUsed: number;
  storageUsed: number;
  apiCallsThisMonth: number;
  apiCallsLimit: number;
  bandwidthUsed: number; // in MB
  bandwidthLimit: number; // in MB
  resetDate: number;
}

export class MultiTenantService {
  private tenants: Map<string, Tenant> = new Map();
  private tenantUsers: Map<string, TenantUser> = new Map();
  private tenantQuotas: Map<string, TenantQuota> = new Map();

  /**
   * Create tenant
   */
  createTenant(
    name: string,
    slug: string,
    domain: string,
    plan: 'free' | 'starter' | 'professional' | 'enterprise' = 'free'
  ): Tenant {
    const tenantId = crypto.randomBytes(16).toString('hex');

    const planLimits = this.getPlanLimits(plan);

    const tenant: Tenant = {
      tenantId,
      name,
      slug,
      domain,
      status: 'active',
      plan,
      maxUsers: planLimits.maxUsers,
      maxDevices: planLimits.maxDevices,
      maxStorage: planLimits.maxStorage,
      features: planLimits.features,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: planLimits.settings
    };

    this.tenants.set(tenantId, tenant);

    // Initialize quota
    this.initializeQuota(tenantId, plan);

    return tenant;
  }

  /**
   * Get plan limits
   */
  private getPlanLimits(plan: string): {
    maxUsers: number;
    maxDevices: number;
    maxStorage: number;
    features: string[];
    settings: any;
  } {
    const limits: { [key: string]: any } = {
      free: {
        maxUsers: 5,
        maxDevices: 10,
        maxStorage: 1024, // 1 GB
        features: ['basic_tracking', 'alerts', 'reports'],
        settings: {
          customBranding: false,
          customDomain: false,
          apiAccess: false,
          ssoEnabled: false,
          prioritySupport: false
        }
      },
      starter: {
        maxUsers: 25,
        maxDevices: 100,
        maxStorage: 10240, // 10 GB
        features: ['basic_tracking', 'alerts', 'reports', 'api_access', 'analytics'],
        settings: {
          customBranding: false,
          customDomain: false,
          apiAccess: true,
          ssoEnabled: false,
          prioritySupport: false
        }
      },
      professional: {
        maxUsers: 100,
        maxDevices: 1000,
        maxStorage: 102400, // 100 GB
        features: ['basic_tracking', 'alerts', 'reports', 'api_access', 'analytics', 'custom_branding', 'sso'],
        settings: {
          customBranding: true,
          customDomain: false,
          apiAccess: true,
          ssoEnabled: true,
          prioritySupport: false
        }
      },
      enterprise: {
        maxUsers: -1, // Unlimited
        maxDevices: -1, // Unlimited
        maxStorage: -1, // Unlimited
        features: ['basic_tracking', 'alerts', 'reports', 'api_access', 'analytics', 'custom_branding', 'sso', 'custom_domain', 'priority_support', 'white_label'],
        settings: {
          customBranding: true,
          customDomain: true,
          apiAccess: true,
          ssoEnabled: true,
          prioritySupport: true
        }
      }
    };

    return limits[plan] || limits.free;
  }

  /**
   * Initialize quota for tenant
   */
  private initializeQuota(tenantId: string, plan: string): void {
    this.getPlanLimits(plan);

    const quota: TenantQuota = {
      tenantId,
      usersUsed: 0,
      devicesUsed: 0,
      storageUsed: 0,
      apiCallsThisMonth: 0,
      apiCallsLimit: plan === 'enterprise' ? -1 : plan === 'professional' ? 100000 : plan === 'starter' ? 10000 : 1000,
      bandwidthUsed: 0,
      bandwidthLimit: plan === 'enterprise' ? -1 : plan === 'professional' ? 1024000 : plan === 'starter' ? 102400 : 10240,
      resetDate: this.getNextMonthReset()
    };

    this.tenantQuotas.set(tenantId, quota);
  }

  /**
   * Get next month reset date
   */
  private getNextMonthReset(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.getTime();
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId: string): Tenant | null {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Get tenant by slug
   */
  getTenantBySlug(slug: string): Tenant | null {
    return Array.from(this.tenants.values()).find(t => t.slug === slug) || null;
  }

  /**
   * Get tenant by domain
   */
  getTenantByDomain(domain: string): Tenant | null {
    return Array.from(this.tenants.values()).find(t => t.domain === domain) || null;
  }

  /**
   * Update tenant
   */
  updateTenant(tenantId: string, updates: {
    name?: string;
    slug?: string;
    domain?: string;
    status?: 'active' | 'suspended' | 'pending' | 'deleted';
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
  }): Tenant | null {
    const tenant = this.tenants.get(tenantId);
    
    if (!tenant) {
      return null;
    }

    if (updates.name) tenant.name = updates.name;
    if (updates.slug) tenant.slug = updates.slug;
    if (updates.domain) tenant.domain = updates.domain;
    if (updates.status) tenant.status = updates.status;
    
    if (updates.plan) {
      const planLimits = this.getPlanLimits(updates.plan);
      tenant.plan = updates.plan;
      tenant.maxUsers = planLimits.maxUsers;
      tenant.maxDevices = planLimits.maxDevices;
      tenant.maxStorage = planLimits.maxStorage;
      tenant.features = planLimits.features;
      tenant.settings = planLimits.settings;
      
      // Reinitialize quota
      this.initializeQuota(tenantId, updates.plan);
    }

    tenant.updatedAt = Date.now();
    this.tenants.set(tenantId, tenant);

    return tenant;
  }

  /**
   * Delete tenant
   */
  deleteTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    
    if (tenant) {
      tenant.status = 'deleted';
      this.tenants.set(tenantId, tenant);
      return true;
    }

    return false;
  }

  /**
   * Add user to tenant
   */
  addUserToTenant(userId: string, tenantId: string, email: string, role: 'owner' | 'admin' | 'user' | 'viewer' = 'user'): TenantUser {
    const tenantUser: TenantUser = {
      userId,
      tenantId,
      email,
      role,
      status: 'active',
      joinedAt: Date.now(),
      lastActive: Date.now()
    };

    this.tenantUsers.set(`${tenantId}:${userId}`, tenantUser);

    // Update quota
    this.updateQuota(tenantId, { usersUsed: 1 });

    return tenantUser;
  }

  /**
   * Remove user from tenant
   */
  removeUserFromTenant(userId: string, tenantId: string): boolean {
    const key = `${tenantId}:${userId}`;
    const removed = this.tenantUsers.delete(key);

    if (removed) {
      this.updateQuota(tenantId, { usersUsed: -1 });
    }

    return removed;
  }

  /**
   * Get users for tenant
   */
  getUsersForTenant(tenantId: string): TenantUser[] {
    return Array.from(this.tenantUsers.values())
      .filter(u => u.tenantId === tenantId);
  }

  /**
   * Get tenant for user
   */
  getTenantForUser(userId: string): Tenant | null {
    const tenantUser = Array.from(this.tenantUsers.values()).find(u => u.userId === userId);
    
    if (tenantUser) {
      return this.tenants.get(tenantUser.tenantId) || null;
    }

    return null;
  }

  /**
   * Update user role
   */
  updateUserRole(userId: string, tenantId: string, role: 'owner' | 'admin' | 'user' | 'viewer'): boolean {
    const key = `${tenantId}:${userId}`;
    const tenantUser = this.tenantUsers.get(key);
    
    if (tenantUser) {
      tenantUser.role = role;
      this.tenantUsers.set(key, tenantUser);
      return true;
    }

    return false;
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, tenantId: string, status: 'active' | 'invited' | 'suspended' | 'deleted'): boolean {
    const key = `${tenantId}:${userId}`;
    const tenantUser = this.tenantUsers.get(key);
    
    if (tenantUser) {
      tenantUser.status = status;
      this.tenantUsers.set(key, tenantUser);
      return true;
    }

    return false;
  }

  /**
   * Get quota for tenant
   */
  getQuota(tenantId: string): TenantQuota | null {
    return this.tenantQuotas.get(tenantId) || null;
  }

  /**
   * Update quota
   */
  private updateQuota(tenantId: string, updates: {
    usersUsed?: number;
    devicesUsed?: number;
    storageUsed?: number;
    apiCallsThisMonth?: number;
    bandwidthUsed?: number;
  }): void {
    const quota = this.tenantQuotas.get(tenantId);
    
    if (quota) {
      if (updates.usersUsed !== undefined) quota.usersUsed += updates.usersUsed;
      if (updates.devicesUsed !== undefined) quota.devicesUsed += updates.devicesUsed;
      if (updates.storageUsed !== undefined) quota.storageUsed += updates.storageUsed;
      if (updates.apiCallsThisMonth !== undefined) quota.apiCallsThisMonth += updates.apiCallsThisMonth;
      if (updates.bandwidthUsed !== undefined) quota.bandwidthUsed += updates.bandwidthUsed;
      
      this.tenantQuotas.set(tenantId, quota);
    }
  }

  /**
   * Check if tenant can add user
   */
  canAddUser(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    const quota = this.tenantQuotas.get(tenantId);
    
    if (!tenant || !quota) return false;
    if (tenant.maxUsers === -1) return true;
    
    return quota.usersUsed < tenant.maxUsers;
  }

  /**
   * Check if tenant can add device
   */
  canAddDevice(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    const quota = this.tenantQuotas.get(tenantId);
    
    if (!tenant || !quota) return false;
    if (tenant.maxDevices === -1) return true;
    
    return quota.devicesUsed < tenant.maxDevices;
  }

  /**
   * Check if tenant has storage space
   */
  hasStorageSpace(tenantId: string, requiredSpace: number): boolean {
    const tenant = this.tenants.get(tenantId);
    const quota = this.tenantQuotas.get(tenantId);
    
    if (!tenant || !quota) return false;
    if (tenant.maxStorage === -1) return true;
    
    return (quota.storageUsed + requiredSpace) <= tenant.maxStorage;
  }

  /**
   * Check if tenant can make API call
   */
  canMakeAPICall(tenantId: string): boolean {
    const quota = this.tenantQuotas.get(tenantId);
    
    if (!quota) return false;
    if (quota.apiCallsLimit === -1) return true;
    
    // Check if we need to reset monthly counter
    if (Date.now() > quota.resetDate) {
      quota.apiCallsThisMonth = 0;
      quota.resetDate = this.getNextMonthReset();
      this.tenantQuotas.set(tenantId, quota);
    }
    
    return quota.apiCallsThisMonth < quota.apiCallsLimit;
  }

  /**
   * Record API call
   */
  recordAPICall(tenantId: string): void {
    this.updateQuota(tenantId, { apiCallsThisMonth: 1 });
  }

  /**
   * Get all tenants
   */
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalTenants: number;
    tenantsByPlan: { [key: string]: number };
    tenantsByStatus: { [key: string]: number };
    totalUsers: number;
    totalDevices: number;
    totalStorageUsed: number;
  } {
    const tenants = Array.from(this.tenants.values());
    const quotas = Array.from(this.tenantQuotas.values());

    const tenantsByPlan: { [key: string]: number } = {};
    const tenantsByStatus: { [key: string]: number } = {};

    for (const tenant of tenants) {
      tenantsByPlan[tenant.plan] = (tenantsByPlan[tenant.plan] || 0) + 1;
      tenantsByStatus[tenant.status] = (tenantsByStatus[tenant.status] || 0) + 1;
    }

    const totalUsers = quotas.reduce((sum, q) => sum + q.usersUsed, 0);
    const totalDevices = quotas.reduce((sum, q) => sum + q.devicesUsed, 0);
    const totalStorageUsed = quotas.reduce((sum, q) => sum + q.storageUsed, 0);

    return {
      totalTenants: tenants.length,
      tenantsByPlan,
      tenantsByStatus,
      totalUsers,
      totalDevices,
      totalStorageUsed
    };
  }
}

export const multiTenantService = new MultiTenantService();
