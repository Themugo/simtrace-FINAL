// services/offline/offlineStorage.ts - Offline storage for mobile devices
import crypto from 'crypto';

export interface OfflineData {
  dataId: string;
  deviceId: string;
  userId: string;
  entityType: 'device' | 'location' | 'alert' | 'user' | 'settings';
  data: any;
  timestamp: number;
  expiresAt?: number;
  version: number;
}

export interface OfflineCache {
  cacheId: string;
  key: string;
  data: any;
  timestamp: number;
  hits: number;
  size: number;
  expiresAt?: number;
}

export class OfflineStorageService {
  private storage: Map<string, OfflineData> = new Map();
  private cache: Map<string, OfflineCache> = new Map();
  private maxSize: number = 50 * 1024 * 1024; // 50MB
  private currentSize: number = 0;

  /**
   * Store data offline
   */
  store(
    deviceId: string,
    userId: string,
    entityType: 'device' | 'location' | 'alert' | 'user' | 'settings',
    data: any,
    ttl?: number
  ): OfflineData {
    const dataId = crypto.randomBytes(16).toString('hex');
    const dataSize = JSON.stringify(data).length;

    // Check if we have space
    if (this.currentSize + dataSize > this.maxSize) {
      this.evictOldData();
    }

    const offlineData: OfflineData = {
      dataId,
      deviceId,
      userId,
      entityType,
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
      version: 1
    };

    this.storage.set(dataId, offlineData);
    this.currentSize += dataSize;

    return offlineData;
  }

  /**
   * Retrieve offline data
   */
  retrieve(dataId: string): OfflineData | null {
    const data = this.storage.get(dataId);
    
    if (!data) {
      return null;
    }

    // Check if expired
    if (data.expiresAt && Date.now() > data.expiresAt) {
      this.storage.delete(dataId);
      return null;
    }

    return data;
  }

  /**
   * Retrieve by entity type
   */
  retrieveByEntity(
    userId: string,
    entityType: 'device' | 'location' | 'alert' | 'user' | 'settings'
  ): OfflineData[] {
    return Array.from(this.storage.values())
      .filter(data => 
        data.userId === userId && 
        data.entityType === entityType &&
        (!data.expiresAt || Date.now() <= data.expiresAt)
      );
  }

  /**
   * Update offline data
   */
  update(dataId: string, newData: any): OfflineData | null {
    const existingData = this.storage.get(dataId);
    
    if (!existingData) {
      return null;
    }

    const oldSize = JSON.stringify(existingData.data).length;
    const newSize = JSON.stringify(newData).length;
    const sizeDiff = newSize - oldSize;

    // Check if we have space
    if (this.currentSize + sizeDiff > this.maxSize) {
      this.evictOldData();
    }

    const updatedData: OfflineData = {
      ...existingData,
      data: newData,
      timestamp: Date.now(),
      version: existingData.version + 1
    };

    this.storage.set(dataId, updatedData);
    this.currentSize += sizeDiff;

    return updatedData;
  }

  /**
   * Delete offline data
   */
  delete(dataId: string): boolean {
    const data = this.storage.get(dataId);
    
    if (!data) {
      return false;
    }

    const size = JSON.stringify(data.data).length;
    this.storage.delete(dataId);
    this.currentSize -= size;

    return true;
  }

  /**
   * Cache data for quick access
   */
  cache(key: string, data: any, ttl?: number): OfflineCache {
    const cacheId = crypto.randomBytes(16).toString('hex');
    const dataSize = JSON.stringify(data).length;

    // Check if we have space
    if (this.currentSize + dataSize > this.maxSize) {
      this.evictOldCache();
    }

    const offlineCache: OfflineCache = {
      cacheId,
      key,
      data,
      timestamp: Date.now(),
      hits: 0,
      size: dataSize,
      expiresAt: ttl ? Date.now() + ttl : undefined
    };

    this.cache.set(cacheId, offlineCache);
    this.currentSize += dataSize;

    return offlineCache;
  }

  /**
   * Get cached data
   */
  getCached(key: string): any | null {
    for (const [cacheId, cache] of this.cache.entries()) {
      if (cache.key === key) {
        // Check if expired
        if (cache.expiresAt && Date.now() > cache.expiresAt) {
          this.cache.delete(cacheId);
          this.currentSize -= cache.size;
          return null;
        }

        // Increment hit count
        cache.hits++;
        this.cache.set(cacheId, cache);

        return cache.data;
      }
    }

    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    for (const [cacheId, cache] of this.cache.entries()) {
      this.currentSize -= cache.size;
    }
    this.cache.clear();
  }

  /**
   * Evict old data based on LRU
   */
  private evictOldData(): void {
    const sortedData = Array.from(this.storage.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = sortedData.slice(0, Math.ceil(sortedData.length * 0.1));

    for (const [dataId, data] of toRemove) {
      const size = JSON.stringify(data.data).length;
      this.storage.delete(dataId);
      this.currentSize -= size;
    }
  }

  /**
   * Evict old cache based on LRU
   */
  private evictOldCache(): void {
    const sortedCache = Array.from(this.cache.entries())
      .sort((a, b) => a[1].hits - b[1].hits);

    const toRemove = sortedCache.slice(0, Math.ceil(sortedCache.length * 0.1));

    for (const [cacheId, cache] of toRemove) {
      this.cache.delete(cacheId);
      this.currentSize -= cache.size;
    }
  }

  /**
   * Clear expired data
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [dataId, data] of this.storage.entries()) {
      if (data.expiresAt && now > data.expiresAt) {
        const size = JSON.stringify(data.data).length;
        this.storage.delete(dataId);
        this.currentSize -= size;
        cleared++;
      }
    }

    for (const [cacheId, cache] of this.cache.entries()) {
      if (cache.expiresAt && now > cache.expiresAt) {
        this.cache.delete(cacheId);
        this.currentSize -= cache.size;
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get storage statistics
   */
  getStatistics(userId?: string): {
    totalData: number;
    totalCache: number;
    currentSize: number;
    maxSize: number;
    usagePercentage: number;
    byEntityType: { [key: string]: number };
  } {
    const data = userId 
      ? Array.from(this.storage.values()).filter(d => d.userId === userId)
      : Array.from(this.storage.values());

    const byEntityType: { [key: string]: number } = {};
    
    for (const item of data) {
      byEntityType[item.entityType] = (byEntityType[item.entityType] || 0) + 1;
    }

    return {
      totalData: data.length,
      totalCache: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      usagePercentage: (this.currentSize / this.maxSize) * 100,
      byEntityType
    };
  }

  /**
   * Export storage
   */
  exportStorage(userId?: string): string {
    const data = userId 
      ? Array.from(this.storage.values()).filter(d => d.userId === userId)
      : Array.from(this.storage.values());
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import storage
   */
  importStorage(data: OfflineData[]): number {
    let imported = 0;

    for (const item of data) {
      if (!this.storage.has(item.dataId)) {
        const dataSize = JSON.stringify(item.data).length;
        
        if (this.currentSize + dataSize <= this.maxSize) {
          this.storage.set(item.dataId, item);
          this.currentSize += dataSize;
          imported++;
        }
      }
    }

    return imported;
  }

  /**
   * Clear all storage
   */
  clearAll(): void {
    this.storage.clear();
    this.cache.clear();
    this.currentSize = 0;
  }
}

export const offlineStorageService = new OfflineStorageService();
