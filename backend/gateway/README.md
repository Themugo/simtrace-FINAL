# Advanced API Gateway

Advanced API gateway with routing, authentication, rate limiting, quotas, logging, transformations, and analytics.

## Features

- **Route Management**: Define and manage API routes with method matching
- **Authentication**: Configure auth requirements per route
- **Rate Limiting**: Per-identifier rate limiting with sliding windows
- **Quotas**: User and organization quotas with hourly/daily/monthly periods
- **Transformations**: Request/response transformations (headers, paths, field masking)
- **Logging**: Comprehensive request logging with filters
- **Analytics**: Real-time analytics by path, method, status code
- **Path Matching**: Support for wildcard path patterns

## Usage

### Add Route

```typescript
import { addGatewayRoute } from './gateway/index.js';

const route = addGatewayRoute({
  path: '/api/v1/devices',
  methods: ['GET', 'POST'],
  service: 'device-service',
  authRequired: true,
  rateLimit: 100,
  quotaLimit: 1000,
  transformations: [
    {
      type: 'request',
      operation: 'add_header',
      config: { header: 'X-Request-ID', value: 'generated-id' },
    },
  ],
  enabled: true,
});
```

### Get Route

```typescript
import { getGatewayRoute, getGatewayRouteByPath } from './gateway/index.js';

const route = getGatewayRoute('route_id');
const route = getGatewayRouteByPath('/api/v1/devices', 'GET');
```

### Check Rate Limit

```typescript
import { checkGatewayRateLimit } from './gateway/index.js';

const result = checkGatewayRateLimit('user123', 100, 60); // 100 requests per 60 seconds

if (!result.allowed) {
  console.log('Rate limited. Reset at:', result.resetAt);
}
```

### Check Quota

```typescript
import { checkGatewayQuota } from './gateway/index.js';

const result = checkGatewayQuota('user123', 1000, 'daily'); // 1000 requests per day

if (!result.allowed) {
  console.log('Quota exceeded. Reset at:', result.resetAt);
}
```

### Set User Quota

```typescript
import { setUserQuota } from './gateway/index.js';

const quota = setUserQuota('user123', 10000, 'monthly');
```

### Set Organization Quota

```typescript
import { setOrganizationQuota } from './gateway/index.js';

const quota = setOrganizationQuota('org456', 100000, 'monthly');
```

### Apply Transformations

```typescript
import { applyGatewayTransformations } from './gateway/index.js';

const transformations = [
  {
    type: 'request',
    operation: 'add_header',
    config: { header: 'X-Custom-Header', value: 'custom-value' },
  },
  {
    type: 'response',
    operation: 'mask_field',
    config: { field: 'ssn' },
  },
];

const transformed = applyGatewayTransformations(data, transformations, 'request');
```

### Log Request

```typescript
import { logGatewayRequest } from './gateway/index.js';

logGatewayRequest({
  method: 'GET',
  path: '/api/v1/devices',
  statusCode: 200,
  duration: 125,
  userId: 'user123',
  organizationId: 'org456',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  authType: 'jwt',
  rateLimited: false,
  quotaExceeded: false,
});
```

### Get Analytics

```typescript
import { getGatewayAnalytics } from './gateway/index.js';

const analytics = getGatewayAnalytics();
console.log('Total requests:', analytics.totalRequests);
console.log('Average duration:', analytics.avgDuration);
console.log('By path:', analytics.byPath);
console.log('By method:', analytics.byMethod);
console.log('By status:', analytics.byStatus);
console.log('Rate limited:', analytics.rateLimitedRequests);
console.log('Quota exceeded:', analytics.quotaExceededRequests);
```

### Get Logs

```typescript
import { getGatewayLogs } from './gateway/index.js';

// Get all logs
const logs = getGatewayLogs();

// Filter by path
const logs = getGatewayLogs({ path: '/api/v1/devices' });

// Filter by user
const logs = getGatewayLogs({ userId: 'user123', limit: 50 });
```

## Data Structures

### GatewayRoute

