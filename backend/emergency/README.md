# Public Safety & Emergency Mode

Public safety and emergency mode including emergency workflows, rapid alerts, missing persons, and stolen shipment tracking.

## Features

- **Emergency Workflows**: Create and manage emergency workflows with status tracking
- **Missing Person Reports**: Report and track missing persons with detailed information
- **Stolen Shipment Reports**: Report and track stolen shipments
- **Rapid Alerts**: Send rapid alerts to public, authorities, partners
- **Geospatial Search**: Find nearby emergency workflows
- **Note System**: Add notes to workflows for collaboration
- **Alert System**: Send SMS, email, push, and broadcast alerts
- **Priority Levels**: Support for low, medium, high, and critical priorities

## Usage

### Create Emergency Workflow

```typescript
import { createEmergencyWorkflow } from './emergency/index.js';

const workflow = createEmergencyWorkflow({
  type: 'missing_person',
  status: 'active',
  priority: 'critical',
  title: 'Missing Child - Nairobi',
  description: 'Child missing from Westlands area',
  deviceId: 'device_123',
  userId: 'user_456',
  location: { lat: -1.2921, lng: 36.8219 },
});
```

### Update Workflow Status

```typescript
import { updateWorkflowStatus } from './emergency/index.js';

const updated = updateWorkflowStatus('workflow_id', 'investigating', 'officer_smith');
```

### Add Workflow Note

```typescript
import { addWorkflowNote } from './emergency/index.js';

const note = addWorkflowNote('workflow_id', 'officer_smith', 'Search team dispatched to location');
```

### Add Workflow Alert

```typescript
import { addWorkflowAlert } from './emergency/index.js';

const alert = addWorkflowAlert('workflow_id', {
  type: 'sms',
  recipient: '+254712345678',
  message: 'Emergency: Missing child in your area. Please report any sightings.',
});
```

### Create Missing Person Report

```typescript
import { createMissingPersonReport } from './emergency/index.js';

const report = createMissingPersonReport({
  workflowId: 'workflow_id',
  personName: 'John Doe',
  personAge: 10,
  personDescription: 'Height 4ft, wearing blue t-shirt',
  lastSeenLocation: { lat: -1.2921, lng: 36.8219, address: 'Westlands Mall' },
  lastSeenTime: new Date(),
  deviceId: 'device_123',
  clothingDescription: 'Blue t-shirt, black shorts',
  medicalConditions: 'Asthma',
  emergencyContact: { name: 'Jane Doe', phone: '+254712345678', relation: 'Mother' },
  photoUrl: 'https://example.com/photo.jpg',
  status: 'active',
});
```

### Update Missing Person Status

```typescript
import { updateMissingPersonStatus } from './emergency/index.js';

const updated = updateMissingPersonStatus('report_id', 'found');
```

### Create Stolen Shipment Report

```typescript
import { createStolenShipmentReport } from './emergency/index.js';

const report = createStolenShipmentReport({
  workflowId: 'workflow_id',
  shipmentId: 'SHIP-12345',
  shipmentType: 'Electronics',
  contents: 'Laptops, smartphones',
  value: 500000,
  lastKnownLocation: { lat: -1.2921, lng: 36.8219, address: 'Industrial Area' },
  lastKnownTime: new Date(),
  deviceId: 'device_456',
  vehicleDescription: 'White Toyota van',
  licensePlate: 'KCB 123A',
  reportingCompany: 'Tech Corp Ltd',
  contactPerson: { name: 'John Smith', phone: '+254712345678', email: 'john@techcorp.com' },
  status: 'active',
});
```

### Update Stolen Shipment Status

```typescript
import { updateStolenShipmentStatus } from './emergency/index.js';

const updated = updateStolenShipmentStatus('report_id', 'recovered');
```

### Create Rapid Alert

```typescript
import { createRapidAlert } from './emergency/index.js';

const alert = createRapidAlert({
  workflowId: 'workflow_id',
  alertType: 'amber',
  radius: 50, // 50km
  centerLocation: { lat: -1.2921, lng: 36.8219 },
  message: 'AMBER ALERT: Missing child in Nairobi area',
  targetAudience: 'public',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  recipients: 0,
});
```

### Find Nearby Workflows

```typescript
import { findNearbyWorkflows } from './emergency/index.js';

const nearby = findNearbyWorkflows({ lat: -1.2921, lng: 36.8219 }, 10); // 10km radius
console.log('Nearby emergencies:', nearby);
```

### Get Statistics

```typescript
import { getEmergencyStatistics } from './emergency/index.js';

const stats = getEmergencyStatistics();
console.log('Total workflows:', stats.totalWorkflows);
console.log('Active workflows:', stats.activeWorkflows);
console.log('By type:', stats.byType);
console.log('By status:', stats.byStatus);
console.log('By priority:', stats.byPriority);
```

