import rateLimit from 'express-rate-limit';
import { getRedisClient } from './redis.js';
import RateLimiterRedis from 'rate-limit-redis';

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  useRedis?: boolean;
}) {
  const { windowMs, max, message, useRedis = false } = options;

  if (useRedis && process.env.REDIS_URL) {
    const redisClient = getRedisClient();
    return rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RateLimiterRedis({
        client: redisClient,
        prefix: 'rate_limit:',
      }),
      message: message || { error: 'Rate limit exceeded' },
    });
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: message || { error: 'Rate limit exceeded' },
  });
}
