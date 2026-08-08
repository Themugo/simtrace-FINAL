// ── Advanced API Gateway ─────────────────────────────────────────────────────────
// Kong/Traefik, auth, quotas, logging, transformations, analytics

export interface GatewayRoute {
  id: string;
  path: string;
  methods: string[];
  service: string;
  authRequired: boolean;
  rateLimit?: number;
  quotaLimit?: number;
  transformations?: Transformation[];
  enabled: boolean;
}

export interface Transformation {
  type: 'request' | 'response';
  operation: 'add_header' | 'remove_header' | 'rewrite_path' | 'mask_field';
  config: Record<string, any>;
}

export interface RateLimitRule {
  id: string;
  identifier: string; // IP, user ID, API key
  limit: number;
  window: number; // in seconds
  current: number;
  resetAt: Date;
}

export interface QuotaRule {
  id: string;
  userId?: string;
  organizationId?: string;
  apikey?: string;
  limit: number;
  period: 'hourly' | 'daily' | 'monthly';
  current: number;
  resetAt: Date;
}

export interface GatewayLog {
  id: string;
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  organizationId?: string;
  ip: string;
  userAgent: string;
  authType?: string;
  rateLimited?: boolean;
  quotaExceeded?: boolean;
}

export interface GatewayAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgDuration: number;
  byPath: Record<string, number>;
  byMethod: Record<string, number>;
  byStatus: Record<number, number>;
  rateLimitedRequests: number;
  quotaExceededRequests: number;
}

