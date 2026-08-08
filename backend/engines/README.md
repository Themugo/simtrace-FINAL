# Core Engines Module

Four production-grade intelligence engines coordinated by an intelligence broker pattern for stakeholder-specific intelligence delivery.

## Architecture

### Four Core Engines

1. **Device Intelligence Engine** (`device-intelligence-engine.ts`)
   - Wraps existing digital twin functionality
   - Analyzes movement patterns, known locations, behavior profiles
   - Generates predictions for next location and risk trends
   - Calculates recovery likelihood

2. **Risk Scoring Engine** (`risk-scoring-engine.ts`)
   - Wraps existing risk scoring functionality
   - Computes overall risk scores (0-100)
   - Provides risk factors with weights
   - Generates risk history and recommendations
   - Maintains backward compatibility with legacy `computeRiskScore`

3. **Fraud Detection Engine** (`fraud-detection-engine.ts`)
   - Detects fraud indicators and attack patterns
   - Integrates with cyber intelligence threat database
   - Checks against threat intelligence (malicious IPs, fraud sources)
   - Provides fraud recommendations and mitigation strategies

4. **Recovery & Alert Engine** (`recovery-alert-engine.ts`)
   - Wraps existing notification functionality
   - Sends alerts via multiple channels (SMS, email, push, in-app)
   - Triggers recovery actions (remote lock, wipe, tracking, blacklist)
   - Manages recovery status and next steps
   - Maintains backward compatibility with legacy `sendAlert`

### Intelligence Broker

The **Intelligence Broker** (`intelligence-broker.ts`) coordinates between the four engines and provides:

- **Multi-engine analysis**: Run all engines in parallel for comprehensive device analysis
- **Stakeholder-specific routing**: Deliver tailored intelligence to different stakeholders
- **Event emission**: Emit events for risk thresholds, fraud detection, anomalies
- **Engine registration**: Dynamic engine registration and coordination

## Stakeholders

The broker provides stakeholder-specific intelligence:

- **Device Owners**: Movement patterns, known locations, recovery likelihood, risk scores, fraud alerts
- **Telecom Operators**: Risk factors, SIM swaps, carrier hops, network data, fraud indicators
- **Law Enforcement**: Full device intelligence, risk history, fraud evidence, investigation priority
- **Internal Admins**: Complete system view including all engines, processing metrics, event history

## API Endpoints

### Multi-Engine Analysis

```http
POST /api/intelligence-broker/analyze
Content-Type: application/json

{
  "imei": "123456789012345"
}
```

Returns combined analysis from all four engines.

### Stakeholder-Specific Intelligence

```http
GET /api/intelligence-broker/stakeholder/:stakeholder/:imei
```

Returns intelligence tailored to the specific stakeholder.

### Individual Engine Endpoints

```http
POST /api/intelligence-broker/device-intelligence
POST /api/intelligence-broker/risk-scoring
POST /api/intelligence-broker/fraud-detection
POST /api/intelligence-broker/recovery-alert
```

Each endpoint accepts engine-specific input parameters.

### Recovery Actions

```http
POST /api/intelligence-broker/recovery-actions/:imei
GET /api/intelligence-broker/recovery-status/:imei
```

Trigger and monitor recovery actions.

## Usage Examples

### Using the Intelligence Broker

```typescript
import { intelligenceBroker, IntelligenceContext } from './engines/index.js';

// Multi-engine analysis
const analysis = await intelligenceBroker.analyzeDevice(imei, {
  imei,
  stakeholder: 'device_owner',
  userId: 'user123',
  timestamp: new Date(),
});

// Stakeholder-specific intelligence
const telecomIntel = await intelligenceBroker.getIntelligenceForStakeholder(
  'telecom_operator',
  imei,
  context
);

// Individual engine coordination
const result = await intelligenceBroker.coordinate({
  type: 'risk_scoring',
  input: { imei, includeFactors: true },
  context,
});
```

### Using Individual Engines

```typescript
import { 
  deviceIntelligenceEngine,
  riskScoringEngine,
  fraudDetectionEngine,
  recoveryAlertEngine
} from './engines/index.js';

// Device intelligence
const deviceIntel = await deviceIntelligenceEngine.analyze(
  { imei, includePredictions: true },
  context
);

// Risk scoring
const riskScore = await riskScoringEngine.computeScore(
  { imei, includeFactors: true, includeHistory: true },
  context
);

// Fraud detection
const fraudResult = await fraudDetectionEngine.detect(
  { imei, includeThreatIntel: true },
  context
);

// Recovery alert
const alertResult = await recoveryAlertEngine.sendAlert(
  {
    imei,
    alertType: 'theft_report',
    severity: 'critical',
    message: 'Device reported stolen',
  },
  context
);
```

### Event Handling

```typescript
import { intelligenceBroker } from './engines/index.js';

// Subscribe to events
intelligenceBroker.on('risk_threshold_exceeded', (event) => {
  console.log('Risk threshold exceeded:', event);
});

intelligenceBroker.on('fraud_detected', (event) => {
  console.log('Fraud detected:', event);
});

intelligenceBroker.on('anomaly_detected', (event) => {
  console.log('Anomaly detected:', event);
});
```

## Backward Compatibility

All engines maintain backward compatibility with existing implementations:

- `deviceIntelligenceEngine` wraps existing `getDeviceDigitalTwin`
- `riskScoringEngine` wraps existing `computeRiskScore`
- `fraudDetectionEngine` wraps existing `runIntelligence` and cyber intelligence
- `recoveryAlertEngine` wraps existing `sendAlert`

Existing code continues to work without modification. The new engines provide a standardized interface for future development.

## Performance

- **Parallel execution**: Multi-engine analysis runs all engines in parallel
- **Caching**: Digital twin cached for 1 hour
- **Efficient queries**: Limited result sets with proper indexing
- **Event-driven**: Asynchronous event emission for non-blocking operations

## Security

- **Authentication**: All endpoints require authentication
- **Authorization**: Stakeholder-specific access control
- **Input validation**: Zod schema validation on all inputs
- **Rate limiting**: Applied via middleware

## Future Enhancements

- Add database persistence for event history
- Implement WebSocket for real-time event streaming
- Add ML model integration for enhanced predictions
- Implement engine health monitoring
- Add performance metrics and tracing
- Support for custom engine registration
- Multi-region deployment support
