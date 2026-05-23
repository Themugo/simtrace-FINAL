# Offline-First Mobile Experience

Offline-first mobile experience with service workers, cache dashboards/maps, and sync queue for Africa market.

## Features

- **Data Caching**: Cache dashboard, map, and device data with TTL
- **Sync Queue**: Queue offline actions for synchronization when online
- **Conflict Resolution**: Detect and resolve sync conflicts
- **Version Management**: Version-based cache invalidation
- **Statistics**: Track cache size, sync queue status, and conflicts
- **Pattern Invalidation**: Invalidate cache by pattern
- **Retry Logic**: Automatic retry for failed sync items

## Usage

### Cache Data

```typescript
import { cacheOfflineData } from './offline/index.js';

const entry = cacheOfflineData('dashboard:overview', {
  totalDevices: 100,
  activeDevices: 85,
}, 3600); // 1 hour TTL
```

### Get Cached Data

```typescript
import { getCachedOfflineData } from './offline/index.js';

const data = getCachedOfflineData('dashboard:overview');
if (data) {
  console.log('Cached data:', data);
} else {
  console.log('Data not cached or expired');
}
```

### Add to Sync Queue

```typescript
import { addToOfflineSyncQueue } from './offline/index.js';

const item = addToOfflineSyncQueue({
  type: 'device_update',
  data: { deviceId: 'device_1', status: 'stolen' },
});
```

### Process Sync Queue

```typescript
import { processOfflineSyncQueue } from './offline/index.js';

const result = await processOfflineSyncQueue();
console.log('Processed:', result.processed);
console.log('Failed:', result.failed);
```

### Get Manifest

```typescript
import { getOfflineManifest } from './offline/index.js';

const manifest = getOfflineManifest();
console.log('Version:', manifest.version);
console.log('Sync queue:', manifest.syncQueue);
```

### Get Statistics

```typescript
import { getOfflineStatistics } from './offline/index.js';

const stats = getOfflineStatistics();
console.log('Cache size:', stats.cacheSize);
console.log('Pending sync:', stats.pendingSync);
console.log('Conflicts:', stats.conflicts);
```

## Data Structures

### CacheEntry

```typescript
interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt?: Date;
  version: string;
  size: number;
}
```

### SyncQueueItem

```typescript
interface SyncQueueItem {
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
```

### SyncConflict

```typescript
interface SyncConflict {
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
```

## Sync Queue Types

### device_update
Device status or property updates

### location_update
Device location updates

### evidence_upload
Evidence file uploads

### case_update
Case status or information updates

### user_action
User actions and preferences

## Conflict Types

### version_mismatch
Version numbers don't match but data is identical

### data_conflict
Data differs between local and remote

### delete_conflict
One version deleted, other modified

## Production Integration

### Service Worker Registration

```typescript
// In frontend service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('simtrace-v1').then((cache) => {
      return cache.addAll([
        '/dashboard',
        '/map',
        '/api/devices',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Background Sync

```typescript
// Register background sync
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register('sync-queue');
});

// In service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});
```

### IndexedDB Storage

```typescript
// Use IndexedDB for persistent storage
const db = await openDB('simtrace-offline', 1, {
  upgrade(db) {
    db.createObjectStore('cache');
    db.createObjectStore('sync-queue');
  },
});

// Cache data
await db.put('cache', data, key);

// Get cached data
const data = await db.get('cache', key);
```

## Africa Market Considerations

1. **Network Conditions**: Handle intermittent connectivity
2. **Data Compression**: Compress data to reduce bandwidth
3. **Batch Sync**: Batch sync operations to reduce API calls
4. **Priority Sync**: Prioritize critical updates
5. **Storage Limits**: Manage storage limits on low-end devices

## Best Practices

1. **TTL**: Set appropriate TTL for cached data
2. **Versioning**: Use version-based cache invalidation
3. **Retry**: Implement exponential backoff for retries
4. **Conflict**: Provide UI for conflict resolution
5. **Storage**: Monitor storage usage and clean up old data
6. **Sync**: Sync when on WiFi to save data
7. **Priority**: Prioritize critical data for sync

## Performance Considerations

1. **Cache Size**: Monitor cache size and implement limits
2. **Sync Frequency**: Adjust sync frequency based on network conditions
3. **Batch Size**: Batch sync operations for efficiency
4. **Compression**: Compress data before storage
5. **Cleanup**: Regularly clean up old cache entries

## Future Enhancements

- Add IndexedDB persistence
- Implement delta sync
- Add predictive caching
- Implement sync prioritization
- Add offline analytics
- Implement conflict resolution UI
