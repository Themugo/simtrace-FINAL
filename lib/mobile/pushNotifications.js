// Push Notifications
// Handles push notification registration and management

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Initialize push notifications
  async init() {
    if (!this.isSupported) {
      console.warn('[Push Notifications] Not supported in this browser');
      return false;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('[Push Notifications] Permission not granted');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      
      // Subscribe to push
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      console.log('[Push Notifications] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[Push Notifications] Initialization failed:', error);
      return false;
    }
  }

  // Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      return response.json();
    } catch (error) {
      console.error('[Push Notifications] Failed to send subscription:', error);
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      return;
    }

    try {
      await this.subscription.unsubscribe();
      await this.sendUnsubscriptionToServer(this.subscription);
      this.subscription = null;
      console.log('[Push Notifications] Unsubscribed successfully');
    } catch (error) {
      console.error('[Push Notifications] Unsubscription failed:', error);
    }
  }

  // Send unsubscription to server
  async sendUnsubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send unsubscription to server');
      }
    } catch (error) {
      console.error('[Push Notifications] Failed to send unsubscription:', error);
    }
  }

  // Get current subscription
  getSubscription() {
    return this.subscription;
  }

  // Check if subscribed
  isSubscribed() {
    return !!this.subscription;
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();

// Background sync registration
export async function registerBackgroundSync(tag, minInterval = 1000) {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log(`[Background Sync] Registered: ${tag}`);
    } catch (error) {
      console.error('[Background Sync] Registration failed:', error);
    }
  }
}
