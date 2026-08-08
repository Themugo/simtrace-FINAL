# Enterprise Audit System

Enterprise audit system for tracking before/after changes, affected resources, IPs, devices, geo locations, and immutable trails.

## Features

- **Audit Events**: Record comprehensive audit events with actor, resource, and change information
- **Change Diff**: Automatic diff calculation between before and after states
- **Audit Trails**: Immutable trails for each resource with event history
- **Querying**: Flexible query system with filters for events
- **Export**: Export audit logs in JSON, CSV, PDF formats
- **Statistics**: Comprehensive statistics on audit events
- **Geo Location**: Track geographic location of actors
- **Correlation**: Track related events with correlation and request IDs

## Usage

### Record Audit Event

```typescript
import { recordAuditEvent } from './audit/index.js';

const event = recordAuditEvent({
  eventType: 'user.login',
  category: 'user',
  actor: {
    userId: 'user_123',
    userType: 'user',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    location: { country: 'KE', city: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  },
  resource: { type: 'user', id: 'user_123', name: 'John Doe' },
  changes: {},
  metadata: { method: 'password' },
});
```

### Query Audit Events

```typescript
import { queryAuditEvents } from './audit/index.js';

const events = queryAuditEvents({
  category: 'security',
  userId: 'user_123',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 100,
});
```

### Get Audit Trail

```typescript
import { getAuditTrail } from './audit/index.js';

const trail = getAuditTrail('device', 'device_456');
console.log('Trail events:', trail?.events);
```

### Get User Activity

```typescript
import { getUserActivity } from './audit/index.js';

const activity = getUserActivity('user_123', 50);
```

### Get Security Events

```typescript
import { getSecurityEvents } from './audit/index.js';

const securityEvents = getSecurityEvents(100);
```

### Create Audit Export

```typescript
import { createAuditExport } from './audit/index.js';

const export = createAuditExport(
  { category: 'security', startDate: new Date('2024-01-01') },
  'json'
);
```

### Process Audit Export

```typescript
import { processAuditExport } from './audit/index.js';

const result = await processAuditExport('export_id');
console.log('File URL:', result.fileUrl);
```

### Get Statistics

```typescript
import { getAuditStatistics } from './audit/index.js';

const stats = getAuditStatistics();
console.log('Total events:', stats.totalEvents);
console.log('By category:', stats.byCategory);
console.log('By country:', stats.byCountry);
```

## Data Structures

### AuditEvent

```typescript
interface AuditEvent {
  id: string;
  eventType: string;
  category: 'user' | 'device' | 'organization' | 'system' | 'security' | 'compliance';
  actor: {
    userId?: string;
    userType: 'user' | 'system' | 'api' | 'service';
    ipAddress: string;
    userAgent?: string;
    deviceId?: string;
    location?: {
      country?: string;
      city?: string;
      lat?: number;
      lng?: number;
    };
  };
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    diff?: ChangeDiff[];
  };
  metadata: Record<string, any>;
  timestamp: Date;
  correlationId?: string;
  requestId?: string;
}
```

### ChangeDiff

```typescript
interface ChangeDiff {
  path: string;
  kind: 'create' | 'update' | 'delete';
  oldValue?: any;
  newValue?: any;
}
```

### AuditTrail

```typescript
interface AuditTrail {
  id: string;
  resourceId: string;
  resourceType: string;
  events: AuditEvent[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Event Categories

### User
User-related events (login, logout, profile changes)

### Device
Device-related events (created, updated, deleted, status changes)

### Organization
Organization-related events (member changes, settings updates)

### System
System-related events (configuration changes, maintenance)

### Security
Security-related events (authentication failures, suspicious activity)

### Compliance
Compliance-related events (consent changes, data access)

## Query Filters

- **eventType**: Filter by specific event type
- **category**: Filter by event category
- **userId**: Filter by actor user ID
- **resourceType**: Filter by resource type
- **resourceId**: Filter by resource ID
- **startDate**: Filter by start date
- **endDate**: Filter by end date
- **ipAddress**: Filter by IP address
- **country**: Filter by country
- **limit**: Limit number of results
- **offset**: Offset for pagination

## Production Integration

### Express Middleware

```typescript
import express from 'express';
import { recordAuditEvent } from './audit/index.js';

function auditMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const originalSend = res.send;

  res.send = function (data) {
    recordAuditEvent({
      eventType: 'api.request',
      category: 'system',
      actor: {
        userId: req.user?.id,
        userType: 'user',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
      },
      resource: {
        type: 'api',
        id: req.path,
        name: req.method,
      },
      changes: {},
      metadata: {
        statusCode: res.statusCode,
        path: req.path,
        method: req.method,
      },
    });

    return originalSend.call(this, data);
  };

  next();
}
```

### Database Integration

```typescript
// Store audit events in database
async function persistAuditEvent(event: AuditEvent): Promise<void> {
  await db.collection('audit_events').insertOne(event);
}

// Query from database
async function queryAuditEventsFromDB(query: AuditQuery): Promise<AuditEvent[]> {
  const filter: any = {};

  if (query.category) filter.category = query.category;
  if (query.userId) filter['actor.userId'] = query.userId;
  if (query.startDate) filter.timestamp = { $gte: query.startDate };

  return db.collection('audit_events').find(filter).toArray();
}
```

### Immutable Storage

```typescript
// Use append-only storage for immutability
async function appendToImmutableLog(event: AuditEvent): Promise<void> {
  const logEntry = {
    ...event,
    hash: crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex'),
  };

  await immutableStorage.append(logEntry);
}
```

## Best Practices

1. **Immutability**: Never modify audit events after recording
2. **Comprehensive**: Record all relevant context (IP, location, user agent)
3. **Correlation**: Use correlation IDs for related events
4. **Performance**: Use indexes for efficient querying
5. **Retention**: Implement appropriate retention policies
6. **Security**: Restrict access to audit logs
7. **Backup**: Regularly backup audit logs

## Performance Considerations

1. **Indexing**: Index frequently queried fields
2. **Pagination**: Always use pagination for large result sets
3. **Archiving**: Archive old events to reduce query load
4. **Caching**: Cache frequently accessed trails
5. **Async**: Use async operations for persistence

## Future Enhancements

- Add database persistence
- Implement real-time audit streaming
- Add audit log encryption
- Implement audit log signing
- Add advanced analytics and visualization
- Implement automated anomaly detection
