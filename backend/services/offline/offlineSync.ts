// services/offline/offlineSync.ts - Offline capabilities with sync
import crypto from 'crypto';

export interface OfflineOperation {
  operationId: string;
  timestamp: number;
  deviceId: string;
  userId: string;
  operationType: 'create' | 'update' | 'delete';
  entityType: 'device' | 'location' | 'alert' | 'user';
  data: any;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastSyncAttempt?: number;
}

export interface SyncConflict {
  conflictId: string;
  operationId: string;
  entityType: string;
  entityId: string;
  localData: any;
  remoteData: any;
  timestamp: number;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface SyncResult {
  success: boolean;
  operationsSynced: number;
  operationsFailed: number;
  conflictsResolved: number;
  timestamp: number;
}

export class OfflineSyncService {
  private offlineQueue: Map<string, OfflineOperation> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private syncInProgress: boolean = false;

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
    const operationId = crypto.randomBytes(16).toString('hex');
    
    const operation: OfflineOperation = {
      operationId,
      timestamp: Date.now(),
      deviceId,
      userId,
      operationType,
      entityType,
      data,
      syncStatus: 'pending',
      retryCount: 0
    };

    this.offlineQueue.set(operationId, operation);
    
    return operation;
  }

  /**
   * Sync all pending operations
   */
  async sync(userId: string): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        operationsSynced: 0,
        operationsFailed: 0,
        conflictsResolved: 0,
        timestamp: Date.now()
      };
    }

    this.syncInProgress = true;

    let operationsSynced = 0;
    let operationsFailed = 0;
    let conflictsResolved = 0;

    try {
      const pendingOperations = Array.from(this.offlineQueue.values())
        .filter(op => op.syncStatus === 'pending' && op.userId === userId)
        .sort((a, b) => a.timestamp - b.timestamp);

      for (const operation of pendingOperations) {
        try {
          operation.syncStatus = 'syncing';
          operation.lastSyncAttempt = Date.now();

          // Simulate sync operation
          const syncSuccess = await this.syncOperation(operation);

          if (syncSuccess) {
            operation.syncStatus = 'synced';
            operationsSynced++;
          } else {
            operation.syncStatus = 'failed';
            operation.retryCount++;
            operationsFailed++;
          }

          this.offlineQueue.set(operation.operationId, operation);
        } catch (error) {
          operation.syncStatus = 'failed';
          operation.retryCount++;
          operationsFailed++;
          this.offlineQueue.set(operation.operationId, operation);
        }
      }

      // Remove synced operations
      for (const [operationId, operation] of this.offlineQueue.entries()) {
        if (operation.syncStatus === 'synced') {
          this.offlineQueue.delete(operationId);
        }
      }

      // Resolve conflicts
      conflictsResolved = await this.resolveConflicts();

      return {
        success: true,
        operationsSynced,
        operationsFailed,
        conflictsResolved,
        timestamp: Date.now()
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync individual operation
   */
  private async syncOperation(_operation: OfflineOperation): Promise<boolean> {
    // In production, this would make actual API calls to the backend
    // For now, we simulate the sync with a delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate 90% success rate
    return Math.random() > 0.1;
  }

  /**
   * Resolve sync conflicts
   */
  private async resolveConflicts(): Promise<number> {
    let resolved = 0;

    for (const [conflictId, conflict] of this.conflicts.entries()) {
      try {
        // Auto-resolve conflicts based on timestamp (most recent wins)
        const resolution = this.autoResolveConflict(conflict);
        
        if (resolution) {
          conflict.resolution = resolution;
          this.conflicts.set(conflictId, conflict);
          resolved++;
        }
      } catch (error) {
        // Skip conflicts that can't be auto-resolved
      }
    }

    // Remove resolved conflicts
    for (const [conflictId, conflict] of this.conflicts.entries()) {
      if (conflict.resolution) {
        this.conflicts.delete(conflictId);
      }
    }

    return resolved;
  }

  /**
   * Auto-resolve conflict based on timestamp
   */
  private autoResolveConflict(conflict: SyncConflict): 'local' | 'remote' | 'merge' | null {
    // Simple strategy: most recent wins
    const localTimestamp = conflict.localData.timestamp || conflict.timestamp;
    const remoteTimestamp = conflict.remoteData.timestamp || conflict.timestamp;

    if (localTimestamp > remoteTimestamp) {
      return 'local';
    } else if (remoteTimestamp > localTimestamp) {
      return 'remote';
    } else {
      // If timestamps are equal, prefer remote (server authority)
      return 'remote';
    }
  }

  /**
   * Get pending operations for a user
   */
  getPendingOperations(userId: string): OfflineOperation[] {
    return Array.from(this.offlineQueue.values())
      .filter(op => op.syncStatus === 'pending' && op.userId === userId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get failed operations
   */
  getFailedOperations(userId: string): OfflineOperation[] {
    return Array.from(this.offlineQueue.values())
      .filter(op => op.syncStatus === 'failed' && op.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations(userId: string): Promise<SyncResult> {
    const failedOperations = this.getFailedOperations(userId);

    for (const operation of failedOperations) {
      operation.syncStatus = 'pending';
      operation.retryCount = 0;
      this.offlineQueue.set(operation.operationId, operation);
    }

    return this.sync(userId);
  }

  /**
   * Clear old operations
   */
  clearOldOperations(maxAge: number = 604800000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [operationId, operation] of this.offlineQueue.entries()) {
      if (now - operation.timestamp > maxAge && operation.syncStatus === 'failed') {
        this.offlineQueue.delete(operationId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get sync statistics
   */
  getStatistics(userId: string): {
    pending: number;
    syncing: number;
    failed: number;
    conflicts: number;
  } {
    const userOperations = Array.from(this.offlineQueue.values())
      .filter(op => op.userId === userId);

    return {
      pending: userOperations.filter(op => op.syncStatus === 'pending').length,
      syncing: userOperations.filter(op => op.syncStatus === 'syncing').length,
      failed: userOperations.filter(op => op.syncStatus === 'failed').length,
      conflicts: this.conflicts.size
    };
  }

  /**
   * Export offline queue
   */
  exportQueue(userId: string): string {
    const userOperations = Array.from(this.offlineQueue.values())
      .filter(op => op.userId === userId);
    
    return JSON.stringify(userOperations, null, 2);
  }

  /**
   * Import offline queue
   */
  importQueue(operations: OfflineOperation[]): number {
    let imported = 0;

    for (const operation of operations) {
      if (!this.offlineQueue.has(operation.operationId)) {
        this.offlineQueue.set(operation.operationId, operation);
        imported++;
      }
    }

    return imported;
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Cancel sync
   */
  cancelSync(): void {
    this.syncInProgress = false;
  }
}

export const offlineSyncService = new OfflineSyncService();