class APIGateway {
  private routes: Map<string, GatewayRoute> = new Map();
  private rateLimits: Map<string, RateLimitRule> = new Map();
  private quotas: Map<string, QuotaRule> = new Map();
  private logs: GatewayLog[] = [];
  private analytics: GatewayAnalytics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgDuration: 0,
    byPath: {},
    byMethod: {},
    byStatus: {},
    rateLimitedRequests: 0,
    quotaExceededRequests: 0,
  };

  // Add route
  addRoute(route: Omit<GatewayRoute, 'id'>): GatewayRoute {
    const gatewayRoute: GatewayRoute = {
      ...route,
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.routes.set(gatewayRoute.id, gatewayRoute);
    return gatewayRoute;
  }

  // Get route
  getRoute(routeId: string): GatewayRoute | undefined {
    return this.routes.get(routeId);
  }

  // Get route by path
  getRouteByPath(path: string, method: string): GatewayRoute | undefined {
    return Array.from(this.routes.values()).find(
      r => r.enabled && r.methods.includes(method) && this.matchPath(path, r.path)
    );
  }

  // Match path
  private matchPath(requestPath: string, routePath: string): boolean {
    // Simple path matching - can be enhanced with regex
    if (routePath.includes('*')) {
      const pattern = routePath.replace('*', '.*');
      return new RegExp(pattern).test(requestPath);
    }
    return requestPath === routePath;
  }

  // Update route
  updateRoute(routeId: string, updates: Partial<GatewayRoute>): GatewayRoute | null {
    const route = this.routes.get(routeId);
    if (!route) return null;

    Object.assign(route, updates);
    return route;
  }

  // Remove route
  removeRoute(routeId: string): boolean {
    return this.routes.delete(routeId);
  }

  // Get all routes
  getAllRoutes(): GatewayRoute[] {
    return Array.from(this.routes.values());
  }

  // Check rate limit
  checkRateLimit(identifier: string, limit: number, window: number): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now();
    const rule = this.rateLimits.get(identifier);

    if (!rule || rule.resetAt.getTime() < now) {
      // Create new rule or reset existing
      const newRule: RateLimitRule = {
        id: `ratelimit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        identifier,
        limit,
        window,
        current: 1,
        resetAt: new Date(now + window * 1000),
      };

      this.rateLimits.set(identifier, newRule);
      return { allowed: true, remaining: limit - 1, resetAt: newRule.resetAt };
    }

    if (rule.current >= rule.limit) {
      return { allowed: false, remaining: 0, resetAt: rule.resetAt };
    }

    rule.current++;
    return { allowed: true, remaining: rule.limit - rule.current, resetAt: rule.resetAt };
  }

  // Check quota
  checkQuota(identifier: string, limit: number, period: 'hourly' | 'daily' | 'monthly'): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now();
    const rule = this.quotas.get(identifier);

    const window = period === 'hourly' ? 3600 : period === 'daily' ? 86400 : 2592000;

    if (!rule || rule.resetAt.getTime() < now) {
      // Create new rule or reset existing
      const newRule: QuotaRule = {
        id: `quota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        limit,
        period,
        current: 1,
        resetAt: new Date(now + window * 1000),
      };

      this.quotas.set(identifier, newRule);
      return { allowed: true, remaining: limit - 1, resetAt: newRule.resetAt };
    }

    if (rule.current >= rule.limit) {
      return { allowed: false, remaining: 0, resetAt: rule.resetAt };
    }

    rule.current++;
    return { allowed: true, remaining: rule.limit - rule.current, resetAt: rule.resetAt };
  }

  // Set quota for user
  setUserQuota(userId: string, limit: number, period: 'hourly' | 'daily' | 'monthly'): QuotaRule {
    const now = Date.now();
    const window = period === 'hourly' ? 3600 : period === 'daily' ? 86400 : 2592000;

    const quota: QuotaRule = {
      id: `quota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      limit,
      period,
      current: 0,
      resetAt: new Date(now + window * 1000),
    };

    this.quotas.set(userId, quota);
    return quota;
  }

  // Set quota for organization
  setOrganizationQuota(organizationId: string, limit: number, period: 'hourly' | 'daily' | 'monthly'): QuotaRule {
    const now = Date.now();
    const window = period === 'hourly' ? 3600 : period === 'daily' ? 86400 : 2592000;

    const quota: QuotaRule = {
      id: `quota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      limit,
      period,
      current: 0,
      resetAt: new Date(now + window * 1000),
    };

    this.quotas.set(organizationId, quota);
    return quota;
  }

  // Apply transformations
  applyTransformations(data: any, transformations: Transformation[], type: 'request' | 'response'): any {
    let result = { ...data };

    for (const transformation of transformations.filter(t => t.type === type)) {
      switch (transformation.operation) {
        case 'add_header':
          result.headers = result.headers || {};
          result.headers[transformation.config.header] = transformation.config.value;
          break;

        case 'remove_header':
          if (result.headers) {
            delete result.headers[transformation.config.header];
          }
          break;

        case 'rewrite_path':
          result.path = transformation.config.newPath;
          break;

        case 'mask_field':
          if (result[transformation.config.field]) {
            result[transformation.config.field] = this.maskValue(result[transformation.config.field]);
          }
          break;
      }
    }

    return result;
  }

  // Mask value
  private maskValue(value: string): string {
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '****' + value.substring(value.length - 2);
  }

  // Log request
  logRequest(log: Omit<GatewayLog, 'id' | 'timestamp'>): GatewayLog {
    const gatewayLog: GatewayLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.logs.push(gatewayLog);
    this.updateAnalytics(gatewayLog);
    return gatewayLog;
  }

  // Update analytics
  private updateAnalytics(log: GatewayLog): void {
    this.analytics.totalRequests++;

    if (log.statusCode >= 200 && log.statusCode < 300) {
      this.analytics.successfulRequests++;
    } else {
      this.analytics.failedRequests++;
    }

    // Update average duration
    const totalDuration = this.analytics.avgDuration * (this.analytics.totalRequests - 1);
    this.analytics.avgDuration = (totalDuration + log.duration) / this.analytics.totalRequests;

    // Update by path
    this.analytics.byPath[log.path] = (this.analytics.byPath[log.path] || 0) + 1;

    // Update by method
    this.analytics.byMethod[log.method] = (this.analytics.byMethod[log.method] || 0) + 1;

    // Update by status
    this.analytics.byStatus[log.statusCode] = (this.analytics.byStatus[log.statusCode] || 0) + 1;

    // Update rate limited
    if (log.rateLimited) {
      this.analytics.rateLimitedRequests++;
    }

    // Update quota exceeded
    if (log.quotaExceeded) {
      this.analytics.quotaExceededRequests++;
    }
  }

  // Get analytics
  getAnalytics(): GatewayAnalytics {
    return { ...this.analytics };
  }

  // Get logs
  getLogs(filters?: {
    path?: string;
    method?: string;
    userId?: string;
    organizationId?: string;
    limit?: number;
  }): GatewayLog[] {
    let filtered = this.logs;

    if (filters?.path) {
      filtered = filtered.filter(l => l.path === filters.path);
    }

    if (filters?.method) {
      filtered = filtered.filter(l => l.method === filters.method);
    }

    if (filters?.userId) {
      filtered = filtered.filter(l => l.userId === filters.userId);
    }

    if (filters?.organizationId) {
      filtered = filtered.filter(l => l.organizationId === filters.organizationId);
    }

    const limit = filters?.limit || 100;
    return filtered.slice(-limit);
  }

  // Clear old logs
  clearOldLogs(maxAgeHours = 24): void {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    this.logs = this.logs.filter(l => l.timestamp.getTime() > cutoff);
  }

  // Reset analytics
  resetAnalytics(): void {
    this.analytics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgDuration: 0,
      byPath: {},
      byMethod: {},
      byStatus: {},
      rateLimitedRequests: 0,
      quotaExceededRequests: 0,
    };
  }

  // Get statistics
  getStatistics(): {
    totalRoutes: number;
    totalRateLimits: number;
    totalQuotas: number;
    totalLogs: number;
  } {
    return {
      totalRoutes: this.routes.size,
      totalRateLimits: this.rateLimits.size,
      totalQuotas: this.quotas.size,
      totalLogs: this.logs.length,
    };
  }

  // Initialize default routes
  initializeDefaultRoutes(): void {
    this.addRoute({
      path: '/api/v1/*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      service: 'api',
      authRequired: true,
      rateLimit: 100,
      quotaLimit: 1000,
      enabled: true,
    });

    this.addRoute({
      path: '/api/v1/auth/*',
      methods: ['POST'],
      service: 'auth',
      authRequired: false,
      rateLimit: 10,
      enabled: true,
    });

    this.addRoute({
      path: '/health',
      methods: ['GET'],
      service: 'health',
      authRequired: false,
      enabled: true,
    });
  }
}

