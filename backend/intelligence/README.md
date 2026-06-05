# Cyber Intelligence Layer

Cyber intelligence capabilities including threat intelligence, malicious IPs, proxy networks, fraud sources, and attack patterns.

## Features

- **Threat Intelligence**: Track malicious IPs, domains, URLs, hashes, and emails
- **Malicious IP Detection**: Check if IPs are known malicious or from proxy networks
- **Proxy Network Detection**: Detect VPN, Tor, proxy, datacenter, and residential proxy networks
- **Fraud Source Tracking**: Track stolen cards, account takeovers, identity theft, and device theft
- **Attack Pattern Detection**: Detect attack patterns from indicators
- **CIDR Range Matching**: Check IPs against CIDR ranges
- **Statistics**: Track threat intelligence statistics

## Usage

### Add Threat Intelligence

```typescript
import { addThreatIntel } from './intelligence/index.js';

const threat = addThreatIntel({
  type: 'ip',
  value: '192.168.1.100',
  threatType: 'botnet',
  severity: 'high',
  source: 'internal honeypot',
  confidence: 0.9,
  metadata: {
    botnetName: 'Mirai',
    c2Server: '192.168.1.1',
  },
});
```

### Check Malicious IP

```typescript
import { isMaliciousIP } from './intelligence/index.js';

const result = isMaliciousIP('192.168.1.100');

if (result.isMalicious) {
  console.log('Malicious IP detected:', result.threat);
  // Take appropriate action
}
```

### Add Proxy Network

```typescript
import { addProxyNetwork } from './intelligence/index.js';

const network = addProxyNetwork({
  name: 'Tor Exit Nodes',
  type: 'tor',
  ipRanges: ['103.0.0.0/8', '185.0.0.0/8'],
  riskScore: 90,
});
```

### Add Fraud Source

```typescript
import { addFraudSource } from './intelligence/index.js';

const fraudSource = addFraudSource({
  source: 'dark_web_forum',
  type: 'stolen_card',
  indicators: ['card_1234', 'card_5678', 'card_9012'],
  confidence: 0.85,
});
```

### Check Fraud Indicators

```typescript
import { checkFraudIndicators } from './intelligence/index.js';

const matches = checkFraudIndicators(['card_1234', 'imei_5678']);

for (const match of matches) {
  console.log('Fraud source match:', match.source);
  console.log('Type:', match.type);
  console.log('Confidence:', match.confidence);
}
```

### Add Attack Pattern

```typescript
import { addAttackPattern } from './intelligence/index.js';

const pattern = addAttackPattern({
  name: 'SIM Swap Attack',
  description: 'Attackers port a victim phone number to a SIM card they control',
  tactics: ['Initial Access', 'Persistence'],
  techniques: ['SIM Porting', 'Social Engineering'],
  indicators: ['sim_change', 'account_takeover', 'unusual_location'],
  severity: 'high',
  mitigation: ['Multi-factor authentication', 'SIM port protection'],
});
```

### Detect Attack Pattern

```typescript
import { detectAttackPattern } from './intelligence/index.js';

const indicators = ['sim_change', 'account_takeover'];
const patterns = detectAttackPattern(indicators);

for (const pattern of patterns) {
  console.log('Attack pattern detected:', pattern.name);
  console.log('Severity:', pattern.severity);
  console.log('Mitigation:', pattern.mitigation);
}
```

### Get Statistics

```typescript
import { getCyberIntelligenceStatistics } from './intelligence/index.js';

const stats = getCyberIntelligenceStatistics();
console.log('Total threat intel:', stats.totalThreatIntel);
console.log('By type:', stats.threatsByType);
console.log('By severity:', stats.threatsBySeverity);
```

## Data Structures

### ThreatIntelligence

```typescript
interface ThreatIntelligence {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  value: string;
  threatType: 'malware' | 'phishing' | 'botnet' | 'proxy' | 'vpn' | 'tor' | 'fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
  metadata?: Record<string, any>;
}
```

### ProxyNetwork

```typescript
interface ProxyNetwork {
  id: string;
  name: string;
  type: 'vpn' | 'tor' | 'proxy' | 'datacenter' | 'residential';
  ipRanges: string[];
  riskScore: number;
  lastUpdated: Date;
}
```

### FraudSource

```typescript
interface FraudSource {
  id: string;
  source: string;
  type: 'stolen_card' | 'account_takeover' | 'identity_theft' | 'device_theft';
  indicators: string[];
  confidence: number;
  lastReported: Date;
}
```

### AttackPattern

```typescript
interface AttackPattern {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  techniques: string[];
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string[];
}
```

## Algorithms

### CIDR Range Matching

Checks if an IP is within a CIDR range:

- Converts IP to 32-bit number
- Applies subnet mask
- Compares network portions

### Attack Pattern Detection

Matches indicators to attack patterns:

- Requires 50% or more indicators to match
- Sorts by severity (critical first)
- Returns all matching patterns

### Fraud Indicator Matching

Matches indicators to fraud sources:

- Exact match on indicators
- Returns all matching sources
- Includes confidence scores

## Production Integration

### Threat Intelligence Feeds

Integrate with threat intelligence feeds:

```typescript
async function syncWithThreatFeed(feedUrl: string) {
  const response = await fetch(feedUrl);
  const threats = await response.json();

  for (const threat of threats) {
    addThreatIntel({
      type: threat.type,
      value: threat.value,
      threatType: threat.threat_type,
      severity: threat.severity,
      source: feedUrl,
      confidence: threat.confidence,
    });
  }
}
```

### AbuseIPDB Integration

```typescript
async function checkAbuseIPDB(ip: string, apiKey: string) {
  const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
    headers: { 'Key': apiKey },
  });

  const data = await response.json();

  if (data.data.abuseConfidenceScore > 50) {
    addThreatIntel({
      type: 'ip',
      value: ip,
      threatType: 'malware',
      severity: data.data.abuseConfidenceScore > 75 ? 'high' : 'medium',
      source: 'abuseipdb',
      confidence: data.data.abuseConfidenceScore / 100,
    });
  }
}
```

### VirusTotal Integration

```typescript
async function checkVirusTotal(resource: string, apiKey: string) {
  const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${resource}`, {
    headers: { 'x-apikey': apiKey },
  });

  const data = await response.json();

  if (data.data.attributes.last_analysis_stats.malicious > 0) {
    addThreatIntel({
      type: 'ip',
      value: resource,
      threatType: 'malware',
      severity: 'high',
      source: 'virustotal',
      confidence: data.data.attributes.reputation / 100,
    });
  }
}
```

## Best Practices

1. **Regular Updates**: Regularly update threat intelligence feeds
2. **Multiple Sources**: Use multiple threat intelligence sources
4. **Confidence Scoring**: Use confidence scores to prioritize threats
5. **False Positives**: Handle false positives appropriately
6. **Data Retention**: Follow data retention policies
7. **Privacy**: Respect privacy regulations

## Performance Considerations

1. **In-Memory Storage**: Current implementation is in-memory
2. **Batch Operations**: Batch threat intel updates
3. **Caching**: Cache threat intelligence results
4. **Async Processing**: Use async processing for feed syncs
5. **Database**: Use database for production persistence

## Future Enhancements

- Add database persistence for threat intelligence
- Integrate with more threat intelligence feeds
- Implement machine learning for threat detection
- Add real-time threat intelligence updates
- Implement threat intelligence sharing
- Add automated response to threats
- Implement threat hunting capabilities
