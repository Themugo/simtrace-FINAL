// Analytics Engine
// Tenant analytics, device intelligence trends, operational dashboards

import mongoose from 'mongoose';

class AnalyticsEngine {
  aggregationCache: Map<string, any>;
  cacheTTL: number;

  constructor() {
    this.aggregationCache = new Map();
    this.cacheTTL = 300000; // 5 minutes
  }

  // Tenant analytics
  async getTenantAnalytics(tenantId: string, startDate: string, endDate: string): Promise<any> {
    const cacheKey = `tenant:${tenantId}:${startDate}:${endDate}`;
    
    if (this.aggregationCache.has(cacheKey)) {
      const cached = this.aggregationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }

    const analytics = {
      deviceCount: await this.getDeviceCount(tenantId),
      alertCount: await this.getAlertCount(tenantId, startDate, endDate),
      activeDevices: await this.getActiveDeviceCount(tenantId),
      riskDistribution: await this.getRiskDistribution(tenantId),
      locationHeatmap: await this.getLocationHeatmap(tenantId, startDate, endDate),
    };

    this.aggregationCache.set(cacheKey, {
      data: analytics,
      timestamp: Date.now(),
    });

    return analytics;
  }

  // Get device count for tenant
  async getDeviceCount(tenantId: string): Promise<number> {
    return mongoose.connection.db!.collection('devices').countDocuments({ tenantId });
  }

  // Get alert count for tenant
  async getAlertCount(tenantId: string, startDate: string, endDate: string): Promise<number> {
    return mongoose.connection.db!.collection('alerts').countDocuments({
      tenantId,
      timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });
  }

  // Get active device count
  async getActiveDeviceCount(tenantId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return mongoose.connection.db!.collection('devices').countDocuments({
      tenantId,
      lastSeen: { $gte: thirtyDaysAgo },
    });
  }

  // Get risk distribution
  async getRiskDistribution(tenantId: string): Promise<Record<string, number>> {
    const pipeline = [
      { $match: { tenantId } },
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 },
        },
      },
    ];

    const result = await mongoose.connection.db!.collection('devices').aggregate(pipeline).toArray();
    
    return result.reduce((acc: Record<string, number>, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }

  // Get location heatmap
  async getLocationHeatmap(tenantId: string, startDate: string, endDate: string): Promise<any[]> {
    const pipeline = [
      {
        $match: {
          tenantId,
          timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: {
            lat: { $round: ['$latitude', 2] },
            lon: { $round: ['$longitude', 2] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ];

    return mongoose.connection.db!.collection('trackingEvents').aggregate(pipeline).toArray();
  }

  // Device intelligence trends
  async getDeviceIntelligenceTrends(days: number = 30): Promise<any[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ];

    return mongoose.connection.db!.collection('trackingEvents').aggregate(pipeline).toArray();
  }

  // Operational dashboard metrics
  async getOperationalMetrics(): Promise<any> {
    return {
      totalDevices: await mongoose.connection.db!.collection('devices').countDocuments(),
      totalAlerts: await mongoose.connection.db!.collection('alerts').countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      activeUsers: await this.getActiveUserCount(),
      apiRequests: await this.getApiRequestCount(),
      errorRate: await this.getErrorRate(),
      avgResponseTime: await this.getAvgResponseTime(),
    };
  }

  // Get active user count
  async getActiveUserCount(): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return mongoose.connection.db!.collection('users').countDocuments({
      lastActive: { $gte: twentyFourHoursAgo },
    });
  }

  // Get API request count
  async getApiRequestCount(): Promise<number> {
    // This would typically come from metrics/logs
    return 0;
  }

  // Get error rate
  async getErrorRate(): Promise<number> {
    // This would typically come from metrics/logs
    return 0;
  }

  // Get average response time
  async getAvgResponseTime(): Promise<number> {
    // This would typically come from metrics/logs
    return 0;
  }

  // Clear cache
  clearCache(): void {
    this.aggregationCache.clear();
  }
}

export const analyticsEngine = new AnalyticsEngine();
