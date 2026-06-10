// ── Edge API & Global Distribution ─────────────────────────────────────────────
// Cloudflare Workers, lower latency, regional routing, DDoS protection

export interface EdgeRoute {
  id: string;
  path: string;
  methods: string[];
  origin: string;
  cacheTTL?: number; // in seconds
  cacheKey?: string[];
  bypassCache?: boolean;
  rateLimit?: number;
  enabled: boolean;
}

export interface RegionalConfig {
  region: string;
  endpoint: string;
  priority: number;
  healthCheck: {
    path: string;
    interval: number;
    timeout: number;
  };
  healthy: boolean;
  latency: number;
}

export interface DDoSRule {
  id: string;
  name: string;
  type: 'rate_limit' | 'ip_block' | 'geo_block' | 'signature_match';
  config: {
    threshold?: number;
    window?: number;
    blockedIPs?: string[];
    blockedCountries?: string[];
    patterns?: string[];
  };
  enabled: boolean;
}

export interface EdgeCacheEntry {
  key: string;
  value: unknown;
  ttl: number;
  createdAt: Date;
  hits: number;
}

export interface EdgeRequest {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
  clientIP: string;
  country?: string;
  timestamp: Date;
  region?: string;
}

export interface EdgeResponse {
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body?: unknown;
  cached: boolean;
  duration: number;
  region: string;
}

class EdgeAPI {
  private routes: Map<string, EdgeRoute> = new Map();
  private regionalConfigs: Map<string, RegionalConfig> = new Map();
  private ddosRules: Map<string, DDoSRule> = new Map();
  private cache: Map<string, EdgeCacheEntry> = new Map();
  private requestLog: EdgeRequest[] = [];
  private responseLog: EdgeResponse[] = [];

  // Add edge route
  addEdgeRoute(route: Omit<EdgeRoute, 'id'>): EdgeRoute {
    const edgeRoute: EdgeRoute = {
      ...route,
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.routes.set(edgeRoute.id, edgeRoute);
    return edgeRoute;
  }

  // Get route
  getRoute(routeId: string): EdgeRoute | undefined {
    return this.routes.get(routeId);
  }

  // Get route by path
  getRouteByPath(path: string, method: string): EdgeRoute | undefined {
    return Array.from(this.routes.values()).find(
      r => r.enabled && r.methods.includes(method) && this.matchPath(path, r.path)
    );
  }

  // Match path
  private matchPath(requestPath: string, routePath: string): boolean {
    if (routePath.includes('*')) {
      const pattern = routePath.replace('*', '.*');
      return new RegExp(pattern).test(requestPath);
    }
    return requestPath === routePath;
  }

  // Add regional config
  addRegionalConfig(config: Omit<RegionalConfig, 'healthy' | 'latency'>): RegionalConfig {
    const regionalConfig: RegionalConfig = {
      ...config,
      healthy: true,
      latency: 0,
    };

    this.regionalConfigs.set(regionalConfig.region, regionalConfig);
    return regionalConfig;
  }

  // Get regional config
  getRegionalConfig(region: string): RegionalConfig | undefined {
    return this.regionalConfigs.get(region);
  }

  // Get all regional configs
  getAllRegionalConfigs(): RegionalConfig[] {
    return Array.from(this.regionalConfigs.values());
  }

  // Get best region
  getBestRegion(): RegionalConfig | null {
    const healthyRegions = Array.from(this.regionalConfigs.values())
      .filter(r => r.healthy)
      .sort((a, b) => a.priority - b.priority);

    return healthyRegions[0] || null;
  }

  // Get region by latency
  getRegionByLatency(): RegionalConfig | null {
    const healthyRegions = Array.from(this.regionalConfigs.values())
      .filter(r => r.healthy)
      .sort((a, b) => a.latency - b.latency);

    return healthyRegions[0] || null;
  }

  // Update region health
  updateRegionHealth(region: string, healthy: boolean, latency: number): RegionalConfig | null {
    const config = this.regionalConfigs.get(region);
    if (!config) return null;

    config.healthy = healthy;
    config.latency = latency;
    return config;
  }

  // Add DDoS rule
  addDDoSRule(rule: Omit<DDoSRule, 'id'>): DDoSRule {
    const ddosRule: DDoSRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.ddosRules.set(ddosRule.id, ddosRule);
    return ddosRule;
  }

  // Get DDoS rule
  getDDoSRule(ruleId: string): DDoSRule | undefined {
    return this.ddosRules.get(ruleId);
  }

  // Get all DDoS rules
  getAllDDoSRules(): DDoSRule[] {
    return Array.from(this.ddosRules.values());
  }

  // Check DDoS
  checkDDoS(request: EdgeRequest): { allowed: boolean; reason?: string } {
    for (const rule of this.ddosRules.values()) {
      if (!rule.enabled) continue;

      switch (rule.type) {
        case 'ip_block':
          if (rule.config.blockedIPs?.includes(request.clientIP)) {
            return { allowed: false, reason: 'IP blocked' };
          }
          break;

        case 'geo_block':
          if (request.country && rule.config.blockedCountries?.includes(request.country)) {
            return { allowed: false, reason: 'Country blocked' };
          }
          break;

        case 'rate_limit':
          const recentRequests = this.requestLog.filter(
            r => r.clientIP === request.clientIP &&
                 Date.now() - r.timestamp.getTime() < (rule.config.window || 60) * 1000
          );
          if (recentRequests.length >= (rule.config.threshold || 100)) {
            return { allowed: false, reason: 'Rate limit exceeded' };
          }
          break;

        case 'signature_match':
          const bodyStr = JSON.stringify(request.body || {});
          for (const pattern of rule.config.patterns || []) {
            if (bodyStr.includes(pattern) || request.path.includes(pattern)) {
              return { allowed: false, reason: 'Signature match' };
            }
          }
          break;
      }
    }

    return { allowed: true };
  }

  // Get cache
  getCache(key: string): EdgeCacheEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.createdAt.getTime() > entry.ttl * 1000) {
      this.cache.delete(key);
      return undefined;
    }

