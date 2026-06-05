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
// Rate limiting uses express-rate-limit's default in-memory store. Notes:
//  - The previous hand-rolled Redis store returned a bare number from increment(),
//    which v7 rejects with ERR_ERL_INVALID_HITS.
//  - rate-limit-redis's RedisStore can't be used here either, because its constructor
//    runs Redis commands immediately (at import time), before redisClient.connect()
//    in initializeSecurityMiddleware — throwing ClientClosedError at startup.
//  - This service runs single-instance (WEB_CONCURRENCY=1), so an in-memory limiter
//    is correct and reliable. To share limits across instances later, construct a
//    RedisStore AFTER the client is connected (inside initializeSecurityMiddleware),
//    not at module load.
export const ipRateLimiter = rateLimit({
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
    
    if (Number(requests) > 100) { // More than 100 requests per minute
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
      const activityCount = parseInt(suspiciousActivity.toString());
      
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
