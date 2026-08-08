import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = 'offline_cache_';
const QUEUE_PREFIX = 'offline_queue_';

interface OfflineCacheItem {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

interface OfflineQueueItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body?: any;
  timestamp: number;
  retries: number;
}

class OfflineModeService {
  private isOnline: boolean = true;
  private queue: OfflineQueueItem[] = [];
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  async initialize() {
    // Check initial network status
    const networkState = await NetInfo.fetch();
    this.isOnline = networkState.isConnected ?? true;

    // Listen for network changes
    NetInfo.addEventListener(state => {
      const newStatus = state.isConnected ?? true;
      if (newStatus !== this.isOnline) {
        this.isOnline = newStatus;
        this.notifyListeners(newStatus);
        if (newStatus) {
          this.syncQueue();
        }
      }
    });

    // Load offline queue from storage
    await this.loadQueue();
  }

  // ── Network Status ─────────────────────────────────────────────────────────────
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  onNetworkStatusChange(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline));
  }

  // ── Cache Management ───────────────────────────────────────────────────────────
  async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    const item: OfflineCacheItem = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      const itemStr = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!itemStr) return null;

      const item: OfflineCacheItem = JSON.parse(itemStr);
      const age = Date.now() - item.timestamp;

      if (age > item.ttl) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async clearCache(key?: string): Promise<void> {
    if (key) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  }

  // ── Offline Queue ──────────────────────────────────────────────────────────────
  async queueRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<void> {
    const item: OfflineQueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method,
      endpoint,
      body,
      timestamp: Date.now(),
      retries: 0,
    };
    this.queue.push(item);
    await this.saveQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(`${QUEUE_PREFIX}requests`);
      if (queueStr) {
        this.queue = JSON.parse(queueStr);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(`${QUEUE_PREFIX}requests`, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  private async syncQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    console.log(`Syncing ${this.queue.length} offline requests...`);

    const { default: apiClient } = await import('../api/client');
    const successfulItems: string[] = [];

    for (const item of this.queue) {
      try {
        let response;
        switch (item.method) {
          case 'GET':
            response = await apiClient.get(item.endpoint);
            break;
          case 'POST':
            response = await apiClient.post(item.endpoint, item.body);
            break;
          case 'PUT':
            response = await apiClient.put(item.endpoint, item.body);
            break;
          case 'PATCH':
            response = await apiClient.patch(item.endpoint, item.body);
            break;
          case 'DELETE':
            response = await apiClient.delete(item.endpoint);
            break;
        }

        successfulItems.push(item.id);
        console.log(`Synced request: ${item.method} ${item.endpoint}`);
      } catch (error) {
        console.error(`Failed to sync request: ${item.method} ${item.endpoint}`, error);
        item.retries++;
        if (item.retries >= 3) {
          // Remove failed items after 3 retries
          successfulItems.push(item.id);
          console.error(`Removed failed request after 3 retries: ${item.method} ${item.endpoint}`);
        }
      }
    }

    // Remove successfully synced items
    this.queue = this.queue.filter(item => !successfulItems.includes(item.id));
    await this.saveQueue();

    console.log(`Sync complete. ${successfulItems.length} requests synced, ${this.queue.length} remaining`);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }
}

export const offlineModeService = new OfflineModeService();