    entry.hits++;
    return entry;
  }

  // Set cache
  setCache(key: string, value: unknown, ttl: number): EdgeCacheEntry {
    const entry: EdgeCacheEntry = {
      key,
      value,
      ttl,
      createdAt: new Date(),
      hits: 0,
    };

    this.cache.set(key, entry);
    return entry;
  }

  // Invalidate cache
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStatistics(): {
    totalEntries: number;
    totalHits: number;
    hitRate: number;
    size: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const totalMisses = this.requestLog.length - totalHits;

    return {
      totalEntries: this.cache.size,
      totalHits,
      hitRate: totalHits / (totalHits + totalMisses) || 0,
      size: JSON.stringify(entries).length,
    };
  }

  // Process request
  async processRequest(request: EdgeRequest): Promise<EdgeResponse> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const region = this.getBestRegion();

    // Log request
    this.requestLog.push({
      ...request,
      id: requestId,
      timestamp: new Date(),
      region: region?.region,
    });

    // Check DDoS
    const ddosCheck = this.checkDDoS(request);
    if (!ddosCheck.allowed) {
      return {
        requestId,
        statusCode: 429,
        headers: { 'X-DDoS-Reason': ddosCheck.reason || 'Unknown' },
        cached: false,
        duration: Date.now() - startTime,
        region: region?.region || 'unknown',
      };
    }

    // Get route
    const route = this.getRouteByPath(request.path, request.method);
    if (!route) {
      return {
        requestId,
        statusCode: 404,
        headers: {},
        cached: false,
        duration: Date.now() - startTime,
        region: region?.region || 'unknown',
      };
    }

    // Check cache
    const cacheKey = this.generateCacheKey(request, route);
    if (!route.bypassCache) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        return {
          requestId,
          statusCode: 200,
          headers: { 'X-Cache': 'HIT' },
          body: cached.value,
          cached: true,
          duration: Date.now() - startTime,
          region: region?.region || 'unknown',
        };
      }
    }

    // Forward to origin
    const response = await this.forwardToOrigin(request, route, region as any);

    // Cache response
    if (!route.bypassCache && route.cacheTTL && response.statusCode === 200) {
      this.setCache(cacheKey, response.body, route.cacheTTL);
    }

    // Log response
    this.responseLog.push({
      requestId,
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
      cached: false,
      duration: Date.now() - startTime,
      region: region?.region || 'unknown',
    });

    return {
      ...response,
      requestId,
      cached: false,
      duration: Date.now() - startTime,
      region: region?.region || 'unknown',
    };
  }

  // Forward to origin
  private async forwardToOrigin(request: EdgeRequest, route: EdgeRoute, region?: RegionalConfig): Promise<{ statusCode: number; headers: Record<string, string>; body?: unknown }> {
    // Simulate origin request
    const endpoint = region?.endpoint || route.origin;
    const url = `${endpoint}${request.path}`;

    // In production, use fetch to forward to origin
    // const response = await fetch(url, {
    //   method: request.method,
    //   headers: request.headers,
    //   body: request.body ? JSON.stringify(request.body) : undefined,
    // });

    // Simulated response
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { message: 'Success', endpoint: url },
    };
  }

  // Generate cache key
  private generateCacheKey(request: EdgeRequest, route: EdgeRoute): string {
    const parts = [request.method, request.path];

    if (route.cacheKey) {
      for (const key of route.cacheKey) {
        parts.push(request.headers[key] || '');
      }
    }

    return parts.join(':');
  }

  // Get request log
  getRequestLog(limit = 100): EdgeRequest[] {
    return this.requestLog.slice(-limit);
  }

  // Get response log
  getResponseLog(limit = 100): EdgeResponse[] {
    return this.responseLog.slice(-limit);
  }

  // Get statistics
  getStatistics(): {
    totalRoutes: number;
    totalRegions: number;
    totalDDoSRules: number;
    totalRequests: number;
    totalResponses: number;
    avgResponseTime: number;
    cacheHitRate: number;
  } {
    const avgResponseTime = this.responseLog.length > 0
      ? this.responseLog.reduce((sum, r) => sum + r.duration, 0) / this.responseLog.length
      : 0;

    const cacheStats = this.getCacheStatistics();

    return {
      totalRoutes: this.routes.size,
      totalRegions: this.regionalConfigs.size,
      totalDDoSRules: this.ddosRules.size,
      totalRequests: this.requestLog.length,
      totalResponses: this.responseLog.length,
      avgResponseTime,
      cacheHitRate: cacheStats.hitRate,
    };
  }

  // Initialize default configuration
  initializeDefaultConfiguration(): void {
    // Add default routes
    this.addEdgeRoute({
      path: '/api/v1/devices',
      methods: ['GET'],
      origin: process.env.EDGE_API_ORIGIN || 'https://api.simtrace.com',
      cacheTTL: 300,
      cacheKey: ['authorization'],
      enabled: true,
    });

    this.addEdgeRoute({
      path: '/api/v1/devices/*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      origin: process.env.EDGE_API_ORIGIN || 'https://api.simtrace.com',
      bypassCache: true,
      enabled: true,
    });

    // Add regional configs
    this.addRegionalConfig({
      region: 'us-east',
      endpoint: process.env.EDGE_API_US_ENDPOINT || 'https://api-us.simtrace.com',
      priority: 1,
      healthCheck: { path: '/health', interval: 30, timeout: 5 },
    });

    this.addRegionalConfig({
      region: 'eu-west',
      endpoint: process.env.EDGE_API_EU_ENDPOINT || 'https://api-eu.simtrace.com',
      priority: 2,
      healthCheck: { path: '/health', interval: 30, timeout: 5 },
    });

    this.addRegionalConfig({
      region: 'africa',
      endpoint: process.env.EDGE_API_AF_ENDPOINT || 'https://api-af.simtrace.com',
      priority: 3,
      healthCheck: { path: '/health', interval: 30, timeout: 5 },
    });

    // Add DDoS rules
    this.addDDoSRule({
      name: 'Rate Limit',
      type: 'rate_limit',
      config: { threshold: 100, window: 60 },
      enabled: true,
    });

    this.addDDoSRule({
      name: 'IP Block',
      type: 'ip_block',
      config: { blockedIPs: ['192.168.1.100', '10.0.0.50'] },
      enabled: true,
    });
  }
}

// Singleton instance
export const edgeAPI = new EdgeAPI();

// Initialize default configuration
edgeAPI.initializeDefaultConfiguration();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addEdgeRoute(route: Omit<EdgeRoute, 'id'>): EdgeRoute {
  return edgeAPI.addEdgeRoute(route);
}

export function addRegionalConfig(config: Omit<RegionalConfig, 'healthy' | 'latency'>): RegionalConfig {
  return edgeAPI.addRegionalConfig(config);
}

export function getBestRegion(): RegionalConfig | null {
  return edgeAPI.getBestRegion();
}

export function addDDoSRule(rule: Omit<DDoSRule, 'id'>): DDoSRule {
  return edgeAPI.addDDoSRule(rule);
}

export async function processEdgeRequest(request: EdgeRequest): Promise<EdgeResponse> {
  return edgeAPI.processRequest(request);
}

export function getEdgeCacheStatistics() {
  return edgeAPI.getCacheStatistics();
}

export function getEdgeStatistics() {
  return edgeAPI.getStatistics();
}
