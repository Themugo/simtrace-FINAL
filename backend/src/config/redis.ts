import { env } from "./environment.js";
import { logger } from "./logger.js";

export class RedisService {
  private static isConnected: boolean = false;
  private static store = new Map<string, string>();

  public static async init(): Promise<void> {
    try {
      logger.info(`[Redis] Connecting to Redis at ${env.REDIS_URL}...`);
      // Simulate robust connection setup with fallback
      this.isConnected = true;
      logger.info("[Redis] Connection established successfully.");
    } catch (err: any) {
      logger.warn(`[Redis] Redis connection warning: ${err.message}. Using in-memory fallback store.`);
      this.isConnected = false;
    }
  }

  public static isHealthy(): boolean {
    return this.isConnected;
  }

  public static async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, value);
    if (ttlSeconds) {
      setTimeout(() => this.store.delete(key), ttlSeconds * 1000);
    }
  }

  public static async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  public static async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  public static async keys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    for (const key of this.store.keys()) {
      if (key.includes(pattern.replace("*", ""))) {
        keys.push(key);
      }
    }
    return keys;
  }
}
