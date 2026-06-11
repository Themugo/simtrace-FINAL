import { getRedisClient } from '../services/redis.js';

// ── Threat Detection ───────────────────────────────────────────────────────────
export interface ThreatEvent {
  type: 'brute_force' | 'credential_stuffing' | 'suspicious_session' | 'unusual_geolocation' | 'rate_limit_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  details: any;
}

export interface ThreatConfig {
  maxFailedAttempts: number;
  failedAttemptWindow: number; // seconds
  maxRequestsPerMinute: number;
  suspiciousLocations: string[];
  blockedIPs: string[];
}

const defaultConfig: ThreatConfig = {
  maxFailedAttempts: 5,
  failedAttemptWindow: 300, // 5 minutes
  maxRequestsPerMinute: 60,
  suspiciousLocations: [],
  blockedIPs: [],
};

class ThreatDetector {
  private config: ThreatConfig = defaultConfig;

  // Track failed login attempts
  async trackFailedAttempt(ipAddress: string, _userId?: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `threat:failed:${ipAddress}`;
    
    const attempts = await redis.incr(key);
    await redis.expire(key, this.config.failedAttemptWindow);
    
    if (attempts >= this.config.maxFailedAttempts) {
      await this.blockIP(ipAddress, 3600); // Block for 1 hour
      return true;
    }
    
    return false;
  }

  // Check if IP is blocked
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    const redis = getRedisClient();
    const isBlocked = await redis.exists(`threat:blocked:${ipAddress}`);
    return isBlocked === 1;
  }

  // Block an IP address
  async blockIP(ipAddress: string, duration: number): Promise<void> {
    const redis = getRedisClient();
    await (redis as any).set(`threat:blocked:${ipAddress}`, '1', { EX: duration });
  }

  // Unblock an IP address
  async unblockIP(ipAddress: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`threat:blocked:${ipAddress}`);
  }

  // Track request rate
  async trackRequestRate(ipAddress: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `threat:rate:${ipAddress}`;
    
    const current = await redis.incr(key);
    await redis.expire(key, 60); // Reset every minute
    
    if (current > this.config.maxRequestsPerMinute) {
      await this.blockIP(ipAddress, 300); // Block for 5 minutes
      return true;
    }
    
    return false;
  }

  // Detect suspicious session (unusual location, device change)
  async detectSuspiciousSession(
    _userId: string,
    currentIP: string,
    previousIPs: string[]
  ): Promise<boolean> {
    // Check if IP is from a different country
    const currentCountry = await this.getIPCountry(currentIP);
    
    for (const prevIP of previousIPs) {
      const prevCountry = await this.getIPCountry(prevIP);
      
      if (currentCountry && prevCountry && currentCountry !== prevCountry) {
        // Check if it's a suspicious location
        if (this.config.suspiciousLocations.includes(currentCountry)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Get country from IP (placeholder - integrate with IP geolocation service)
  private async getIPCountry(_ip: string): Promise<string | null> {
    // In production, integrate with MaxMind GeoIP2 or similar
    // For now, return null
    return null;
  }

  // Log threat event
  async logThreatEvent(event: ThreatEvent): Promise<void> {
    const redis = getRedisClient();
    const key = `threat:events:${event.type}`;
    
    await redis.lpush(key, JSON.stringify(event));
    await redis.ltrim(key, 0, 999); // Keep last 1000 events
    await redis.expire(key, 86400); // Keep for 24 hours
  }

  // Get recent threat events
  async getThreatEvents(type?: string, limit = 100): Promise<ThreatEvent[]> {
    const redis = getRedisClient();
    const key = type ? `threat:events:${type}` : 'threat:events:all';
    
    const events = await redis.lrange(key, 0, limit - 1);
    return events.map(e => JSON.parse(e));
  }

  // Update configuration
  updateConfig(config: Partial<ThreatConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current configuration
  getConfig(): ThreatConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const threatDetector = new ThreatDetector();

// ── Middleware Helpers ─────────────────────────────────────────────────────────
export async function checkThreat(ipAddress: string, _userId?: string): Promise<{
  blocked: boolean;
  reason?: string;
}> {
  // Check if IP is blocked
  if (await threatDetector.isIPBlocked(ipAddress)) {
    return { blocked: true, reason: 'IP blocked' };
  }
  
  // Check rate limit
  const rateLimited = await threatDetector.trackRequestRate(ipAddress);
  if (rateLimited) {
    return { blocked: true, reason: 'Rate limit exceeded' };
  }
  
  return { blocked: false };
}

export async function recordFailedLogin(ipAddress: string, userId?: string): Promise<boolean> {
  return threatDetector.trackFailedAttempt(ipAddress, userId);
}
