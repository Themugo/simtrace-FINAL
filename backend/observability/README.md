# Full Observability Platform

Full observability platform including OpenTelemetry, distributed tracing, request metrics, queue metrics, AI job metrics, and WebSocket metrics.

## Features

- **Distributed Tracing**: Create and manage traces with spans
- **Metrics Recording**: Record counters, gauges, and histograms
- **Structured Logging**: Structured logs with context and trace correlation
- **Request Metrics**: Track HTTP request performance
- **Queue Metrics**: Monitor queue operations
- **AI Job Metrics**: Track AI job performance and token usage
- **WebSocket Metrics**: Monitor WebSocket connections and events
- **Statistics**: Calculate statistics for all metrics
- **Data Cleanup**: Automatic cleanup of old data

## Usage

### Create Trace

```typescript
import { createTrace, endTrace, addTraceTag, addTraceLog } from './observability/index.js';

// Create a trace
const trace = createTrace('getUser', 'api-service');

// Add tags
addTraceTag(trace.id, 'userId', 'user123');
addTraceTag(trace.id, 'deviceId', 'device456');

// Add logs
addTraceLog(trace.id, 'info', 'Fetching user from database');

// End trace
endTrace(trace.id, 'completed');
```

### Record Metric

```typescript
import { recordMetric } from './observability/index.js';

// Counter metric
recordMetric('requests.total', 'counter', 1, { method: 'GET', path: '/api/users' });

// Gauge metric
recordMetric('connections.active', 'gauge', 42, { service: 'api' });

// Histogram metric
recordMetric('request.duration', 'histogram', 125, { endpoint: '/api/users' });
```

### Log

```typescript
import { log } from './observability/index.js';

log('info', 'api-service', 'User logged in', { userId: 'user123' }, traceId, spanId);

log('error', 'api-service', 'Database connection failed', { error: 'Connection timeout' });
```

### Record Request Metric

```typescript
import { recordRequestMetric } from './observability/index.js';

recordRequestMetric({
  method: 'GET',
  path: '/api/users',
  statusCode: 200,
  duration: 125,
  timestamp: new Date(),
  userId: 'user123',
  deviceId: 'device456',
});
```

### Record Queue Metric

```typescript
import { recordQueueMetric } from './observability/index.js';

recordQueueMetric({
  queueName: 'email-queue',
  operation: 'process',
  duration: 500,
  timestamp: new Date(),
  jobId: 'job123',
});
```

### Record AI Job Metric

```typescript
import { recordAIJobMetric } from './observability/index.js';

recordAIJobMetric({
  jobId: 'job123',
  jobType: 'text-generation',
  model: 'gpt-4',
  tokensUsed: 1500,
  duration: 2500,
  timestamp: new Date(),
  status: 'completed',
});
```

### Record WebSocket Metric

```typescript
import { recordWebSocketMetric } from './observability/index.js';

recordWebSocketMetric({
  connectionId: 'conn123',
  event: 'device_location_update',
  duration: 50,
  timestamp: new Date(),
  userId: 'user123',
  deviceId: 'device456',
});
```

### Get Statistics

```typescript
import { 
  getObservabilityStatistics,
  getRequestStatistics,
  getQueueStatistics,
  getAIJobStatistics,
  getWebSocketStatistics,
} from './observability/index.js';

// Overall statistics
const stats = getObservabilityStatistics();
console.log('Observability statistics:', stats);

// Request statistics
const reqStats = getRequestStatistics();
console.log('Request statistics:', reqStats);

// Queue statistics
const queueStats = getQueueStatistics('email-queue');
console.log('Queue statistics:', queueStats);

// AI job statistics
const aiStats = getAIJobStatistics();
console.log('AI job statistics:', aiStats);

// WebSocket statistics
const wsStats = getWebSocketStatistics();
console.log('WebSocket statistics:', wsStats);
```

## Data Structures

### Trace

```typescript
interface Trace {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  service: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'started' | 'completed' | 'error';
  tags: Record<string, string>;
  logs: Array<{ timestamp: Date; level: string; message: string }>;
  metadata?: Record<string, any>;
}
```

### Metric

```typescript
interface Metric {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}
```

### LogEntry

```typescript
interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
}
```

### RequestMetrics

```typescript
interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
  deviceId?: string;
}
```

### QueueMetrics

```typescript
interface QueueMetrics {
  queueName: string;
  operation: 'enqueue' | 'dequeue' | 'process' | 'error';
  duration?: number;
  timestamp: Date;
  jobId?: string;
}
```

### AIJobMetrics

```typescript
interface AIJobMetrics {
  jobId: string;
  jobType: string;
  model: string;
  tokensUsed: number;
  duration: number;
  timestamp: Date;
  status: 'started' | 'completed' | 'error';
}
```

### WebSocketMetrics

```typescript
interface WebSocketMetrics {
  connectionId: string;
  event: string;
  duration?: number;
  timestamp: Date;
  userId?: string;
  deviceId?: string;
}
```

## Statistics

### Request Statistics

- Total requests
- Average duration
- P50, P95, P99 duration percentiles
- Error rate

### Queue Statistics

- Total operations
- Average process time
- Error rate

### AI Job Statistics

- Total jobs
- Average tokens used
- Average duration
- Error rate
- Statistics by model

### WebSocket Statistics

- Total connections
- Total events
- Average duration
- Events by type

## Production Integration

### OpenTelemetry Integration

```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-trace-jaeger';

const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'simtrace-api',
  }),
});

const exporter = new JaegerExporter({
  endpoint: 'http://jaeger:14268/api/traces',
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();
```

### Prometheus Integration

```typescript
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const exporter = new PrometheusExporter({
  port: 9464,
});

const meterProvider = new MeterProvider();
meterProvider.addMetricReader(exporter);
```

### Express Middleware

```typescript
import express from 'express';

function observabilityMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const start = Date.now();
  const trace = createTrace(req.method + ' ' + req.path, 'api-service');

  res.on('finish', () => {
    const duration = Date.now() - start;
    recordRequestMetric({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date(),
      userId: req.user?.id,
      deviceId: req.device?.id,
    });
    endTrace(trace.id, res.statusCode >= 400 ? 'error' : 'completed');
  });

  next();
}
```

## Best Practices

1. **Trace Context**: Always include trace context in logs and metrics
2. **Structured Logs**: Use structured logs with context
3. **Metric Naming**: Use consistent metric naming conventions
4. **Tags**: Use tags to filter and group metrics
5. **Sampling**: Use sampling for high-volume traces
6. **Retention**: Configure appropriate data retention
7. **Alerting**: Set up alerts based on metrics

## Performance Considerations

1. **Sampling**: Sample traces for high-volume services
2. **Async**: Use async operations for metric recording
3. **Batching**: Batch metric exports
4. **Memory**: Monitor memory usage for in-memory storage
5. **Network**: Consider network latency for remote exporters

## Future Enhancements

- Add OpenTelemetry SDK integration
- Implement distributed context propagation
- Add real-time dashboards
- Implement alerting rules
- Add metric aggregation
- Implement trace sampling
- Add metric histograms with buckets
