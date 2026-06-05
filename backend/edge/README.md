# Edge API & Global Distribution

Edge API and global distribution using Cloudflare Workers for lower latency, regional routing, and DDoS protection.

## Features

- **Edge Routes**: Define routes with caching and rate limiting
- **Regional Configuration**: Configure multiple regional endpoints with health checks
- **DDoS Protection**: Rate limiting, IP blocking, geo blocking, signature matching
- **Edge Caching**: Cache responses at the edge with configurable TTL
- **Request Processing**: Process requests with automatic routing and caching
- **Health Checks**: Monitor regional endpoint health
- **Latency-based Routing**: Route requests to lowest-latency region
- **Request Logging**: Log all requests and responses for analysis

## Usage

### Add Edge Route

```typescript
import { addEdgeRoute } from './edge/index.js';

const route = addEdgeRoute({
  path: '/api/v1/devices',
  methods: ['GET'],
  origin: 'https://api.simtrace.com',
  cacheTTL: 300, // 5 minutes
  cacheKey: ['authorization'],
  bypassCache: false,
  rateLimit: 100,
  enabled: true,
});
```

### Add Regional Configuration

```typescript
import { addRegionalConfig } from './edge/index.js';

const config = addRegionalConfig({
  region: 'us-east',
  endpoint: 'https://api-us.simtrace.com',
  priority: 1,
  healthCheck: {
    path: '/health',
    interval: 30, // seconds
    timeout: 5, // seconds
  },
});
```

### Add DDoS Rule

```typescript
import { addDDoSRule } from './edge/index.js';

// Rate limit rule
const rule = addDDoSRule({
  name: 'Rate Limit',
  type: 'rate_limit',
  config: {
    threshold: 100,
    window: 60, // seconds
  },
  enabled: true,
});

// IP block rule
const rule = addDDoSRule({
  name: 'IP Block',
  type: 'ip_block',
  config: {
    blockedIPs: ['192.168.1.100', '10.0.0.50'],
  },
  enabled: true,
});

// Geo block rule
const rule = addDDoSRule({
  name: 'Geo Block',
  type: 'geo_block',
  config: {
    blockedCountries: ['CN', 'RU'],
  },
  enabled: true,
});

// Signature match rule
const rule = addDDoSRule({
  name: 'Signature Match',
  type: 'signature_match',
  config: {
    patterns: ['<script>', 'eval(', 'document.cookie'],
  },
  enabled: true,
});
```

### Process Edge Request

```typescript
import { processEdgeRequest } from './edge/index.js';

const response = await processEdgeRequest({
  id: 'req_123',
  method: 'GET',
  path: '/api/v1/devices',
  headers: {
    'authorization': 'Bearer token',
    'content-type': 'application/json',
  },
  clientIP: '192.168.1.100',
  country: 'KE',
  timestamp: new Date(),
});

console.log('Status:', response.statusCode);
console.log('Cached:', response.cached);
console.log('Duration:', response.duration);
console.log('Region:', response.region);
```

### Get Best Region

```typescript
import { getBestRegion } from './edge/index.js';

const region = getBestRegion();
console.log('Best region:', region?.region);
console.log('Endpoint:', region?.endpoint);
```

### Get Cache Statistics

```typescript
import { getEdgeCacheStatistics } from './edge/index.js';

const stats = getEdgeCacheStatistics();
console.log('Total entries:', stats.totalEntries);
console.log('Total hits:', stats.totalHits);
console.log('Hit rate:', stats.hitRate);
console.log('Cache size:', stats.size);
```

### Get Edge Statistics

```typescript
import { getEdgeStatistics } from './edge/index.js';

const stats = getEdgeStatistics();
console.log('Total routes:', stats.totalRoutes);
console.log('Total regions:', stats.totalRegions);
console.log('Total DDoS rules:', stats.totalDDoSRules);
console.log('Total requests:', stats.totalRequests);
console.log('Average response time:', stats.avgResponseTime);
console.log('Cache hit rate:', stats.cacheHitRate);
```

