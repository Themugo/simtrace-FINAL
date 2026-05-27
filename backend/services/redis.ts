import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// ── Rate Limiting ──────────────────────────────────────────────────────────────
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const key = `ratelimit:${identifier}`;
  const windowSec = Math.ceil(windowMs / 1000);
  
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, windowSec);
  
  const results = await pipeline.exec();
  if (!results) {
    return { allowed: true, limit, remaining: limit, reset: Date.now() + windowMs };
  }
  
  const current = results[0][1] as number;
  const allowed = current <= limit;
  const remaining = Math.max(0, limit - current);
  const reset = Date.now() + windowMs;
  
  return { allowed, limit, remaining, reset };
}

// ── Simple Queue ───────────────────────────────────────────────────────────────
export interface QueueJob<T = any> {
  id: string;
  data: T;
  attempts: number;
  createdAt: number;
}

export async function enqueue<T>(queueName: string, data: T): Promise<string> {
  const redis = getRedisClient();
  const jobId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const job: QueueJob<T> = {
    id: jobId,
    data,
    attempts: 0,
    createdAt: Date.now(),
  };
  
  await redis.lpush(`queue:${queueName}`, JSON.stringify(job));
  return jobId;
}

export async function dequeue<T>(queueName: string): Promise<QueueJob<T> | null> {
  const redis = getRedisClient();
  const result = await redis.brpop(`queue:${queueName}`, 5); // 5 second timeout
  
  if (!result) return null;
  
  try {
    return JSON.parse(result[1]) as QueueJob<T>;
  } catch {
    return null;
  }
}

export async function getQueueLength(queueName: string): Promise<number> {
  const redis = getRedisClient();
  return redis.llen(`queue:${queueName}`);
}

// ── Socket Scaling (Pub/Sub) ───────────────────────────────────────────────────
export async function publish(channel: string, message: any): Promise<number> {
  const redis = getRedisClient();
  return redis.publish(channel, JSON.stringify(message));
}

export async function subscribe(
  channel: string,
  callback: (message: any) => void
): Promise<void> {
  const redis = getRedisClient();
  const subscriber = redis.duplicate();
  
  await subscriber.subscribe(channel);
  subscriber.on('message', (receivedChannel, message) => {
    if (receivedChannel === channel) {
      try {
        callback(JSON.parse(message));
      } catch (err) {
        console.error('[Redis] Failed to parse message:', err);
      }
    }
  });
}

// ── Cache Helpers ─────────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  const redis = getRedisClient();
  const data = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, data);
  } else {
    await redis.set(key, data);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

export async function cacheDeletePattern(pattern: string): Promise<number> {
  const redis = getRedisClient();
  const keys = await redis.keys(pattern);
  if (keys.length === 0) return 0;
  return redis.del(...keys);
}
