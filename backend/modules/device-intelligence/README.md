# Digital Twin Device Model

Persistent device profiles for predictive AI and anomaly detection.

## Features

- **Risk History**: Track risk scores and threat levels over time
- **Movement Patterns**: Detect commute, random, stationary, or travel patterns
- **Known Locations**: Identify home, work, frequent, and transit locations
- **Behavior Profile**: Analyze activity level, typical day hours, mobility, predictability
- **Recovery Likelihood**: Calculate probability of device recovery

## Usage

### Get Digital Twin

```typescript
import { getDeviceDigitalTwin } from './modules/device-intelligence/index.js';

const twin = await getDeviceDigitalTwin('123456789012345');

console.log('Risk history:', twin.riskHistory);
console.log('Movement patterns:', twin.movementPatterns);
console.log('Known locations:', twin.knownLocations);
console.log('Behavior profile:', twin.behaviorProfile);
console.log('Recovery likelihood:', twin.recoveryLikelihood);
```

### Digital Twin Structure

```typescript
interface DeviceDigitalTwin {
  imei: string;
  riskHistory: RiskHistoryEntry[];
  movementPatterns: MovementPattern[];
  knownLocations: KnownLocation[];
  behaviorProfile: BehaviorProfile;
  recoveryLikelihood: number;
  lastUpdated: Date;
}
```

### Risk History

```typescript
interface RiskHistoryEntry {
  timestamp: Date;
  riskScore: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
}
```

### Movement Patterns

```typescript
interface MovementPattern {
  patternType: 'commute' | 'random' | 'stationary' | 'travel';
  typicalLocations: Array<{ lat: number; lng: number; frequency: number }>;
  typicalTimes: Array<{ hour: number; frequency: number }>;
  averageSpeed: number;
  confidence: number;
}
```

### Known Locations

```typescript
interface KnownLocation {
  lat: number;
  lng: number;
  name?: string;
  type: 'home' | 'work' | 'frequent' | 'transit';
  visitCount: number;
  firstSeen: Date;
  lastSeen: Date;
  avgStayDuration: number;
}
```

### Behavior Profile

```typescript
interface BehaviorProfile {
  activityLevel: 'low' | 'medium' | 'high';
  typicalDayStart: number; // hour
  typicalDayEnd: number; // hour
  mobilityScore: number;
  predictabilityScore: number;
  anomalyCount: number;
}
```

## Pattern Detection

The digital twin automatically detects:
- **Commute patterns**: Regular movement between 2-4 locations
- **Random movement**: Unpredictable movement patterns
- **Stationary**: Device stays in one location
- **Travel**: Long-distance movement

## Location Classification

Locations are automatically classified as:
- **Home**: Visited during evening/night hours
- **Work**: Visited during work hours
- **Frequent**: High visit count
- **Transit**: Temporary stops

## Recovery Likelihood

Calculated based on:
- Recent risk history (higher risk = lower likelihood)
- Behavior predictability (more predictable = higher likelihood)
- Activity level (higher activity = higher likelihood)
- Anomaly count (more anomalies = lower likelihood)

## Caching

Digital twins are cached for 1 hour to improve performance. Use `updateDigitalTwin()` to force a refresh.

## Use Cases

- **Predictive AI**: Feed digital twin data to ML models
- **Anomaly Detection**: Compare current behavior against profile
- **Recovery Prediction**: Estimate recovery probability
- **Investigation**: Understand device behavior patterns
- **Resource Allocation**: Prioritize based on recovery likelihood

## Performance

- Cached for 1 hour
- Built from last 500 locations
- Uses last 100 risk events
- Clusters locations within 100m threshold
