// services/enterprise/apiRateLimiting.ts - API rate limiting per tenant
import crypto from 'crypto';

export interface RateLimitRule {
  ruleId: string;
  tenantId: string;
  endpoint: string; // Can be wildcard like '/api/*'
  method: string; // GET, POST, PUT, DELETE, *
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RateLimitUsage {
  usageId: string;
  tenantId: string;
  endpoint: string;
  minuteCount: number;
  minuteReset: number;
  hourCount: number;
  hourReset: number;
  dayCount: number;
  dayReset: number;
  lastRequest: number;
}

export interface RateLimitViolation {
  violationId: string;
  tenantId: string;
  endpoint: string;
  ruleId: string;
  limitType: 'minute' | 'hour' | 'day';
  actualCount: number;
  limit: number;
  timestamp: number;
  ip?: string;
  userId?: string;
}

export class APIRateLimitingService {
  private rules: Map<string, RateLimitRule> = new Map();
  private usage: Map<string, RateLimitUsage> = new Map();
  private violations: Map<string, RateLimitViolation> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default rate limit rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: RateLimitRule[] = [
      {
        ruleId: 'default_free',
        tenantId: 'default',
        endpoint: '/api/*',
        method: '*',
        requestsPerMinute: 10,
        requestsPerHour: 100,
        requestsPerDay: 1000,
        burstLimit: 20,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        ruleId: 'default_starter',
        tenantId: 'default',
        endpoint: '/api/*',
        method: '*',
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 100,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        ruleId: 'default_professional',
        tenantId: 'default',
        endpoint: '/api/*',
        method: '*',
        requestsPerMinute: 300,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        burstLimit: 500,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        ruleId: 'default_enterprise',
        tenantId: 'default',
        endpoint: '/api/*',
        method: '*',
        requestsPerMinute: -1, // Unlimited
        requestsPerHour: -1,
        requestsPerDay: -1,
        burstLimit: -1,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.ruleId, rule);
    }
  }

