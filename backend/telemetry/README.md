# Telemetry Pipeline

End-to-end telemetry processing pipeline for device tracking data.

## Pipeline Stages

1. **Ingest** - Accept raw telemetry data
2. **Validate** - Ensure data integrity (IMEI format, timestamp, location, battery)
3. **Deduplicate** - Prevent duplicate processing using time windows
4. **Enrich** - Add geolocation, IP information, device fingerprint
5. **Score** - Calculate risk scores and perform anti-spoofing detection
6. **Store** - Persist to database (TrackingEvent, DeviceLocation, DeviceSession)
7. **Broadcast** - Emit events for real-time updates
8. **Analyze** - Perform deeper analysis (SIM changes, impossible travel, analytics)

## Usage

### Process Telemetry Data

```typescript
import { processTelemetry } from './telemetry/pipeline.js';

const result = await processTelemetry({
  imei: '123456789012345',
  timestamp: new Date(),
  location: {
    lat: -1.2921,
    lng: 36.8219,
    accuracy: 10,
  },
  ipAddress: '192.168.1.1',
  deviceInfo: {
    userAgent: 'Mozilla/5.0...',
    platform: 'Android',
    screenResolution: '1080x1920',
  },
  simInfo: {
    iccid: '89912345678901234567',
    operator: 'Safaricom',
    country: 'Kenya',
  },
  battery: 85,
  signalStrength: -70,
  networkType: '4G',
});

if (result.success) {
  console.log('Telemetry processed successfully:', result.data);
} else {
  console.error('Telemetry processing failed:', result.errors);
}
```

### Pipeline Result

```typescript
interface PipelineResult {
  success: boolean;
  data?: any;
  errors?: string[];
  stage?: string; // Which stage failed
}
```

### Telemetry Data Structure

```typescript
interface TelemetryData {
  imei: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  ipAddress?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    screenResolution?: string;
  };
  simInfo?: {
    iccid?: string;
    operator?: string;
    country?: string;
  };
  battery?: number;
  signalStrength?: number;
  networkType?: string;
}
```

## Deduplication

The pipeline uses a time-based deduplication window (default: 60 seconds) to prevent processing duplicate telemetry data from the same device within the same window.

## Enrichment

The pipeline enriches telemetry data with:
- **Geolocation**: Country, city, region from coordinates
- **IP Information**: Country, city, ISP from IP address
- **Device Fingerprint**: Hash of device characteristics

## Scoring

The pipeline calculates:
- **Risk Score**: Overall risk assessment using the risk engine
- **Anti-Spoofing**: Detection of fake GPS, emulator, rooted device, VPN/proxy
- **Threat Level**: LOW, MEDIUM, HIGH, CRITICAL

## Storage

The pipeline stores data in:
- **TrackingEvent**: Complete telemetry event with all enriched data
- **DeviceLocation**: Location history for map visualization
- **DeviceSession**: Session tracking for movement analysis

## Events

The pipeline emits events:
- `location.detected` - New location detected
- `risk.calculated` - Risk assessment completed
- `device.detected` - Device detected
- `sim.changed` - SIM card changed
- `risk.high` - High risk detected (e.g., impossible travel)

## Analysis

The pipeline performs async analysis:
- **SIM Change Detection**: Compare current SIM with previous
- **Impossible Travel**: Detect unrealistic movement speeds
- **Analytics Update**: Update counters and location data

## Best Practices

1. **Batch Processing**: Process telemetry in batches for efficiency
2. **Error Handling**: Always check pipeline result for errors
3. **Event Monitoring**: Listen to pipeline events for real-time updates
4. **Deduplication**: Adjust deduplication window based on your use case
5. **Async Analysis**: Analysis stage is async and doesn't block the pipeline
