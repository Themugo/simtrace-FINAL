# Advanced Caching Layer

Multi-level caching system with memory and Redis layers for improved performance.

## Features

- **Multi-level cache**: Memory cache (fast) + Redis cache (distributed)
- **TTL support**: Configurable time-to-live for cached values
- **Namespaces**: Organize cache keys by namespace
- **Tags**: Tag-based cache invalidation
- **Statistics**: Track cache hits, misses, sets, and deletes
- **Automatic cleanup**: Periodic cleanup of expired memory cache entries

## Usage

### Basic Usage

```typescript
import { cache } from './cache/index.js';

// Set value in cache
await cache.set('user:123', { name: 'John', email: 'john@example.com' }, { ttl: 300 });

// Get value from cache
const user = await cache.get('user:123');

// Delete value from cache
await cache.delete('user:123');
```

### With Namespace

```typescript
// Set with namespace
await cache.set('123', userData, { namespace: 'user', ttl: 600 });

// Get with namespace
const user = await cache.get('123', { namespace: 'user' });
```

### With Tags for Invalidation

```typescript
// Set with tags
await cache.set('device:123', deviceData, { 
  namespace: 'device', 
  ttl: 300,
  tags: ['device', 'imei:123456789012345']
});

// Invalidate by tag
await cache.invalidateByTag('imei:123456789012345');
```

### Specialized Helpers

```typescript
import { 
  cacheImeiLookup, 
  getCachedImeiLookup,
  cacheDeviceRisk,
  getCachedDeviceRisk,
  cacheAnalytics,
  getCachedAnalytics,
  cacheDashboard,
  getCachedDashboard,
  cacheMapData,
  getCachedMapData,
  cacheAISummary,
  getCachedAISummary
} from './cache/index.js';

// Cache IMEI lookup
await cacheImeiLookup('123456789012345', imeiData, 3600);
const imei = await getCachedImeiLookup('123456789012345');

// Cache device risk
await cacheDeviceRisk('123456789012345', riskData, 600);
const risk = await getCachedDeviceRisk('123456789012345');

// Cache analytics
await cacheAnalytics('daily:2024-01-01', analyticsData, 300);
const analytics = await getCachedAnalytics('daily:2024-01-01');

// Cache dashboard
await cacheDashboard('user123', dashboardData, 180);
const dashboard = await getCachedDashboard('user123');

// Cache map data
await cacheMapData('heatmap:kenya', mapData, 600);
const map = await getCachedMapData('heatmap:kenya');

// Cache AI summary
await cacheAISummary('case:123', summary, 3600);
const summary = await getCachedAISummary('case:123');
```

### Cache Statistics

```typescript
// Get cache statistics
const stats = cache.getStats();
console.log('Cache stats:', stats);
// { hits: 1000, misses: 50, sets: 200, deletes: 10 }

// Reset statistics
cache.resetStats();
```

### Cache Invalidation

```typescript
// Invalidate by tag
await cache.invalidateByTag('imei:123456789012345');

// Invalidate by namespace
await cache.invalidateByNamespace('user');

// Clear all cache
await cache.clear();
```

## Cache Strategy

### IMEI Lookups
- **TTL**: 1 hour (3600 seconds)
- **Namespace**: `imei`
- **Tags**: `imei`

### Device Risk
- **TTL**: 10 minutes (600 seconds)
- **Namespace**: `risk`
- **Tags**: `risk`, `device:{imei}`

### Analytics
- **TTL**: 5 minutes (300 seconds)
- **Namespace**: `analytics`
- **Tags**: `analytics`

### Dashboard
- **TTL**: 3 minutes (180 seconds)
- **Namespace**: `dashboard`
- **Tags**: `dashboard`, `user:{userId}`

### Map Data
- **TTL**: 10 minutes (600 seconds)
- **Namespace**: `map`
- **Tags**: `map`

### AI Summaries
- **TTL**: 1 hour (3600 seconds)
- **Namespace**: `ai`
- **Tags**: `ai`
