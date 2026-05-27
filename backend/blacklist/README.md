# National Blacklist Network

Shared intelligence network for stolen device data, IMEI verification, and fraud cross-check.

## Features

- **Device Blacklisting**: Add and remove devices from the blacklist
- **IMEI Verification**: Check if a device is blacklisted
- **Batch Checking**: Check multiple IMEIs at once
- **Partner Integration**: Sync with partner blacklists
- **Fraud Cross-Check**: Detect fraud patterns and related devices
- **Statistics**: Track blacklist statistics by status and source

## Usage

### Add Device to Blacklist

```typescript
import { addToBlacklist } from './blacklist/index.js';

addToBlacklist({
  imei: '123456789012345',
  iccid: '89912345678901234567',
  status: 'stolen',
  reportedBy: 'user123',
  reportedAt: new Date(),
  location: { lat: -1.2921, lng: 36.8219 },
  notes: 'Device stolen from Nairobi CBD',
  source: 'internal',
});
```

### Check Blacklist

```typescript
import { checkBlacklist } from './blacklist/index.js';

const result = checkBlacklist('123456789012345');

if (result.isBlacklisted) {
  console.log('Device is blacklisted:', result.status);
  console.log('Reported by:', result.sources);
  console.log('Last reported:', result.lastReported);
}
```

### Batch Check Blacklist

```typescript
import { batchCheckBlacklist } from './blacklist/index.js';

const imeis = ['123456789012345', '987654321098765', '555555555555555'];
const results = batchCheckBlacklist(imeis);

for (const [imei, result] of results) {
  console.log(`${imei}: ${result.isBlacklisted ? 'BLACKLISTED' : 'CLEAN'}`);
}
```

### Fraud Cross-Check

```typescript
import { crossCheckFraud } from './blacklist/index.js';

const fraudCheck = crossCheckFraud('123456789012345');

if (fraudCheck.fraudDetected) {
  console.log('Fraud detected:', fraudCheck.fraudTypes);
  console.log('Related devices:', fraudCheck.relatedDevices);
  console.log('Risk score:', fraudCheck.riskScore);
}
```

### Get Blacklisted Devices

```typescript
import { getBlacklistedDevices } from './blacklist/index.js';

// Get all blacklisted devices
const allDevices = getBlacklistedDevices();

// Get devices from specific source
const telecomDevices = getBlacklistedDevices('telecom');
```

### Get Statistics

```typescript
import { getBlacklistStatistics } from './blacklist/index.js';

const stats = getBlacklistStatistics();
console.log('Total blacklisted:', stats.totalBlacklisted);
console.log('By status:', stats.byStatus);
console.log('By source:', stats.bySource);
console.log('Recent reports:', stats.recentReports);
```

### Sync with Partner

```typescript
import { syncWithPartner } from './blacklist/index.js';

await syncWithPartner('safaricom', 'https://api.safaricom.com/blacklist');
```

## Blacklist Entry Structure

```typescript
interface BlacklistEntry {
  imei: string;
  iccid?: string;
  status: 'stolen' | 'lost' | 'fraud' | 'blacklisted';
  reportedBy: string;
  reportedAt: Date;
  lastSeen?: Date;
  location?: { lat: number; lng: number };
  notes?: string;
  source: 'internal' | 'telecom' | 'police' | 'insurance' | 'partner';
}
```

## Check Result Structure

```typescript
interface BlacklistCheckResult {
  imei: string;
  isBlacklisted: boolean;
  status?: string;
  sources: string[];
  lastReported?: Date;
  confidence: number;
}
```

## Fraud Cross-Check Structure

```typescript
interface FraudCrossCheckResult {
  imei: string;
  fraudDetected: boolean;
  fraudTypes: string[];
  relatedDevices: string[];
  riskScore: number;
}
```

## Partner Integration

The blacklist network supports syncing with partner networks:

- Telecom operators (Safaricom, Airtel, Telkom)
- Police databases
- Insurance companies
- Other tracking platforms

## Fraud Detection

The fraud cross-check detects:

- Known fraud devices
- Stolen devices
- Related devices (same reporter, same location)
- Risk score calculation

## Best Practices

1. **Regular Sync**: Sync with partner networks regularly
2. **Data Validation**: Validate IMEI format before adding to blacklist
3. **Source Tracking**: Always track the source of blacklist entries
4. **Regular Cleanup**: Clear old data periodically
5. **Privacy**: Handle personal data according to privacy regulations

## Performance Considerations

1. **In-Memory Storage**: Blacklist is stored in memory for fast access
2. **Batch Operations**: Use batch checking for multiple IMEIs
3. **Caching**: Fraud cross-check results are cached
4. **Partner Sync**: Sync partner blacklists asynchronously
5. **Data Retention**: Clear old data to prevent memory issues

## Future Enhancements

- Add database persistence
- Implement distributed blacklist with Redis
- Add API endpoints for partner integration
- Implement webhook notifications for new blacklist entries
- Add geographic blacklist regions
- Implement blacklist sharing agreements
