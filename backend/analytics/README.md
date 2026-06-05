# Advanced Telemetry Analytics

Streaming analytics for live movement, risk spikes, and telecom anomalies.

## Features

- **Streaming Analytics**: Real-time processing of telemetry events
- **Movement Analytics**: Track device movement patterns
- **Risk Analytics**: Monitor risk scores and threat levels
- **Telecom Analytics**: Analyze SIM changes and network events
- **Theft Analytics**: Track theft and recovery events
- **Anomaly Detection**: Detect risk spikes, telecom anomalies, movement anomalies, theft surges
- **Aggregated Metrics**: Sum, average, min, max aggregations by dimensions

## Usage

### Process Analytics Event

```typescript
import { processAnalyticsEvent } from './analytics/index.js';

processAnalyticsEvent({
  type: 'movement',
  timestamp: new Date(),
  imei: '123456789012345',
  data: {
    location: { lat: -1.2921, lng: 36.8219 },
    speed: 10,
  },
});
```

### Get Metrics by Type

```typescript
import { getMetrics } from './analytics/index.js';

const movementMetrics = getMetrics('movement', 100);
const riskMetrics = getMetrics('risk', 100);
const telecomMetrics = getMetrics('telecom', 100);
```

### Get All Metrics

```typescript
import { getAllMetrics } from './analytics/index.js';

const allMetrics = getAllMetrics(100);
console.log('All metrics:', allMetrics);
```

### Get Anomalies

```typescript
import { getAnomalies } from './analytics/index.js';

const anomalies = getAnomalies(20);
console.log('Detected anomalies:', anomalies);
```

### Get Aggregated Metrics

```typescript
import { getAggregatedMetrics } from './analytics/index.js';

// Average risk score by threat level
const avgRiskByThreat = getAggregatedMetrics('risk', 'avg', 'threatLevel');

// Total theft count by location
const theftByLocation = getAggregatedMetrics('theft', 'sum', 'location');

// Max movement count by hour
const maxMovementByHour = getAggregatedMetrics('movement', 'max', 'hour');
```

### Clear Old Data

```typescript
import { clearAnalyticsData } from './analytics/index.js';

// Clear data older than 24 hours
clearAnalyticsData(24);
```

## Event Types

```typescript
interface AnalyticsEvent {
  type: 'movement' | 'risk' | 'telecom' | 'theft' | 'recovery';
  timestamp: Date;
  imei: string;
  data: any;
}
```

## Metric Structure

```typescript
interface AnalyticsMetric {
  name: string;
  value: number;
  timestamp: Date;
  dimensions: Record<string, string>;
}
```

## Anomaly Types

- **risk_spike**: Sudden increase in risk scores
- **telecom_anomaly**: Unusual telecom activity (e.g., high SIM change rate)
- **movement_anomaly**: Abnormal movement patterns
- **theft_surge**: Sudden increase in theft events

## Anomaly Detection

The analytics engine automatically detects anomalies:

- **Risk Spikes**: When max risk is 2x average and > 70
- **Telecom Anomalies**: When SIM changes > 10% of telecom events
- **Movement Anomalies**: When a device has > 20% of movement events
- **Theft Surges**: When hourly theft count is 3x average

## Aggregation Functions

- **sum**: Sum of values
- **avg**: Average of values
- **min**: Minimum value
- **max**: Maximum value

## Performance Considerations

1. **Buffer Size**: Events are buffered (default: 1000)
2. **Metric Retention**: Metrics are kept per type (default: 1000)
3. **Anomaly Retention**: Anomalies are kept (default: 50)
4. **Data Cleanup**: Regularly call `clearAnalyticsData()` to prevent memory issues
5. **Event Processing**: Events are processed synchronously

## ClickHouse Integration

For production deployments, integrate with ClickHouse:

```typescript
// Example ClickHouse integration
import { ClickHouseClient } from '@clickhouse/client';

const client = new ClickHouseClient({
  host: 'localhost',
  port: 8123,
  username: 'default',
  password: '',
  database: 'simtrace',
});

// Insert metrics into ClickHouse
await client.insert({
  table: 'analytics_metrics',
  values: metrics,
  format: 'JSONEachRow',
});
```

## Best Practices

1. **Regular Cleanup**: Call `clearAnalyticsData()` periodically
2. **Event Buffering**: Buffer events before processing for efficiency
3. **Anomaly Thresholds**: Adjust anomaly detection thresholds based on your use case
4. **Aggregation**: Use aggregations for dashboard metrics
5. **ClickHouse**: Use ClickHouse for long-term storage and complex queries

## Future Enhancements

- Add ClickHouse integration
- Implement real-time dashboards
- Add predictive analytics
- Implement trend detection
- Add alerting for anomalies
- Implement metric rollups