## Data Structures

### EmergencyWorkflow

```typescript
interface EmergencyWorkflow {
  id: string;
  type: 'missing_person' | 'stolen_shipment' | 'emergency_alert' | 'disaster_response';
  status: 'active' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  deviceId?: string;
  userId?: string;
  location?: { lat: number; lng: number };
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  notes: EmergencyNote[];
  alerts: EmergencyAlert[];
}
```

### MissingPersonReport

```typescript
interface MissingPersonReport {
  id: string;
  workflowId: string;
  personName: string;
  personAge?: number;
  personDescription: string;
  lastSeenLocation: { lat: number; lng: number; address?: string };
  lastSeenTime: Date;
  deviceId?: string;
  clothingDescription?: string;
  medicalConditions?: string;
  emergencyContact: { name: string; phone: string; relation: string };
  photoUrl?: string;
  status: 'active' | 'found' | 'cancelled';
  createdAt: Date;
}
```

### StolenShipmentReport

```typescript
interface StolenShipmentReport {
  id: string;
  workflowId: string;
  shipmentId: string;
  shipmentType: string;
  contents: string;
  value: number;
  lastKnownLocation: { lat: number; lng: number; address?: string };
  lastKnownTime: Date;
  deviceId?: string;
  vehicleDescription?: string;
  licensePlate?: string;
  reportingCompany: string;
  contactPerson: { name: string; phone: string; email: string };
  status: 'active' | 'recovered' | 'cancelled';
  createdAt: Date;
}
```

### RapidAlert

```typescript
interface RapidAlert {
  id: string;
  workflowId: string;
  alertType: 'amber' | 'silver' | 'red' | 'custom';
  radius: number;
  centerLocation: { lat: number; lng: number };
  message: string;
  targetAudience: 'public' | 'authorities' | 'partners' | 'all';
  sentAt: Date;
  expiresAt: Date;
  recipients: number;
}
```

## Alert Types

### Amber Alert
- Used for missing children
- High priority, immediate public notification
- Typically 24-hour duration

### Silver Alert
- Used for missing elderly or vulnerable adults
- Medium priority
- Typically 48-hour duration

### Red Alert
- Used for critical emergencies
- Highest priority
- Immediate notification to all channels

### Custom Alert
- Organization-specific alerts
- Configurable priority and duration

## Geospatial Search

Uses the Haversine formula to calculate distances between points:

- Returns workflows within specified radius
- Sorted by distance (nearest first)
- Supports radius in kilometers

## Production Integration

### SMS Gateway Integration

```typescript
async function sendSMS(recipient: string, message: string) {
  // Integrate with SMS gateway (e.g., Twilio, Africa's Talking)
  await smsGateway.send({
    to: recipient,
    message: message,
  });
}
```

### Email Gateway Integration

```typescript
async function sendEmail(recipient: string, subject: string, body: string) {
  // Integrate with email service (e.g., SendGrid, AWS SES)
  await emailService.send({
    to: recipient,
    subject: subject,
    html: body,
  });
}
```

### Push Notification Integration

```typescript
async function sendPushNotification(userId: string, message: string) {
  // Integrate with push service (e.g., Firebase, OneSignal)
  await pushService.send({
    userId: userId,
    title: 'Emergency Alert',
    body: message,
  });
}
```

### Broadcast Integration

```typescript
async function sendBroadcast(location: { lat: number; lng: number }, radius: number, message: string) {
  // Send to all users in area
  const users = await getUsersInArea(location, radius);
  for (const user of users) {
    await sendPushNotification(user.id, message);
  }
}
```

## Best Practices

1. **Priority Levels**: Use appropriate priority levels for emergencies
2. **Location Accuracy**: Provide accurate location data
3. **Contact Information**: Always include emergency contact information
4. **Status Updates**: Regularly update workflow status
5. **Note Taking**: Document all actions and observations
6. **Alert Targeting**: Target alerts to appropriate audiences
7. **Expiration**: Set appropriate expiration times for alerts

## Performance Considerations

1. **Geospatial Queries**: Use spatial indexing for production
2. **Alert Batching**: Batch alert sends for efficiency
3. **Database**: Use database for persistence
4. **Caching**: Cache frequently accessed workflows
5. **Async Operations**: Use async for alert sending

## Future Enhancements

- Add database persistence for all data
- Implement real-time location tracking
- Add integration with emergency services (911, 999)
- Implement alert escalation rules
- Add multi-language support for alerts
- Implement alert acknowledgment system
- Add analytics for alert effectiveness
