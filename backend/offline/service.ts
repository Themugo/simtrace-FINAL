// ── Offline-First Mobile Experience ─────────────────────────────────────────────
// Service workers, cache dashboards/maps, sync queue for Africa market

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt?: Date;
  version: string;
  size: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'device_update' | 'location_update' | 'evidence_upload' | 'case_update' | 'user_action';
  data: Record<string, any>;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  lastAttempt?: Date;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface OfflineManifest {
  version: string;
  timestamp: Date;
  caches: {
    name: string;
    entries: string[];
  }[];
  syncQueue: {
    pending: number;
    completed: number;
    failed: number;
  };
}

export interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  localVersion: any;
  remoteVersion: any;
  conflictType: 'version_mismatch' | 'data_conflict' | 'delete_conflict';
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merge';
  createdAt: Date;
}

class OfflineService {
  private cache: Map<string, CacheEntry> = new Map();
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private currentVersion: string = '1.0.0';

  // Cache data
  cacheData(key: string, data: any, ttl?: number): CacheEntry {
    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      expiresAt: ttl ? new Date(Date.now() + ttl * 1000) : undefined,
      version: this.currentVersion,
      size: JSON.stringify(data).length,
    };

    this.cache.set(key, entry);
    return entry;
  }

  // Get cached data
  getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    // Check version
    if (entry.version !== this.currentVersion) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Invalidate cache
  invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  // Invalidate cache by pattern
  invalidateCachePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
  }

  // Add to sync queue
  addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount' | 'createdAt'>): SyncQueueItem {
    const syncItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
    };

    this.syncQueue.set(syncItem.id, syncItem);
    return syncItem;
  }

  // Get sync queue
  getSyncQueue(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values());
  }

  // Get pending sync items
  getPendingSyncItems(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values()).filter(i => i.status === 'pending');
  }

  // Process sync queue
  async processSyncQueue(): Promise<{ processed: number; failed: number }> {
    const pending = this.getPendingSyncItems();
    let processed = 0;
    let failed = 0;

    for (const item of pending) {
      item.status = 'syncing';
      item.lastAttempt = new Date();

      try {
        // In production, sync with server
        await this.syncItem(item);
        item.status = 'completed';
        item.completedAt = new Date();
        processed++;
      } catch (error) {
        item.status = 'failed';
        item.error = error instanceof Error ? error.message : 'Unknown error';
        item.retryCount++;

        // Retry up to 3 times
        if (item.retryCount < 3) {
          item.status = 'pending';
        }
        failed++;
      }
    }

    return { processed, failed };
  }

  // Sync individual item
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // In production, make API call to sync data
    console.log(`Syncing item ${item.id} of type ${item.type}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Retry failed items
  async retryFailedItems(): Promise<{ retried: number; failed: number }> {
    const failedItems = Array.from(this.syncQueue.values()).filter(i => i.status === 'failed' && i.retryCount < 3);
    let retried = 0;

    for (const item of failedItems) {
      item.status = 'pending';
      item.retryCount++;
      retried++;
    }

    const result = await this.processSyncQueue();
    return { retried, failed: result.failed };
  }

  // Clear completed items
  clearCompletedItems(): number {
    let count = 0;
    for (const [id, item] of this.syncQueue.entries()) {
      if (item.status === 'completed' && item.completedAt) {
        // Remove items completed more than 24 hours ago
        const hoursSinceCompletion = (Date.now() - item.completedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCompletion > 24) {
          this.syncQueue.delete(id);
          count++;
        }
      }
    }
    return count;
  }

  // Detect conflict
  detectConflict(resourceType: string, resourceId: string, localVersion: any, remoteVersion: any): SyncConflict {
    const conflict: SyncConflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resourceType,
      resourceId,
      localVersion,
      remoteVersion,
      conflictType: this.determineConflictType(localVersion, remoteVersion),
      resolved: false,
      createdAt: new Date(),
    };

    this.conflicts.set(conflict.id, conflict);
    return conflict;
  }

  // Determine conflict type
  private determineConflictType(local: any, remote: any): SyncConflict['conflictType'] {
    if (JSON.stringify(local) === JSON.stringify(remote)) {
      return 'version_mismatch';
    }
    if (local.deleted && !remote.deleted) {
      return 'delete_conflict';
    }
    return 'data_conflict';
  }

  // Resolve conflict
  resolveConflict(conflictId: string, resolution: SyncConflict['resolution']): SyncConflict | null {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return null;

    conflict.resolved = true;
    conflict.resolution = resolution;
    return conflict;
  }

  // Get conflicts
  getConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values());
  }

  // Get unresolved conflicts
  getUnresolvedConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values()).filter(c => !c.resolved);
  }

  // Get manifest
  getManifest(): OfflineManifest {
    const pending = this.getPendingSyncItems().length;
    const completed = Array.from(this.syncQueue.values()).filter(i => i.status === 'completed').length;
    const failed = Array.from(this.syncQueue.values()).filter(i => i.status === 'failed').length;

    return {
      version: this.currentVersion,
      timestamp: new Date(),
      caches: [
        {
          name: 'dashboards',
          entries: Array.from(this.cache.keys()).filter(k => k.startsWith('dashboard:')),
        },
        {
          name: 'maps',
          entries: Array.from(this.cache.keys()).filter(k => k.startsWith('map:')),
        },
        {
          name: 'devices',
          entries: Array.from(this.cache.keys()).filter(k => k.startsWith('device:')),
        },
      ],
      syncQueue: {
        pending,
        completed,
        failed,
      },
    };
  }

  // Update version
  updateVersion(version: string): void {
    this.currentVersion = version;
    // Clear cache on version update
    this.clearCache();
  }

  // Get statistics
  getStatistics(): {
    cacheSize: number;
    cacheEntries: number;
    syncQueueSize: number;
    pendingSync: number;
    completedSync: number;
    failedSync: number;
    conflicts: number;
    unresolvedConflicts: number;
  } {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    const pending = this.getPendingSyncItems().length;
    const completed = Array.from(this.syncQueue.values()).filter(i => i.status === 'completed').length;
    const failed = Array.from(this.syncQueue.values()).filter(i => i.status === 'failed').length;
    const unresolved = this.getUnresolvedConflicts().length;

    return {
      cacheSize: totalSize,
      cacheEntries: this.cache.size,
      syncQueueSize: this.syncQueue.size,
      pendingSync: pending,
      completedSync: completed,
      failedSync: failed,
      conflicts: this.conflicts.size,
      unresolvedConflicts: unresolved,
    };
  }

  // Initialize with sample data
  initializeSampleData(): void {
    // Cache dashboard data
    this.cacheData('dashboard:overview', {
      totalDevices: 100,
      activeDevices: 85,
      stolenDevices: 15,
      recoveredDevices: 12,
    }, 3600); // 1 hour TTL

    // Cache map data
    this.cacheData('map:devices:nairobi', {
      devices: [
        { id: 'device_1', lat: -1.2921, lng: 36.8219, status: 'active' },
        { id: 'device_2', lat: -1.2856, lng: 36.8319, status: 'stolen' },
      ],
    }, 1800); // 30 min TTL

    // Add sync queue items
    this.addToSyncQueue({
      type: 'device_update',
      data: { deviceId: 'device_1', status: 'stolen' },
    });

    this.addToSyncQueue({
      type: 'location_update',
      data: { deviceId: 'device_2', lat: -1.2856, lng: 36.8319 },
    });
  }
}

// Singleton instance
export const offlineService = new OfflineService();

// Initialize sample data
offlineService.initializeSampleData();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function cacheOfflineData(key: string, data: any, ttl?: number): CacheEntry {
  return offlineService.cacheData(key, data, ttl);
}

export function getCachedOfflineData(key: string): any | null {
  return offlineService.getCachedData(key);
}

export function addToOfflineSyncQueue(item: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount' | 'createdAt'>): SyncQueueItem {
  return offlineService.addToSyncQueue(item);
}

export async function processOfflineSyncQueue(): Promise<{ processed: number; failed: number }> {
  return offlineService.processSyncQueue();
}

export function getOfflineManifest(): OfflineManifest {
  return offlineService.getManifest();
}

export function getOfflineStatistics() {
  return offlineService.getStatistics();
}