// Singleton instance
export const apiGateway = new APIGateway();

// Initialize default routes
apiGateway.initializeDefaultRoutes();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addGatewayRoute(route: Omit<GatewayRoute, 'id'>): GatewayRoute {
  return apiGateway.addRoute(route);
}

export function getGatewayRoute(routeId: string): GatewayRoute | undefined {
  return apiGateway.getRoute(routeId);
}

export function getGatewayRouteByPath(path: string, method: string): GatewayRoute | undefined {
  return apiGateway.getRouteByPath(path, method);
}

export function checkGatewayRateLimit(identifier: string, limit: number, window: number): { allowed: boolean; remaining: number; resetAt: Date } {
  return apiGateway.checkRateLimit(identifier, limit, window);
}

export function checkGatewayQuota(identifier: string, limit: number, period: 'hourly' | 'daily' | 'monthly'): { allowed: boolean; remaining: number; resetAt: Date } {
  return apiGateway.checkQuota(identifier, limit, period);
}

export function setUserQuota(userId: string, limit: number, period: 'hourly' | 'daily' | 'monthly'): QuotaRule {
  return apiGateway.setUserQuota(userId, limit, period);
}

export function setOrganizationQuota(organizationId: string, limit: number, period: 'hourly' | 'daily' | 'monthly'): QuotaRule {
  return apiGateway.setOrganizationQuota(organizationId, limit, period);
}

export function applyGatewayTransformations(data: any, transformations: Transformation[], type: 'request' | 'response'): any {
  return apiGateway.applyTransformations(data, transformations, type);
}

export function logGatewayRequest(log: Omit<GatewayLog, 'id' | 'timestamp'>): GatewayLog {
  return apiGateway.logRequest(log);
}

export function getGatewayAnalytics(): GatewayAnalytics {
  return apiGateway.getAnalytics();
}

export function getGatewayLogs(filters?: {
  path?: string;
  method?: string;
  userId?: string;
  organizationId?: string;
  limit?: number;
}): GatewayLog[] {
  return apiGateway.getLogs(filters);
}

export function getGatewayStatistics() {
  return apiGateway.getStatistics();
}
