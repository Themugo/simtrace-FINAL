# Compliance Foundation

Compliance foundation for GDPR, Kenya Data Protection Act, SOC2, ISO27001, consent tracking, and data retention.

## Features

- **Consent Management**: Record and track user consents
- **Data Retention Policies**: Define and manage data retention policies
- **Data Subject Requests**: Handle GDPR data subject requests (access, deletion, portability)
- **Audit Logging**: Comprehensive audit trail for compliance
- **Data Mapping**: Map data fields to sensitivity and processing purposes
- **Compliance Frameworks**: Support for GDPR, KDPA, SOC2, ISO27001
- **Retention Processing**: Automated data retention processing

## Usage

### Record Consent

```typescript
import { recordConsent } from './compliance/index.js';

const consent = recordConsent({
  userId: 'user_123',
  type: 'data_processing',
  purpose: 'Device tracking and analytics',
  granted: true,
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  documentVersion: '1.0',
});
```

### Revoke Consent

```typescript
import { revokeConsent } from './compliance/index.js';

const revoked = revokeConsent('consent_id', '192.168.1.100');
```

### Check Consent

```typescript
import { hasConsent } from './compliance/index.js';

const hasDataProcessingConsent = hasConsent('user_123', 'data_processing');
if (hasDataProcessingConsent) {
  // Process user data
}
```

### Create Retention Policy

```typescript
import { createRetentionPolicy } from './compliance/index.js';

const policy = createRetentionPolicy({
  dataType: 'device_telemetry',
  retentionPeriod: 365, // days
  retentionReason: 'Operational needs',
  legalBasis: 'Legitimate interest',
  deletionMethod: 'anonymize',
  complianceFramework: 'GDPR',
  enabled: true,
});
```

### Create Data Subject Request

```typescript
import { createDataSubjectRequest } from './compliance/index.js';

const dsr = createDataSubjectRequest({
  userId: 'user_123',
  type: 'deletion',
  notes: 'User requested account deletion',
});
```

### Update DSR Status

```typescript
import { updateDSRStatus } from './compliance/index.js';

const updated = updateDSRStatus(
  'dsr_id',
  'completed',
  'admin_456',
  'All user data deleted',
  'https://example.com/export.zip'
);
```

### Get Audit Logs

```typescript
import { getComplianceAuditLogs } from './compliance/index.js';

const logs = getComplianceAuditLogs({
  userId: 'user_123',
  eventType: 'consent_change',
  complianceFramework: 'GDPR',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 100,
});
```

### Process Data Retention

```typescript
import { processDataRetention } from './compliance/index.js';

const result = processDataRetention();
console.log('Deleted:', result.deleted);
console.log('Anonymized:', result.anonymized);
console.log('Soft deleted:', result.softDeleted);
```

### Get Statistics

```typescript
import { getComplianceStatistics } from './compliance/index.js';

const stats = getComplianceStatistics();
console.log('Total consents:', stats.totalConsents);
console.log('Active consents:', stats.activeConsents);
console.log('Total DSRs:', stats.totalDSRs);
console.log('Pending DSRs:', stats.pendingDSRs);
```

## Data Structures

### ConsentRecord

```typescript
interface ConsentRecord {
  id: string;
  userId: string;
  type: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing';
  purpose: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  ipAddress: string;
  userAgent: string;
  documentVersion: string;
}
```

### DataRetentionPolicy

```typescript
interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: number;
  retentionReason: string;
  legalBasis: string;
  deletionMethod: 'soft_delete' | 'hard_delete' | 'anonymize';
  complianceFramework: 'GDPR' | 'KDPA' | 'SOC2' | 'ISO27001' | 'all';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### DataSubjectRequest

```typescript
interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  processedBy?: string;
  notes?: string;
  dataExport?: string;
}
```

## Compliance Frameworks

### GDPR (General Data Protection Regulation)
- Right to access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to object
- Consent management
- Data protection by design

### KDPA (Kenya Data Protection Act)
- Similar to GDPR
- Data controller registration
- Data transfer restrictions
- Data subject rights
- Cross-border data transfers

### SOC2 (Service Organization Control 2)
- Security
- Availability
- Processing integrity
- Confidentiality
- Privacy
- Audit logging

### ISO27001 (Information Security Management)
- Information security policies
- Risk assessment
- Asset management
- Access control
- Cryptography
- Physical security

## Data Subject Request Types

### Access
User requests access to their personal data.

### Deletion
User requests deletion of their personal data (right to be forgotten).

### Portability
User requests their data in a machine-readable format.

### Rectification
User requests correction of inaccurate data.

### Objection
User objects to processing of their data.

## Data Retention Methods

### Soft Delete
Mark data as deleted but keep in database.

### Hard Delete
Permanently remove data from database.

### Anonymize
Remove personally identifiable information while keeping data for analytics.

## Data Sensitivity Levels

### Public
Data that can be freely shared.

### Internal
Data for internal use only.

### Confidential
Data that requires protection.

### Restricted
Highly sensitive data with strict access controls.

## Production Integration

### Express Middleware for Consent

```typescript
import express from 'express';
import { hasConsent } from './compliance/index.js';

function requireConsent(type: ConsentRecord['type']) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!hasConsent(req.user.id, type)) {
      return res.status(403).json({ error: 'Consent required' });
    }

    next();
  };
}

app.get('/api/analytics', requireConsent('analytics'), analyticsHandler);
```

### Scheduled Retention Processing

```typescript
import cron from 'node-cron';
import { processDataRetention } from './compliance/index.js';

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Processing data retention...');
  const result = await processDataRetention();
  console.log('Retention processing complete:', result);
});
```

### Data Export for Portability

```typescript
async function exportUserData(userId: string): Promise<string> {
  const userData = {
    profile: await getUserProfile(userId),
    devices: await getUserDevices(userId),
    activity: await getUserActivity(userId),
  };

  const exportData = JSON.stringify(userData, null, 2);
  const filename = `user_export_${userId}_${Date.now()}.json`;
  
  // Upload to secure storage
  const url = await uploadToSecureStorage(filename, exportData);
  
  return url;
}
```

## Best Practices

1. **Consent**: Always obtain explicit consent before processing personal data
2. **Documentation**: Document all consent and processing activities
3. **Retention**: Set appropriate retention periods based on legal requirements
4. **Audit**: Maintain comprehensive audit logs
5. **DSR Response**: Respond to data subject requests within legal timeframes
6. **Data Minimization**: Collect only necessary data
7. **Security**: Implement appropriate security measures for data sensitivity

## Performance Considerations

1. **Audit Logs**: Archive old audit logs periodically
2. **Consent Checks**: Cache consent checks for performance
3. **Retention Processing**: Process retention in batches
4. **Data Export**: Use streaming for large data exports
5. **Database**: Use indexes for efficient queries

## Future Enhancements

- Add database persistence for all compliance data
- Implement automated DSR processing workflows
- Add consent management UI
- Implement data breach notification system
- Add compliance report generation
- Implement privacy impact assessment tools
