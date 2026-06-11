import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getRedisClient } from './redis.js';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is not set');
}

interface SessionData {
  userId: string;
  email: string;
  role: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Generate a secure random token for refresh tokens
function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create access token (short-lived)
function generateAccessToken(data: SessionData): string {
  return jwt.sign(
    {
      id: data.userId,
      email: data.email,
      role: data.role,
    },
    JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

// Store session in Redis with TTL
async function storeSession(refreshToken: string, sessionData: SessionData): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    console.warn('[Session] Redis not available, skipping session storage');
    return;
  }

  const key = `session:${refreshToken}`;
  const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

  await redis.setex(key, ttl, JSON.stringify(sessionData));
}

// Retrieve session from Redis
export async function getSession(refreshToken: string): Promise<SessionData | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const key = `session:${refreshToken}`;
  const data = await redis.get(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data) as SessionData;
  } catch {
    console.warn("[Session] Failed to parse session data (may be corrupted)");
    return null;
  }
}

// Delete session from Redis
async function deleteSession(refreshToken: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const key = `session:${refreshToken}`;
  await redis.del(key);
}

// Delete all sessions for a user (logout from all devices)
async function deleteAllUserSessions(userId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const pattern = `session:*`;
  const keys = await redis.keys(pattern);
  
  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      try {
        const session = JSON.parse(data) as SessionData;
        if (session.userId === userId) {
          await redis.del(key);
        }
      } catch {
        console.warn("[Session] Failed to parse session data during cleanup");
      }
    }
  }
}

// Create a new session (login)
export async function createSession(sessionData: SessionData): Promise<TokenPair> {
  const refreshToken = generateRefreshToken();
  const accessToken = generateAccessToken(sessionData);
  
  await storeSession(refreshToken, sessionData);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  const sessionData = await getSession(refreshToken);
  
  if (!sessionData) {
    return null;
  }
  
  // Generate new tokens
  const newRefreshToken = generateRefreshToken();
  const accessToken = generateAccessToken(sessionData);
  
  // Delete old session and store new one
  await deleteSession(refreshToken);
  await storeSession(newRefreshToken, sessionData);
  
  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: 15 * 60,
  };
}

// Validate access token
export function validateAccessToken(token: string): SessionData | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as any;
    return {
      userId: payload.id,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    console.warn("[Session] Failed to parse session token payload");
    return null;
  }
}

// Revoke a session (logout)
export async function revokeSession(refreshToken: string): Promise<void> {
  await deleteSession(refreshToken);
}

// Revoke all user sessions
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await deleteAllUserSessions(userId);
}
