// AI Request Caching and Token Monitoring
import { getRedisClient } from '../../services/redis.js';

class AIRequestCache {
  redis: any;
  cachePrefix: string;
  metricsPrefix: string;

  constructor() {
    this.redis = getRedisClient();
    this.cachePrefix = 'ai_cache:';
    this.metricsPrefix = 'ai_metrics:';
  }

  // Cache AI response
  async cacheResponse(requestHash: string, response: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.set(
        `${this.cachePrefix}${requestHash}`,
        JSON.stringify(response),
        { EX: ttl }
      );
    } catch (error) {
      console.error('[AI Cache] Failed to cache response:', error);
    }
  }

  // Get cached response
  async getCachedResponse(requestHash: string): Promise<any> {
    try {
      const cached = await this.redis.get(`${this.cachePrefix}${requestHash}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('[AI Cache] Failed to get cached response:', error);
      return null;
    }
  }

  // Track token usage
  async trackTokenUsage(userId: string, model: string, inputTokens: number, outputTokens: number): Promise<void> {
    try {
      const key = `${this.metricsPrefix}tokens:${userId}:${model}`;
      const data = {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        timestamp: Date.now(),
      };

      await this.redis.lpush(key, JSON.stringify(data));
      await this.redis.expire(key, 86400); // 24 hours
    } catch (error) {
      console.error('[AI Metrics] Failed to track token usage:', error);
    }
  }

  // Get token usage for user
  async getTokenUsage(userId: string, model: string, hours: number = 24): Promise<any> {
    try {
      const key = `${this.metricsPrefix}tokens:${userId}:${model}`;
      const data = await this.redis.lrange(key, 0, -1);
      
      const cutoff = Date.now() - (hours * 60 * 60 * 1000);
      const recentData = data
        .map((item: string) => JSON.parse(item))
        .filter((item: any) => item.timestamp > cutoff);

      return {
        totalTokens: recentData.reduce((sum: number, item: any) => sum + item.totalTokens, 0),
        inputTokens: recentData.reduce((sum: number, item: any) => sum + item.inputTokens, 0),
        outputTokens: recentData.reduce((sum: number, item: any) => sum + item.outputTokens, 0),
        requestCount: recentData.length,
      };
    } catch (error) {
      console.error('[AI Metrics] Failed to get token usage:', error);
      return { totalTokens: 0, inputTokens: 0, outputTokens: 0, requestCount: 0 };
    }
  }

  // Calculate cost
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'claude-3': { input: 0.015, output: 0.075 },
    };

    const modelPricing = pricing[model] || pricing['gpt-3.5-turbo'];
    
    const inputCost = (inputTokens / 1000) * modelPricing.input;
    const outputCost = (outputTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  // Get cost analytics
  async getCostAnalytics(userId: string, hours: number = 24): Promise<any> {
    try {
      const pattern = `${this.metricsPrefix}tokens:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      
      let totalCost = 0;
      const modelCosts: Record<string, number> = {};

      for (const key of keys) {
        const model = key.split(':').pop() as string;
        const data = await this.redis.lrange(key, 0, -1);
        
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        const recentData = data
          .map((item: string) => JSON.parse(item))
          .filter((item: any) => item.timestamp > cutoff);

        const inputTokens = recentData.reduce((sum: number, item: any) => sum + item.inputTokens, 0);
        const outputTokens = recentData.reduce((sum: number, item: any) => sum + item.outputTokens, 0);
        
        const cost = this.calculateCost(model, inputTokens, outputTokens);
        totalCost += cost;
        
        modelCosts[model] = (modelCosts[model] || 0) + cost;
      }

      return {
        totalCost,
        modelCosts,
        hours,
      };
    } catch (error) {
      console.error('[AI Metrics] Failed to get cost analytics:', error);
      return { totalCost: 0, modelCosts: {}, hours };
    }
  }
}

export const aiRequestCache = new AIRequestCache();
