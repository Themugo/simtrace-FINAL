// Security Middleware Hardening
// Enhanced security middleware with IP throttling, abuse detection

import rateLimit from 'express-rate-limit';
import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

// Redis client for distributed rate limiting
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// IP-based rate limiting with Redis
export const ipRateLimiter = rateLimit({
  store: {
    async get(key: string): Promise<any> {
      try {
        const value = await redisClient.get(key);
        return value ? parseInt(value) : null;
      } catch (error) {
        console.error('[Rate Limit] Redis get error:', error);
        return null;
      }
    },
    async set(key: string, value: number, ttl: number): Promise<void> {
      try {
        await redisClient.set(key, value, { EX: ttl });
      } catch (error) {
        console.error('[Rate Limit] Redis set error:', error);
      }
    },
    async increment(key: string): Promise<any> {
      try {
        const newValue = await redisClient.incr(key);
        return newValue;
      } catch (error) {
        console.error('[Rate Limit] Redis increment error:', error);
        return 1;
      }
    },
    async decrement(key: string): Promise<void> {
      try {
        await redisClient.decr(key);
      } catch (error) {
        console.error('[Rate Limit] Redis decrement error:', error);
      }
    },
    async resetKey(key: string): Promise<void> {
      try {
        await redisClient.del(key);
      } catch (error) {
        console.error('[Rate Limit] Redis reset error:', error);
      }
    },
  } as any,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoint-specific rate limiting
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 API requests per windowMs
  message: {
    success: false,
    error: 'Too many API requests, please try again later',
    code: 'API_RATE_LIMIT_EXCEEDED',
  },
});

// Strict rate limiting for sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  message: {
    success: false,
    error: 'Rate limit exceeded for this endpoint',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
  },
});

// IP throttling middleware
export const ipThrottlingMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress;
  const key = `ip_throttle:${ip}`;
  
  try {
    const requests = await redisClient.incr(key);
    
    if (requests === 1) {
      await redisClient.expire(key, 60); // 1 minute window
    }
    
    if (requests > 100) { // More than 100 requests per minute
      return res.status(429).json({
        success: false,
        error: 'IP throttled due to excessive requests',
        code: 'IP_THROTTLED',
      });
    }
    
    next();
  } catch (error) {
    console.error('[IP Throttling] Error:', error);
    next(); // Fail open on error
  }
};

// API abuse detection
export const abuseDetectionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const key = `abuse:${ip}:${userAgent}`;
  
  try {
    const suspiciousActivity = await redisClient.get(key);
    
    if (suspiciousActivity) {
      const activityCount = parseInt(suspiciousActivity);
      
      if (activityCount > 10) {
        return res.status(403).json({
          success: false,
          error: 'Suspicious activity detected, please contact support',
          code: 'SUSPICIOUS_ACTIVITY',
        });
      }
      
      await redisClient.incr(key);
    } else {
      await redisClient.set(key, 1, { EX: 3600 }); // 1 hour window
    }
    
    next();
  } catch (error) {
    console.error('[Abuse Detection] Error:', error);
    next(); // Fail open on error
  }
};

// CSRF protection for state-changing requests
export const csrfProtectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const csrfToken = req.headers['x-csrf-token'];
  const sessionToken = req.headers['authorization'];
  
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  // Validate CSRF token for state-changing requests
  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING',
    });
  }
  
  // In production, validate CSRF token against session
  // For now, just check presence
  next();
};

// Security headers enhancement
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Initialize Redis client
export async function initializeSecurityMiddleware() {
  try {
    await redisClient.connect();
    console.log('[Security Middleware] Redis connected successfully');
  } catch (error) {
    console.error('[Security Middleware] Failed to connect to Redis:', error);
  }
}
