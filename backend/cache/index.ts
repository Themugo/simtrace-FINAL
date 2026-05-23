import { getRedisClient } from '../services/redis.js';

// ── Cache Configuration ─────────────────────────────────────────────────────────
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Cache namespace for key prefixing
  tags?: string[]; // Tags for cache invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

// ── Multi-Level Cache ───────────────────────────────────────────────────────────
class CacheManager {
  private memoryCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  private defaultTTL = 300; // 5 minutes

  // Generate cache key with namespace
  private generateKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  // Get value from cache (memory first, then Redis)
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const cacheKey = this.generateKey(key, options?.namespace);

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      this.stats.hits++;
      return memoryEntry.value as T;
    }

    // Check Redis cache
    try {
      const redis = getRedisClient();
      const value = await redis.get(cacheKey);
      
      if (value) {
        this.stats.hits++;
        const parsed = JSON.parse(value);
        
        // Store in memory cache for faster access
        this.memoryCache.set(cacheKey, {
          value: parsed,
          expiresAt: Date.now() + (options?.ttl || this.defaultTTL) * 1000,
        });
        
        return parsed as T;
      }
    } catch (error) {
      console.error('[Cache] Redis get error:', error);
    }

    this.stats.misses++;
    return null;
  }

  // Set value in cache (both memory and Redis)
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateKey(key, options?.namespace);
    const ttl = options?.ttl || this.defaultTTL;

    // Store in memory cache
    this.memoryCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });

    // Store in Redis cache
    try {
      const redis = getRedisClient();
      await redis.set(cacheKey, JSON.stringify(value), { EX: ttl });
      
      // Add to tag sets for invalidation
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await redis.sadd(`cache:tag:${tag}`, cacheKey);
        }
      }
      
      this.stats.sets++;
    } catch (error) {
      console.error('[Cache] Redis set error:', error);
    }
  }

  // Delete value from cache (both memory and Redis)
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const cacheKey = this.generateKey(key, options?.namespace);

    // Delete from memory cache
    this.memoryCache.delete(cacheKey);

    // Delete from Redis cache
    try {
      const redis = getRedisClient();
      await redis.del(cacheKey);
      this.stats.deletes++;
    } catch (error) {
      console.error('[Cache] Redis delete error:', error);
    }
  }

  // Invalidate cache by tag
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const keys = await redis.smembers(`cache:tag:${tag}`);
      
      if (keys.length > 0) {
        // Delete from memory cache
        for (const key of keys) {
          this.memoryCache.delete(key);
        }
        
        // Delete from Redis
        await redis.del(...keys);
        await redis.del(`cache:tag:${tag}`);
      }
    } catch (error) {
      console.error('[Cache] Tag invalidation error:', error);
    }
  }

  // Invalidate cache by namespace
  async invalidateByNamespace(namespace: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const pattern = `${namespace}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        // Delete from memory cache
        for (const key of keys) {
          this.memoryCache.delete(key);
        }
        
        // Delete from Redis
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('[Cache] Namespace invalidation error:', error);
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      const redis = getRedisClient();
      const keys = await redis.keys('cache:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('[Cache] Clear error:', error);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  // Clean up expired memory cache entries
  cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt < now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new CacheManager();

// Clean up memory cache periodically (every 5 minutes)
setInterval(() => {
  cache.cleanupMemoryCache();
}, 5 * 60 * 1000);

// ── Specialized Cache Helpers ─────────────────────────────────────────────────

// IMEI lookup cache
export async function cacheImeiLookup(imei: string, data: any, ttl = 3600): Promise<void> {
  await cache.set(`imei:${imei}`, data, { ttl, namespace: 'imei', tags: ['imei'] });
}

export async function getCachedImeiLookup(imei: string): Promise<any | null> {
  return cache.get(`imei:${imei}`, { namespace: 'imei' });
}

// Device risk cache
export async function cacheDeviceRisk(imei: string, riskData: any, ttl = 600): Promise<void> {
  await cache.set(`risk:${imei}`, riskData, { ttl, namespace: 'risk', tags: ['risk', `device:${imei}`] });
}

export async function getCachedDeviceRisk(imei: string): Promise<any | null> {
  return cache.get(`risk:${imei}`, { namespace: 'risk' });
}

// Analytics cache
export async function cacheAnalytics(key: string, data: any, ttl = 300): Promise<void> {
  await cache.set(key, data, { ttl, namespace: 'analytics', tags: ['analytics'] });
}

export async function getCachedAnalytics(key: string): Promise<any | null> {
  return cache.get(key, { namespace: 'analytics' });
}

// Dashboard cache
export async function cacheDashboard(userId: string, dashboardData: any, ttl = 180): Promise<void> {
  await cache.set(`user:${userId}`, dashboardData, { ttl, namespace: 'dashboard', tags: ['dashboard', `user:${userId}`] });
}

export async function getCachedDashboard(userId: string): Promise<any | null> {
  return cache.get(`user:${userId}`, { namespace: 'dashboard' });
}

// Map data cache
export async function cacheMapData(key: string, mapData: any, ttl = 600): Promise<void> {
  await cache.set(key, mapData, { ttl, namespace: 'map', tags: ['map'] });
}

export async function getCachedMapData(key: string): Promise<any | null> {
  return cache.get(key, { namespace: 'map' });
}

// AI summary cache
export async function cacheAISummary(key: string, summary: any, ttl = 3600): Promise<void> {
  await cache.set(key, summary, { ttl, namespace: 'ai', tags: ['ai'] });
}

export async function getCachedAISummary(key: string): Promise<any | null> {
  return cache.get(key, { namespace: 'ai' });
}
