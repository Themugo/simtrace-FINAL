// Offline Cache
// Handles caching of data for offline access

interface CachedData {
  [key: string]: any;
}

class OfflineCache {
  private cacheName: string;
  private cachedUrls: string[];

  constructor() {
    this.cacheName = 'simtrace-offline-v1';
    this.cachedUrls = [
      '/',
      '/dashboard',
      '/devices',
      '/api/health',
    ];
  }

  // Initialize cache
  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        // Service worker registered successfully
      } catch (error) {
        console.error('[Offline Cache] Service worker registration failed:', error);
      }
    }
  }

  // Cache data
  async cache(url: string, data: CachedData): Promise<void> {
    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
      await cache.put(url, response);
    } catch (error) {
      console.error('[Offline Cache] Failed to cache data:', error);
    }
  }

  // Get cached data
  async get(url: string): Promise<CachedData | null> {
    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(url);
      
      if (response) {
        return response.json();
      }
      
      return null;
    } catch (error) {
      console.error('[Offline Cache] Failed to get cached data:', error);
      return null;
    }
  }

  // Cache API response
  async cacheApiResponse(url: string, data: CachedData): Promise<void> {
    await this.cache(url, data);
  }

  // Get cached API response
  async getCachedApiResponse(url: string): Promise<CachedData | null> {
    return this.get(url);
  }

  // Clear cache
  async clear(): Promise<void> {
    try {
      await caches.delete(this.cacheName);
      // Cache cleared successfully
    } catch (error) {
      console.error('[Offline Cache] Failed to clear cache:', error);
    }
  }

  // Pre-cache critical resources
  async precache(): Promise<void> {
    try {
      const cache = await caches.open(this.cacheName);
      await cache.addAll(this.cachedUrls);
      // Critical resources cached successfully
    } catch (error) {
      console.error('[Offline Cache] Failed to precache resources:', error);
    }
  }
}

// Export singleton instance
export const offlineCache = new OfflineCache();
