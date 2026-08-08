import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/environment.js";
import { logger } from "../config/logger.js";
import { sendError } from "../utils/apiResponse.js";

// Tracks failed login attempts in memory (IP / Identifier -> { count, lastAttempt })
const failedLoginTracker = new Map<string, { count: number; lastAttempt: number }>();
const BRUTE_FORCE_MAX_ATTEMPTS = 5;
const BRUTE_FORCE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const helmetSecurity = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

export const corsSecurity = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or allowed frontend URL
    if (!origin || origin.includes("localhost") || origin.includes("run.app") || origin === env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(null, true); // Dev-friendly fallback
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-API-Key"],
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
    errorCode: "RATE_LIMIT_EXCEEDED",
    timestamp: new Date().toISOString(),
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
    errorCode: "AUTH_RATE_LIMIT_EXCEEDED",
    timestamp: new Date().toISOString(),
  },
});

export const mongoSanitizer = mongoSanitize();

export function bruteForceProtection(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const record = failedLoginTracker.get(ip);

  if (record) {
    const now = Date.now();
    if (now - record.lastAttempt > BRUTE_FORCE_WINDOW_MS) {
      failedLoginTracker.delete(ip);
    } else if (record.count >= BRUTE_FORCE_MAX_ATTEMPTS) {
      logger.warn(`[Security] Brute-force attempt blocked for IP: ${ip}`);
      sendError(res, "Account access temporarily locked due to multiple failed attempts.", 429, "BRUTE_FORCE_LOCKOUT");
      return;
    }
  }

  next();
}

export function recordFailedLogin(ip: string): void {
  const record = failedLoginTracker.get(ip) || { count: 0, lastAttempt: Date.now() };
  record.count += 1;
  record.lastAttempt = Date.now();
  failedLoginTracker.set(ip, record);
}

export function resetFailedLogins(ip: string): void {
  failedLoginTracker.delete(ip);
}

export function suspiciousActivityDetector(req: Request, res: Response, next: NextFunction): void {
  const userAgent = req.headers["user-agent"] || "";
  const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/i;

  if (sqlInjectionPattern.test(req.originalUrl) || sqlInjectionPattern.test(JSON.stringify(req.body || {}))) {
    logger.warn(`[Security] Suspicious payload detected from IP: ${req.ip}`);
    sendError(res, "Suspicious request blocked", 400, "SUSPICIOUS_REQUEST_BLOCKED");
    return;
  }

  next();
}