```typescript
interface GatewayRoute {
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
```

### Transformation

```typescript
interface Transformation {
  type: 'request' | 'response';
  operation: 'add_header' | 'remove_header' | 'rewrite_path' | 'mask_field';
  config: Record<string, any>;
}
```

### RateLimitRule

```typescript
interface RateLimitRule {
  id: string;
  identifier: string;
  limit: number;
  window: number;
  current: number;
  resetAt: Date;
}
```

### QuotaRule

```typescript
interface QuotaRule {
  id: string;
  userId?: string;
  organizationId?: string;
  apikey?: string;
  limit: number;
  period: 'hourly' | 'daily' | 'monthly';
  current: number;
  resetAt: Date;
}
```

### GatewayLog

```typescript
interface GatewayLog {
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
```

### GatewayAnalytics

```typescript
interface GatewayAnalytics {
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
```

## Transformation Types

### Add Header

```typescript
{
  type: 'request' | 'response',
  operation: 'add_header',
  config: { header: 'X-Custom-Header', value: 'custom-value' }
}
```

### Remove Header

```typescript
{
  type: 'request' | 'response',
  operation: 'remove_header',
  config: { header: 'X-Internal-Header' }
}
```

### Rewrite Path

```typescript
{
  type: 'request',
  operation: 'rewrite_path',
  config: { newPath: '/api/v2/endpoint' }
}
```

### Mask Field

```typescript
{
  type: 'response',
  operation: 'mask_field',
  config: { field: 'ssn' } // Masks to: '12****34'
}
```

## Production Integration

### Kong Integration

```yaml
# Kong configuration
services:
  - name: simtrace-api
    url: http://api-service:3000

routes:
  - name: api-v1
    service: simtrace-api
    paths:
      - /api/v1
    methods:
      - GET
      - POST
      - PUT
      - DELETE

plugins:
  - name: rate-limiting
    config:
      minute: 100
      hour: 1000

  - name: jwt
    config:
      uri_claims:
        - userId
```

### Traefik Integration

```yaml
# Traefik configuration
http:
  routers:
    api-v1:
      rule: PathPrefix(`/api/v1`)
      service: api-service
      middlewares:
        - auth
        - ratelimit

  middlewares:
    auth:
      plugin:
        jwt:
          issuer: simtrace

    ratelimit:
      plugin:
        rateLimit:
          average: 100
          burst: 200
```

### Express Middleware

```typescript
import express from 'express';

function gatewayMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const route = getGatewayRouteByPath(req.path, req.method);

  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }

  if (route.authRequired && !req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check rate limit
  const rateLimitResult = checkGatewayRateLimit(req.ip, route.rateLimit || 100, 60);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({ error: 'Rate limited' });
  }

  // Check quota
  if (req.user) {
    const quotaResult = checkGatewayQuota(req.user.id, route.quotaLimit || 1000, 'daily');
    if (!quotaResult.allowed) {
      return res.status(429).json({ error: 'Quota exceeded' });
    }
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logGatewayRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      authType: req.authType,
      rateLimited: false,
      quotaExceeded: false,
    });
  });

  next();
}
```

## Best Practices

1. **Route Organization**: Organize routes by service and version
2. **Rate Limits**: Set appropriate rate limits per endpoint
3. **Quotas**: Use quotas for fair usage across organizations
4. **Transformations**: Use transformations for security and privacy
5. **Logging**: Log all requests for debugging and analytics
6. **Monitoring**: Monitor analytics for performance issues
7. **Security**: Always require auth for sensitive endpoints

## Performance Considerations

1. **In-Memory Storage**: Current implementation is in-memory
2. **Caching**: Cache route lookups for performance
3. **Async**: Use async operations for logging
4. **Sampling**: Sample logs for high-volume endpoints
5. **Database**: Use database for production persistence

## Future Enhancements

- Add database persistence for routes and quotas
- Implement distributed rate limiting with Redis
- Add API key authentication
- Implement circuit breakers
- Add request/response validation
- Implement webhook notifications
- Add real-time monitoring dashboard
