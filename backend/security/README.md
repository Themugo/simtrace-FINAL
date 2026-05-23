# Security Module

Advanced security features for the SimTrace platform.

## Features

### Device Fingerprinting
- Generate unique device fingerprints from browser and hardware data
- Compare fingerprints to detect anomalies
- Detect suspicious changes (IP, user agent, timezone, platform)
- Parse user agent for device info

### Threat Detection
- Track failed login attempts
- Block IP addresses
- Rate limiting per IP
- Detect suspicious sessions (unusual locations)
- Log threat events

### Secrets Management
- Encrypt/decrypt secrets
- Get secrets from environment variables
- Generate random secrets
- Hash secrets for verification
- Generate and validate API keys

## Usage

### Device Fingerprinting

```typescript
import { generateFingerprint, compareFingerprints, detectFingerprintAnomaly } from './security/index.js';

// Generate fingerprint
const fingerprint = generateFingerprint({
  browser: {
    userAgent: req.headers['user-agent'],
    language: req.headers['accept-language'],
    platform: req.headers['sec-ch-ua-platform'],
    screenResolution: '1920x1080',
    colorDepth: 24,
    timezone: 'Africa/Nairobi',
  },
  network: {
    ip: req.ip,
  },
});

// Compare fingerprints
const similarity = compareFingerprints(fp1, fp2);

// Detect anomalies
const anomaly = detectFingerprintAnomaly(currentFingerprint, previousFingerprint);
if (anomaly.isAnomaly) {
  console.log('Suspicious activity detected:', anomaly.reasons);
}
```

### Threat Detection

```typescript
import { threatDetector, checkThreat, recordFailedLogin } from './security/index.js';

// Check if request is from a threat
const threatCheck = await checkThreat(req.ip, req.user?.id);
if (threatCheck.blocked) {
  return res.status(429).json({ error: threatCheck.reason });
}

// Record failed login attempt
const shouldBlock = await recordFailedLogin(req.ip, req.user?.id);
if (shouldBlock) {
  // IP has been blocked
}

// Log threat event
await threatDetector.logThreatEvent({
  type: 'brute_force',
  severity: 'high',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
  details: { userId: req.user?.id },
});

// Get recent threat events
const events = await threatDetector.getThreatEvents('brute_force', 50);
```

### Secrets Management

```typescript
import { secretsManager, getDatabaseURL, generateAPIKey } from './security/index.js';

// Get secret from environment
const dbUrl = getDatabaseURL();

// Encrypt a secret
const encrypted = secretsManager.setSecret('my-secret-password');

// Decrypt a secret
const decrypted = secretsManager.decrypt(encrypted);

// Generate API key
const apiKey = secretsManager.generateAPIKey('sk');

// Validate API key
const isValid = secretsManager.validateAPIKey(apiKey, 'sk');

// Hash a secret
const hash = secretsManager.hashSecret('password123');

// Verify secret
const isValid = secretsManager.verifySecret('password123', hash);
```

### Zero-Trust Security Model

```typescript
import { evaluateSecurityContext, addTrustedDevice, addTrustedLocation } from './security/index.js';

// Evaluate security context
const decision = evaluateSecurityContext({
  userId: 'user123',
  deviceId: 'device456',
  ip: '192.168.1.1',
  location: { lat: -1.2921, lng: 36.8219 },
  userAgent: 'Mozilla/5.0...',
  timestamp: new Date(),
});

if (!decision.allowed) {
  // Deny access
  return res.status(403).json({ error: decision.reason });
}

if (decision.requiredActions.length > 0) {
  // Require additional verification
  if (decision.requiredActions.includes('mfa_verify')) {
    // Require MFA
  }
}

// Add trusted device
addTrustedDevice('device456');

// Add trusted location
addTrustedLocation(-1.2921, 36.8219);

// Get anomalies
const anomalies = getAllAnomalies(20);
console.log('Security anomalies:', anomalies);
```

## Security Best Practices

1. **Always use HTTPS** in production
2. **Rotate secrets regularly** (every 90 days)
3. **Use environment variables** for sensitive data
4. **Implement rate limiting** on all endpoints
5. **Monitor threat events** and set up alerts
6. **Use strong encryption** (AES-256-GCM)
7. **Never log secrets** or sensitive data
8. **Implement IP whitelisting** for admin endpoints
9. **Use WAF** (Cloudflare, AWS WAF) for additional protection
10. **Regular security audits** and penetration testing

## Zero-Trust Principles

- **Never trust, always verify**: Verify every request regardless of source
- **Least privilege access**: Grant minimum necessary permissions
- **Continuous monitoring**: Monitor all access patterns and anomalies
- **Device trust**: Maintain trusted device lists
- **Location trust**: Maintain trusted location lists
- **Risk-based authentication**: Require additional verification based on risk
- **Session anomaly detection**: Detect unusual session patterns
- **Impossible travel detection**: Flag impossible travel scenarios
