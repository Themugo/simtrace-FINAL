// ── Intelligence Cache Service ─────────────────────────────────────────────────────
// Caching layer for intelligence broker responses to improve performance

import pino, { Logger } from "pino";

const log: Logger = pino({ level: "info" }).child({ service: "intelligence_cache" });

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
}

class IntelligenceCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 300000; // 5 minutes default TTL

  // Generate cache key from request parameters
  private generateKey(type: string, imei: string, params: Record<string, any> = {}): string {
    const paramsStr = JSON.stringify(params);
    return `${type}:${imei}:${paramsStr}`;
  }

  // Get cached value
  get<T>(type: string, imei: string, params: Record<string, any> = {}): T | null {
    const key = this.generateKey(type, imei, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    log.debug({ type, imei, key }, "Cache hit");
    return entry.data as T;
  }

  // Set cached value
  set<T>(type: string, imei: string, data: T, params: Record<string, any> = {}, ttl?: number): void {
    const key = this.generateKey(type, imei, params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
    log.debug({ type, imei, key, ttl: entry.ttl }, "Cache set");
  }

  // Invalidate cache for specific device
  invalidateDevice(imei: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(`:${imei}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    log.info({ imei, count: keysToDelete.length }, "Cache invalidated for device");
  }

  // Invalidate cache for specific type
  invalidateType(type: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    log.info({ type, count: keysToDelete.length }, "Cache invalidated for type");
  }

  // Clear all cache
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    log.info({ size }, "Cache cleared");
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      log.debug({ count: keysToDelete.length }, "Cache cleanup completed");
    }
  }
}

// Singleton instance
export const intelligenceCache = new IntelligenceCache();

// Periodic cleanup every 5 minutes
setInterval(() => {
  intelligenceCache.cleanup();
}, 5 * 60 * 1000);
