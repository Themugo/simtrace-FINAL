// services/offline/offlineManager.ts - Offline manager for coordinating offline operations
import { offlineSyncService, OfflineOperation } from './offlineSync.js';
import { offlineStorageService, OfflineData } from './offlineStorage.js';

export interface OfflineState {
  isOnline: boolean;
  lastSyncTime: number;
  pendingOperations: number;
  failedOperations: number;
  storageUsage: number;
}

export class OfflineManager {
  private isOnline: boolean = true;
  private syncInterval: NodeJS.Timeout | null = null;
  private syncIntervalMs: number = 30000; // 30 seconds

  /**
   * Initialize offline manager
   */
  initialize(): void {
    this.setupNetworkListeners();
    this.startSyncInterval();
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    // In a browser environment, this would use navigator.onLine
    // For Node.js, we simulate network status
    const g = globalThis as any;
    if (g?.navigator?.onLine !== undefined) {
      g.addEventListener('online', () => {
        this.isOnline = true;
        this.triggerSync();
      });

      g.addEventListener('offline', () => {
        this.isOnline = false;
      });

      this.isOnline = g.navigator.onLine;
    }
  }

  /**
   * Start automatic sync interval
   */
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.triggerSync();
      }
    }, this.syncIntervalMs);
  }

  /**
   * Stop automatic sync
   */
  stopSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Trigger sync
   */
  async triggerSync(userId?: string): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    if (userId) {
      await offlineSyncService.sync(userId);
    }
  }

  /**
   * Add operation to offline queue
   */
  addOperation(
    deviceId: string,
    userId: string,
    operationType: 'create' | 'update' | 'delete',
    entityType: 'device' | 'location' | 'alert' | 'user',
    data: any
  ): OfflineOperation {
    return offlineSyncService.addOperation(
      deviceId,
      userId,
      operationType,
      entityType,
      data
    );
  }

  /**
   * Store data offline
   */
  storeOffline(
    deviceId: string,
    userId: string,
    entityType: 'device' | 'location' | 'alert' | 'user' | 'settings',
    data: any,
    ttl?: number
  ): OfflineData {
    return offlineStorageService.store(deviceId, userId, entityType, data, ttl);
  }

  /**
   * Retrieve offline data
   */
  retrieveOffline(dataId: string): OfflineData | null {
    return offlineStorageService.retrieve(dataId);
  }

  /**
   * Retrieve offline data by entity
   */
  retrieveOfflineByEntity(
    userId: string,
    entityType: 'device' | 'location' | 'alert' | 'user' | 'settings'
  ): OfflineData[] {
    return offlineStorageService.retrieveByEntity(userId, entityType);
  }

  /**
   * Get offline state
   */
  getOfflineState(userId: string): OfflineState {
    const syncStats = offlineSyncService.getStatistics(userId);
    const storageStats = offlineStorageService.getStatistics(userId);

    return {
      isOnline: this.isOnline,
      lastSyncTime: Date.now(),
      pendingOperations: syncStats.pending,
      failedOperations: syncStats.failed,
      storageUsage: storageStats.usagePercentage
    };
  }

  /**
   * Sync all pending operations
   */
  async syncAll(userId: string): Promise<any> {
    return offlineSyncService.sync(userId);
  }

  /**
   * Retry failed operations
   */
  async retryFailed(userId: string): Promise<any> {
    return offlineSyncService.retryFailedOperations(userId);
  }

  /**
   * Clear old data
   */
  clearOldData(): void {
    offlineSyncService.clearOldOperations();
    offlineStorageService.clearExpired();
  }

  /**
   * Export offline data
   */
  exportOfflineData(userId: string): {
    queue: string;
    storage: string;
  } {
    return {
      queue: offlineSyncService.exportQueue(userId),
      storage: offlineStorageService.exportStorage(userId)
    };
  }

  /**
   * Import offline data
   */
  importOfflineData(
    queue: string,
    storage: string
  ): {
    queueImported: number;
    storageImported: number;
  } {
    const queueData = JSON.parse(queue) as OfflineOperation[];
    const storageData = JSON.parse(storage) as OfflineData[];

    return {
      queueImported: offlineSyncService.importQueue(queueData),
      storageImported: offlineStorageService.importStorage(storageData)
    };
  }

  /**
   * Set sync interval
   */
  setSyncInterval(intervalMs: number): void {
    this.syncIntervalMs = intervalMs;
    this.startSyncInterval();
  }

  /**
   * Get sync interval
   */
  getSyncInterval(): number {
    return this.syncIntervalMs;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopSyncInterval();
  }
}

export const offlineManager = new OfflineManager();
