// services/offlineService.ts - Offline mode support with local storage and sync
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_QUEUE_KEY = '@simtrace_offline_queue';
const OFFLINE_DEVICES_KEY = '@simtrace_offline_devices';

interface OfflineAction {
  id: string;
  type: 'add_device' | 'update_device' | 'report_theft' | 'mark_recovered';
  payload: any;
  timestamp: number;
  synced: boolean;
}

class OfflineService {
  private queue: OfflineAction[] = [];
  private isOnline: boolean = true;

  async initialize() {
    // Load queue from storage
    const storedQueue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (storedQueue) {
      this.queue = JSON.parse(storedQueue);
    }

    // Monitor network status
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.syncQueue();
      }
    });

    // Check initial network status
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
  }

  async queueAction(type: OfflineAction['type'], payload: any): Promise<void> {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      payload,
      timestamp: Date.now(),
      synced: false,
    };

    this.queue.push(action);
    await this.saveQueue();

    if (this.isOnline) {
      await this.syncQueue();
    }
  }

  private async syncQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const unsyncedActions = this.queue.filter(a => !a.synced);
    
    for (const action of unsyncedActions) {
      try {
        await this.executeAction(action);
        action.synced = true;
      } catch (error) {
        console.error('Failed to sync action:', action.id, error);
      }
    }

    // Remove synced actions
    this.queue = this.queue.filter(a => !a.synced);
    await this.saveQueue();
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    // Import dynamically to avoid circular dependencies
    const { deviceService } = await import('@api/devices');

    switch (action.type) {
      case 'add_device':
        await deviceService.addDevice(action.payload);
        break;
      case 'update_device':
        await deviceService.updateDevice(action.payload.deviceId, action.payload.data);
        break;
      case 'report_theft':
        await deviceService.reportTheft(action.payload.deviceId, action.payload.data);
        break;
      case 'mark_recovered':
        await deviceService.markRecovered(action.payload.deviceId);
        break;
    }
  }

  private async saveQueue(): Promise<void> {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
  }

  async cacheDevices(devices: any[]): Promise<void> {
    await AsyncStorage.setItem(OFFLINE_DEVICES_KEY, JSON.stringify(devices));
  }

  async getCachedDevices(): Promise<any[]> {
    const cached = await AsyncStorage.getItem(OFFLINE_DEVICES_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(OFFLINE_DEVICES_KEY);
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  getQueueLength(): number {
    return this.queue.filter(a => !a.synced).length;
  }
}

export default new OfflineService();
