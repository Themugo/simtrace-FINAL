// Offline Cache
// Handles caching of data for offline access

class OfflineCache {
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
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[Offline Cache] Service worker registered:', registration);
      } catch (error) {
        console.error('[Offline Cache] Service worker registration failed:', error);
      }
    }
  }

  // Cache data
  async cache(url, data) {
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
  async get(url) {
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
  async cacheApiResponse(url, data) {
    await this.cache(url, data);
  }

  // Get cached API response
  async getCachedApiResponse(url) {
    return this.get(url);
  }

  // Clear cache
  async clear() {
    try {
      await caches.delete(this.cacheName);
      console.log('[Offline Cache] Cache cleared');
    } catch (error) {
      console.error('[Offline Cache] Failed to clear cache:', error);
    }
  }

  // Pre-cache critical resources
  async precache() {
    try {
      const cache = await caches.open(this.cacheName);
      await cache.addAll(this.cachedUrls);
      console.log('[Offline Cache] Critical resources cached');
    } catch (error) {
      console.error('[Offline Cache] Failed to precache resources:', error);
    }
  }
}

// Export singleton instance
export const offlineCache = new OfflineCache();