## Data Structures

### EdgeRoute

```typescript
interface EdgeRoute {
  id: string;
  path: string;
  methods: string[];
  origin: string;
  cacheTTL?: number;
  cacheKey?: string[];
  bypassCache?: boolean;
  rateLimit?: number;
  enabled: boolean;
}
```

### RegionalConfig

```typescript
interface RegionalConfig {
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
```

### DDoSRule

```typescript
interface DDoSRule {
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
```

### EdgeRequest

```typescript
interface EdgeRequest {
  id: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  clientIP: string;
  country?: string;
  timestamp: Date;
  region?: string;
}
```

### EdgeResponse

```typescript
interface EdgeResponse {
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  cached: boolean;
  duration: number;
  region: string;
}
```

## DDoS Protection Types

### Rate Limit
- Limits requests per IP within a time window
- Configurable threshold and window duration

### IP Block
- Blocks specific IP addresses
- Useful for known malicious IPs

### Geo Block
- Blocks requests from specific countries
- Useful for compliance or security

### Signature Match
- Blocks requests matching specific patterns
- Useful for SQL injection, XSS prevention

## Regional Routing

### Priority-based Routing
Routes to highest priority healthy region.

### Latency-based Routing
Routes to lowest-latency healthy region.

### Health Checks
- Periodic health checks on regional endpoints
- Automatic failover to healthy regions
- Configurable interval and timeout

## Production Integration

### Cloudflare Workers

```typescript
// worker.js
import { processEdgeRequest } from './edge/index.js';

export default {
  async fetch(request, env, ctx) {
    const edgeRequest = {
      method: request.method,
      path: new URL(request.url).pathname,
      headers: Object.fromEntries(request.headers),
      clientIP: request.headers.get('CF-Connecting-IP') || 'unknown',
      country: request.headers.get('CF-IPCountry') || undefined,
      timestamp: new Date(),
    };

    const response = await processEdgeRequest(edgeRequest);

    return new Response(JSON.stringify(response.body), {
      status: response.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': response.cached ? 'HIT' : 'MISS',
        'X-Region': response.region,
      },
    });
  },
};
```

### Regional Endpoints

```yaml
# wrangler.toml
[env.production]
vars = {
  API_ORIGIN = "https://api.simtrace.com"
}

[env.us-east]
vars = {
  API_ORIGIN = "https://api-us.simtrace.com"
}

[env.eu-west]
vars = {
  API_ORIGIN = "https://api-eu.simtrace.com"
}

[env.africa]
vars = {
  API_ORIGIN = "https://api-af.simtrace.com"
}
```

### DDoS Integration

```typescript
// Cloudflare WAF integration
const wafRules = [
  {
    id: 'rate_limit',
    expression: 'http.request.headers["CF-Connecting-IP"] in rate_limit_map',
    action: 'block',
  },
  {
    id: 'geo_block',
    expression: 'ip.geoip.country in ["CN", "RU"]',
    action: 'block',
  },
];
```

## Best Practices

1. **Cache Strategy**: Cache GET requests with appropriate TTL
2. **Cache Keys**: Include relevant headers in cache key
3. **Regional Priority**: Set appropriate priorities for regions
4. **Health Checks**: Configure appropriate health check intervals
5. **DDoS Rules**: Use multiple DDoS rules for layered protection
6. **Rate Limits**: Set reasonable rate limits per endpoint
7. **Monitoring**: Monitor cache hit rates and response times

## Performance Considerations

1. **Cache TTL**: Balance freshness with performance
2. **Cache Size**: Monitor cache size and memory usage
3. **Regional Latency**: Use latency-based routing for best performance
4. **Health Check Frequency**: Balance accuracy with overhead
5. **DDoS Overhead**: Minimize DDoS check overhead

## Future Enhancements

- Add database persistence for configuration
- Implement cache warming
- Add support for cache invalidation webhooks
- Implement advanced DDoS detection with ML
- Add support for custom routing logic
- Implement real-time analytics dashboard
