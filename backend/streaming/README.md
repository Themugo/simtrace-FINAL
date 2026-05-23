# Real Event Streaming Architecture

Scalable event streaming using Kafka or Redpanda for handling millions of events.

## Features

- **Massive Scalability**: Handle millions of events per second
- **Replayable Events**: Replay events for testing and debugging
- **Resilient Pipelines**: Fault-tolerant with replication
- **Real-time Analytics**: Stream processing for live insights
- **Microservices Ready**: Decoupled architecture for future microservices

## Stream Topics

- `tracking-events` - Device tracking and location data
- `risk-events` - Risk assessment and threat detection
- `audit-events` - Audit logs and compliance events
- `notifications` - Email, SMS, push notifications
- `analytics-events` - Analytics and metrics
- `ai-events` - AI processing and predictions
- `device-events` - Device lifecycle events
- `sim-events` - SIM card change events
- `location-events` - Location-based events
- `alert-events` - Alert and notification events

## Usage

### Initialize Stream Manager

```typescript
import { getStreamManager } from './streaming/kafka.js';

const manager = getStreamManager({
  brokers: ['localhost:9092'],
  clientId: 'simtrace-api',
  sasl: {
    mechanism: 'plain',
    username: 'user',
    password: 'password',
  },
  ssl: true,
});

await manager.connect();
```

### Create Topics

```typescript
await manager.createTopics([
  'tracking-events',
  'risk-events',
  'audit-events',
  'notifications',
  'analytics-events',
  'ai-events',
]);
```

### Publish Events

```typescript
import { 
  publishTrackingEvent, 
  publishRiskEvent, 
  publishAuditEvent,
  publishNotification,
  publishAnalyticsEvent,
  publishAIEvent
} from './streaming/kafka.js';

// Publish tracking event
await publishTrackingEvent({
  imei: '123456789012345',
  location: { lat: -1.2921, lng: 36.8219 },
  timestamp: new Date(),
});

// Publish risk event
await publishRiskEvent({
  imei: '123456789012345',
  riskAssessment: { overallScore: 85, threatLevel: 'HIGH' },
});

// Publish audit event
await publishAuditEvent({
  action: 'device_locked',
  userId: 'user123',
  resourceType: 'device',
  resourceId: 'device123',
});
```

### Subscribe to Topics

```typescript
import { startTrackingEventsConsumer } from './streaming/consumers.js';

await startTrackingEventsConsumer();
```

### Custom Consumer

```typescript
const manager = getStreamManager();

await manager.subscribe(
  'tracking-events',
  'my-consumer-group',
  async (message) => {
    console.log('Received message:', message.value);
    // Process message
  }
);
```

### Publish Batch

```typescript
await manager.publishBatch([
  {
    topic: 'tracking-events',
    key: 'imei1',
    value: { imei: '123456789012345', location: {...} },
  },
  {
    topic: 'tracking-events',
    key: 'imei2',
    value: { imei: '987654321098765', location: {...} },
  },
]);
```

### Monitor Consumer Lag

```typescript
const lag = await manager.getConsumerLag('tracking-consumer-group');
console.log('Consumer lag:', lag);
```

## Benefits Over Redis Queues

1. **Scalability**: Kafka handles millions of events per second vs Redis's thousands
2. **Persistence**: Events are persisted and replayable
3. **Partitioning**: Parallel processing with topic partitions
4. **Consumer Groups**: Multiple consumers can process in parallel
5. **Offset Management**: Track processing position and replay from any point
6. **Backpressure**: Built-in flow control
7. **Ecosystem**: Rich ecosystem of tools and integrations

## Deployment

### Local Development

Use Redpanda for local development:

```bash
docker run -d --name redpanda \
  -p 9092:9092 \
  -p 9644:9644 \
  docker.vectorized.io/vectorized/redpanda:latest \
  redpanda start --overprovisioned --smp 1 --memory 1G
```

### Production

Use managed Kafka services:
- Confluent Cloud
- AWS MSK
- Google Cloud Pub/Sub
- Azure Event Hubs

## Configuration

Environment variables:

```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=simtrace-api
KAFKA_SASL_MECHANISM=plain
KAFKA_SASL_USERNAME=user
KAFKA_SASL_PASSWORD=password
KAFKA_SSL=true
```

## Best Practices

1. **Use appropriate partition count**: More partitions = more parallelism
2. **Set replication factor**: At least 2 for production
3. **Monitor consumer lag**: Ensure consumers keep up
4. **Handle errors gracefully**: Don't crash on bad messages
5. **Use compression**: Enable compression for large payloads
6. **Batch messages**: Publish in batches for better throughput
7. **Consumer groups**: Use different groups for different use cases