  /**
   * Create rate limit rule
   */
  createRule(
    tenantId: string,
    endpoint: string,
    method: string,
    requestsPerMinute: number,
    requestsPerHour: number,
    requestsPerDay: number,
    burstLimit: number = requestsPerMinute * 2
  ): RateLimitRule {
    const ruleId = crypto.randomBytes(16).toString('hex');

    const rule: RateLimitRule = {
      ruleId,
      tenantId,
      endpoint,
      method,
      requestsPerMinute,
      requestsPerHour,
      requestsPerDay,
      burstLimit,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.rules.set(ruleId, rule);
    return rule;
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): RateLimitRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get rules for tenant
   */
  getRulesForTenant(tenantId: string): RateLimitRule[] {
    return Array.from(this.rules.values())
      .filter(r => r.tenantId === tenantId || r.tenantId === 'default');
  }

  /**
   * Get matching rule for endpoint
   */
  private getMatchingRule(tenantId: string, endpoint: string, method: string): RateLimitRule | null {
    const tenantRules = this.getRulesForTenant(tenantId);

    // First try exact match
    let exactMatch = tenantRules.find(r => r.endpoint === endpoint && (r.method === method || r.method === '*'));
    if (exactMatch && exactMatch.isActive) return exactMatch;

    // Then try wildcard match
    const endpointParts = endpoint.split('/');
    for (const rule of tenantRules) {
      if (!rule.isActive) continue;
      if (rule.method !== '*' && rule.method !== method) continue;

      const ruleParts = rule.endpoint.split('/');
      if (ruleParts.length !== endpointParts.length) continue;

      let match = true;
      for (let i = 0; i < ruleParts.length; i++) {
        if (ruleParts[i] !== '*' && ruleParts[i] !== endpointParts[i]) {
          match = false;
          break;
        }
      }

      if (match) return rule;
    }

    // Return default rule
    return tenantRules.find(r => r.tenantId === 'default' && r.endpoint === '/api/*') || null;
  }

  /**
   * Check rate limit
   */
  checkRateLimit(
    tenantId: string,
    endpoint: string,
    method: string,
    ip?: string,
    userId?: string
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limitType?: string;
  } {
    const rule = this.getMatchingRule(tenantId, endpoint, method);
    
    if (!rule) {
      return { allowed: true, remaining: -1, resetTime: -1 };
    }

    // If unlimited, allow
    if (rule.requestsPerMinute === -1) {
      return { allowed: true, remaining: -1, resetTime: -1 };
    }

    const usageKey = `${tenantId}:${endpoint}`;
    let usage = this.usage.get(usageKey);

    const now = Date.now();
    const minuteReset = Math.ceil(now / 60000) * 60000;
    const hourReset = Math.ceil(now / 3600000) * 3600000;
    const dayReset = Math.ceil(now / 86400000) * 86400000;

    if (!usage) {
      usage = {
        usageId: crypto.randomBytes(16).toString('hex'),
        tenantId,
        endpoint,
        minuteCount: 0,
        minuteReset,
        hourCount: 0,
        hourReset,
        dayCount: 0,
        dayReset,
        lastRequest: now
      };
    }

    // Reset counters if time has passed
    if (now > usage.minuteReset) {
      usage.minuteCount = 0;
      usage.minuteReset = minuteReset;
    }
    if (now > usage.hourReset) {
      usage.hourCount = 0;
      usage.hourReset = hourReset;
    }
    if (now > usage.dayReset) {
      usage.dayCount = 0;
      usage.dayReset = dayReset;
    }

    // Check limits
    let allowed = true;
    let limitType: 'minute' | 'hour' | 'day' | undefined;
    let remaining = rule.requestsPerMinute - usage.minuteCount;

    if (usage.minuteCount >= rule.requestsPerMinute) {
      allowed = false;
      limitType = 'minute';
      remaining = 0;
    } else if (usage.hourCount >= rule.requestsPerHour) {
      allowed = false;
      limitType = 'hour';
      remaining = 0;
    } else if (usage.dayCount >= rule.requestsPerDay) {
      allowed = false;
      limitType = 'day';
      remaining = 0;
    }

    // Record request if allowed
    if (allowed) {
      usage.minuteCount++;
      usage.hourCount++;
      usage.dayCount++;
      usage.lastRequest = now;
      this.usage.set(usageKey, usage);
    } else {
      // Record violation
      this.recordViolation(tenantId, endpoint, rule.ruleId, limitType!, usage, ip, userId);
    }

    return {
      allowed,
      remaining: Math.max(0, remaining),
      resetTime: limitType === 'minute' ? usage.minuteReset : limitType === 'hour' ? usage.hourReset : usage.dayReset,
      limitType
    };
  }

  /**
   * Record violation
   */
  private recordViolation(
    tenantId: string,
    endpoint: string,
    ruleId: string,
    limitType: 'minute' | 'hour' | 'day',
    usage: RateLimitUsage,
    ip?: string,
    userId?: string
  ): void {
    const violationId = crypto.randomBytes(16).toString('hex');

    const violation: RateLimitViolation = {
      violationId,
      tenantId,
      endpoint,
      ruleId,
      limitType,
      actualCount: limitType === 'minute' ? usage.minuteCount : limitType === 'hour' ? usage.hourCount : usage.dayCount,
      limit: this.getRule(ruleId)?.requestsPerMinute || 0,
      timestamp: Date.now(),
      ip,
      userId
    };

    this.violations.set(violationId, violation);
  }

  /**
   * Update rule
   */
  updateRule(ruleId: string, updates: {
    endpoint?: string;
    method?: string;
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
    burstLimit?: number;
    isActive?: boolean;
  }): RateLimitRule | null {
    const rule = this.rules.get(ruleId);
    
    if (!rule) {
      return null;
    }

    if (updates.endpoint) rule.endpoint = updates.endpoint;
    if (updates.method) rule.method = updates.method;
    if (updates.requestsPerMinute !== undefined) rule.requestsPerMinute = updates.requestsPerMinute;
    if (updates.requestsPerHour !== undefined) rule.requestsPerHour = updates.requestsPerHour;
    if (updates.requestsPerDay !== undefined) rule.requestsPerDay = updates.requestsPerDay;
    if (updates.burstLimit !== undefined) rule.burstLimit = updates.burstLimit;
    if (updates.isActive !== undefined) rule.isActive = updates.isActive;

    rule.updatedAt = Date.now();
    this.rules.set(ruleId, rule);

    return rule;
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Get usage for tenant
   */
  getUsageForTenant(tenantId: string): RateLimitUsage[] {
    return Array.from(this.usage.values())
      .filter(u => u.tenantId === tenantId);
  }

  /**
   * Get violations for tenant
   */
  getViolationsForTenant(tenantId: string, limit: number = 100): RateLimitViolation[] {
    return Array.from(this.violations.values())
      .filter(v => v.tenantId === tenantId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Reset usage for tenant
   */
  resetUsage(tenantId: string): number {
    let reset = 0;

    for (const [key, usage] of this.usage.entries()) {
      if (usage.tenantId === tenantId) {
        usage.minuteCount = 0;
        usage.hourCount = 0;
        usage.dayCount = 0;
        this.usage.set(key, usage);
        reset++;
      }
    }

    return reset;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalRules: number;
    totalUsage: number;
    totalViolations: number;
    violationsByType: { [key: string]: number };
    violationsByTenant: { [key: string]: number };
  } {
    const violations = Array.from(this.violations.values());

    const violationsByType: { [key: string]: number } = {};
    const violationsByTenant: { [key: string]: number } = {};

    for (const violation of violations) {
      violationsByType[violation.limitType] = (violationsByType[violation.limitType] || 0) + 1;
      violationsByTenant[violation.tenantId] = (violationsByTenant[violation.tenantId] || 0) + 1;
    }

    return {
      totalRules: this.rules.size,
      totalUsage: this.usage.size,
      totalViolations: violations.length,
      violationsByType,
      violationsByTenant
    };
  }

  /**
   * Clear old violations
   */
  clearOldViolations(maxAge: number = 604800000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [violationId, violation] of this.violations.entries()) {
      if (now - violation.timestamp > maxAge) {
        this.violations.delete(violationId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear old usage
   */
  clearOldUsage(maxAge: number = 86400000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [usageKey, usage] of this.usage.entries()) {
      if (now - usage.lastRequest > maxAge) {
        this.usage.delete(usageKey);
        cleared++;
      }
    }

    return cleared;
  }
}

export const apiRateLimitingService = new APIRateLimitingService();
