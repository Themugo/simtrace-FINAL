# Live Command Center Dashboard

SOC-style dashboard for realtime monitoring and threat detection.

## Features

- **Active Incidents Widget**: Real-time incident tracking and management
- **Live Movement Stream**: Real-time device movement visualization
- **Telecom Activity Feed**: SIM changes, blacklist detections, network changes
- **High-Risk Devices**: Devices with high risk scores
- **AI Detections**: Fraud rings, coordinated theft, repeat offenders, pattern anomalies
- **System Statistics**: Total devices, active devices, stolen devices, recovery rates

## Usage

### Get Dashboard Widgets

```typescript
import { getDashboardWidgets } from './modules/command-center/index.js';

const widgets = getDashboardWidgets();
console.log('Dashboard widgets:', widgets);
```

### Get Specific Widget

```typescript
import { getDashboardWidget } from './modules/command-center/index.js';

const incidentsWidget = getDashboardWidget('active-incidents');
console.log('Active incidents:', incidentsWidget?.data);
```

### Get Active Incidents

```typescript
import { getActiveIncidents, resolveIncident } from './modules/command-center/index.js';

// Get active incidents
const incidents = getActiveIncidents();
console.log('Active incidents:', incidents);

// Resolve an incident
resolveIncident('incident_1234567890_abc');
```

### Update System Stats

```typescript
import { updateSystemStats } from './modules/command-center/index.js';

await updateSystemStats();
```

### Clear Old Data

```typescript
import { clearOldData } from './modules/command-center/index.js';

// Clear data older than 24 hours
clearOldData(24);
```

## Widget Types

### Active Incidents Widget

```typescript
interface Incident {
  id: string;
  type: 'theft' | 'fraud' | 'sim_swap' | 'impossible_travel' | 'high_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  imei: string;
  description: string;
  location?: { lat: number; lng: number };
  timestamp: Date;
  status: 'active' | 'investigating' | 'resolved';
}
```

### Movement Stream Widget

```typescript
interface MovementStream {
  imei: string;
  location: { lat: number; lng: number };
  timestamp: Date;
  speed: number;
  heading: number;
}
```

### Telecom Feed Widget

```typescript
interface TelecomFeed {
  imei: string;
  operator: string;
  event: 'sim_change' | 'blacklist_detected' | 'network_change';
  timestamp: Date;
  details: any;
}
```

### Risk Alert Widget

```typescript
interface RiskAlert {
  imei: string;
  riskScore: number;
  threatLevel: string;
  riskFactors: string[];
  timestamp: Date;
}
```

### AI Detections Widget

```typescript
interface AIDetection {
  type: 'fraud_ring' | 'coordinated_theft' | 'repeat_offender' | 'pattern_anomaly';
  description: string;
  confidence: number;
  affectedDevices: string[];
  timestamp: Date;
}
```

## Event Integration

The dashboard automatically listens to events:

- `device.detected` - Updates movement stream
- `risk.calculated` - Updates risk alerts
- `risk.high` - Creates incident
- `sim.changed` - Updates telecom feed and creates incident
- `agent.fraud_ring_detected` - Updates AI detections
- `agent.suspicious_relationship` - Updates AI detections
- `agent.recovery_opportunity` - Updates AI detections

## Dashboard Events

The dashboard emits events for real-time updates:

```typescript
import { emit } from './events/index.js';

emit.on('dashboard.widget_updated', (data) => {
  console.log('Widget updated:', data.widgetId);
});
```

## WebSocket Integration

For real-time dashboard updates, integrate with WebSocket:

```typescript
import { emit } from './events/index.js';

// Listen to dashboard updates
emit.on('dashboard.widget_updated', (data) => {
  // Send to connected WebSocket clients
  io.emit('dashboard_update', data);
});
```

## Performance Considerations

1. **Data retention**: Automatically limits data to prevent memory issues
2. **Event throttling**: Consider throttling high-frequency events
3. **Widget updates**: Only emit updates when data changes
4. **Database queries**: Cache system stats to reduce database load
5. **WebSocket scaling**: Use Redis pub/sub for multi-instance deployments

## Best Practices

1. **Regular cleanup**: Call `clearOldData()` periodically
2. **Incident resolution**: Resolve incidents when handled
3. **Widget filtering**: Only subscribe to widgets you need
4. **Event handling**: Handle dashboard events in WebSocket layer
5. **Rate limiting**: Limit dashboard update frequency for performance

## Future Enhancements

- Add more widget types (maps, charts, timelines)
- Implement widget customization
- Add dashboard layouts and templates
- Implement user-specific dashboards
- Add historical data views
- Implement alert thresholds and notifications
