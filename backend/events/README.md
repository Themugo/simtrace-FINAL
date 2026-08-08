# Event Bus

The central event bus provides a decoupled event system for the SimTrace platform.

## Events

### Device Events
- `device.detected` - New device detected
- `device.updated` - Device information updated
- `device.locked` - Device locked
- `device.unlocked` - Device unlocked

### Risk Events
- `risk.calculated` - Risk assessment completed
- `risk.high` - High risk detected
- `risk.changed` - Risk level changed

### User Events
- `user.login` - User logged in
- `user.logout` - User logged out
- `user.registered` - User registered

### Case Events
- `case.created` - New case created
- `case.updated` - Case updated
- `case.resolved` - Case resolved

### Payment Events
- `payment.completed` - Payment completed
- `payment.failed` - Payment failed

### Tracking Events
- `sim.changed` - SIM card changed
- `location.detected` - Location detected

### Alert Events
- `alert.created` - Alert created

### Organization Events
- `organization.created` - Organization created
- `organization.member_added` - Member added to organization

### Webhook Events
- `webhook.triggered` - Webhook triggered

## Usage

```typescript
import { on, emit, emitAsync } from './events/index.js';

// Subscribe to an event
on('device.detected', (event) => {
  console.log('Device detected:', event.data);
});

// Emit an event
emit('device.detected', { imei: '123456789012345', lat: -1.2921, lng: 36.8219 });

// Emit async event
await emitAsync('risk.calculated', { imei: '123456789012345', riskScore: 75 });
```

## Distributed Events

The event bus integrates with Redis pub/sub for distributed systems:

```typescript
import { publishEvent, setupRedisEventSubscriber } from './events/subscribers.js';

// Setup Redis subscriber (call on startup)
await setupRedisEventSubscriber();

// Publish event to Redis (will be received by all instances)
await publishEvent('device.detected', { imei: '123456789012345' });
```
