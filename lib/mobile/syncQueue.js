// Mobile Sync Queue
// Handles offline data synchronization for mobile clients

class SyncQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.storageKey = 'simtrace_sync_queue';
    this.loadFromStorage();
  }

  // Add item to sync queue
  async add(item) {
    const syncItem = {
      id: Date.now().toString(),
      ...item,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retries: 0,
    };

    this.queue.push(syncItem);
    await this.saveToStorage();
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }

    return syncItem;
  }

  // Process the sync queue
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await this.syncItem(item);
        this.queue.shift(); // Remove successfully synced item
        await this.saveToStorage();
      } catch (error) {
        console.error('[Sync Queue] Failed to sync item:', error);
        
        item.retries++;
        
        if (item.retries >= 3) {
          // Mark as failed after 3 retries
          item.status = 'failed';
          this.queue.shift();
        } else {
          // Move to end of queue for retry
          this.queue.shift();
          this.queue.push(item);
        }
        
        await this.saveToStorage();
        
        // Wait before next item
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.isProcessing = false;
  }

  // Sync individual item
  async syncItem(item) {
    const { type, data } = item;

    switch (type) {
      case 'device_update':
        return this.syncDeviceUpdate(data);
      case 'alert_create':
        return this.syncAlertCreate(data);
      case 'location_update':
        return this.syncLocationUpdate(data);
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }

  // Sync device update
  async syncDeviceUpdate(data) {
    const response = await fetch('/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to sync device update');
    }

    return response.json();
  }

  // Sync alert creation
  async syncAlertCreate(data) {
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to sync alert creation');
    }

    return response.json();
  }

  // Sync location update
  async syncLocationUpdate(data) {
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to sync location update');
    }

    return response.json();
  }

  // Save queue to localStorage
  async saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[Sync Queue] Failed to save to storage:', error);
    }
  }

  // Load queue from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Sync Queue] Failed to load from storage:', error);
    }
  }

  // Get queue status
  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      failed: this.queue.filter(item => item.status === 'failed').length,
      processing: this.isProcessing,
    };
  }

  // Clear failed items
  async clearFailed() {
    this.queue = this.queue.filter(item => item.status !== 'failed');
    await this.saveToStorage();
  }
}

// Export singleton instance
export const syncQueue = new SyncQueue();

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Sync Queue] Network online, processing queue');
    syncQueue.processQueue();
  });

  window.addEventListener('offline', () => {
    console.log('[Sync Queue] Network offline, queueing operations');
  });
}
