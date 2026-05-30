// Security Middleware - API Key Rotation and Enhanced Security
import crypto from 'crypto';

// API Key Management
class APIKeyManager {
  constructor() {
    this.keys = new Map();
    this.rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  generateKey(prefix = 'sk') {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${timestamp}_${randomBytes}`;
  }

  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  validateKey(key, storedHash) {
    const keyHash = this.hashKey(key);
    return keyHash === storedHash;
  }

  rotateKey(oldKey) {
    const newKey = this.generateKey();
    const newHash = this.hashKey(newKey);
    return { newKey, newHash };
  }
}

const apiKeyManager = new APIKeyManager();

// Request Signing Middleware
export function requireSignedRequest(req, res, next) {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const apiKey = req.headers['x-api-key'];

  if (!signature || !timestamp || !apiKey) {
    return res.status(401).json({ error: 'Missing required security headers' });
  }

  // Check timestamp (prevent replay attacks - 5 minute window)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Request timestamp too old' });
  }

  // Verify signature
  const payload = `${req.method}${req.path}${timestamp}${JSON.stringify(req.body)}`;
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}

// IP Whitelist Middleware
export function requireIPWhitelist(whitelistedIPs) {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!whitelistedIPs.includes(clientIP)) {
      return res.status(403).json({ error: 'IP not whitelisted' });
    }

    next();
  };
}

// Rate Limit by API Key
export function createAPIKeyRateLimit(limiter) {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (apiKey) {
      // Use API key as identifier for rate limiting
      req.rateLimitKey = apiKey;
    }
    
    next();
  };
}

// Export API key manager for use in other modules
export { apiKeyManager };
