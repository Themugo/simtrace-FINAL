// ── Cost Optimization System ─────────────────────────────────────────────────────
// AI token costs, DB growth, storage growth, websocket usage, bandwidth, cost dashboard

export interface CostMetric {
  id: string;
  category: 'ai_tokens' | 'database' | 'storage' | 'websocket' | 'bandwidth' | 'compute';
  metricName: string;
  value: number;
  unit: string;
  cost: number;
  currency: string;
  timestamp: Date;
  resourceId?: string;
  organizationId?: string;
}

export interface CostAlert {
  id: string;
  type: 'budget_exceeded' | 'anomaly_detected' | 'cost_spike' | 'forecast_exceeded';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: CostMetric['category'];
  message: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface CostForecast {
  id: string;
  category: CostMetric['category'];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  forecast: number;
  actual?: number;
  variance?: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  confidence: number; // 0-1
}

export interface CostBudget {
  id: string;
  category: CostMetric['category'];
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  budget: number;
  spent: number;
  remaining: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  alertThreshold: number; // percentage
}

export interface CostRecommendation {
  id: string;
  type: 'optimize_query' | 'reduce_storage' | 'compress_data' | 'cache_improvement' | 'scale_down';
  category: CostMetric['category'];
  title: string;
  description: string;
  estimatedSavings: number;
  currency: string;
  effort: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: Date;
}

class CostOptimizer {
  private metrics: Map<string, CostMetric> = new Map();
  private alerts: Map<string, CostAlert> = new Map();
  private forecasts: Map<string, CostForecast> = new Map();
  private budgets: Map<string, CostBudget> = new Map();
  private recommendations: Map<string, CostRecommendation> = new Map();

  // Pricing rates (per unit)
  private pricingRates = {
    ai_tokens: 0.00002, // per token
    database: 0.0001, // per operation
    storage: 0.023, // per GB/month
    websocket: 0.0005, // per minute
    bandwidth: 0.09, // per GB
    compute: 0.05, // per hour
  };

  // Record cost metric
  recordMetric(metric: Omit<CostMetric, 'id' | 'cost'>): CostMetric {
    const cost = this.calculateCost(metric.category, metric.value);
    const costMetric: CostMetric = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cost,
    };

    this.metrics.set(costMetric.id, costMetric);
    this.checkBudgets(costMetric);
    this.checkAnomalies(costMetric);
    return costMetric;
  }

  // Calculate cost
  private calculateCost(category: CostMetric['category'], value: number): number {
    const rate = this.pricingRates[category];
    return value * rate;
  }

  // Get metrics by category
  getMetricsByCategory(category: CostMetric['category'], startDate?: Date, endDate?: Date): CostMetric[] {
    let metrics = Array.from(this.metrics.values()).filter(m => m.category === category);

    if (startDate) {
      metrics = metrics.filter(m => m.timestamp >= startDate);
    }

    if (endDate) {
      metrics = metrics.filter(m => m.timestamp <= endDate);
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get total cost by category
  getTotalCostByCategory(category: CostMetric['category'], startDate: Date, endDate: Date): number {
    const metrics = this.getMetricsByCategory(category, startDate, endDate);
    return metrics.reduce((sum, m) => sum + m.cost, 0);
  }

  // Get total cost across all categories
  getTotalCost(startDate: Date, endDate: Date): number {
    let total = 0;
    for (const category of Object.keys(this.pricingRates) as CostMetric['category'][]) {
      total += this.getTotalCostByCategory(category, startDate, endDate);
    }
    return total;
  }

  // Check budgets
  private checkBudgets(metric: CostMetric): void {
    for (const budget of this.budgets.values()) {
      if (budget.category === metric.category) {
        budget.spent += metric.cost;
        budget.remaining = budget.budget - budget.spent;

        const percentage = (budget.spent / budget.budget) * 100;
        if (percentage >= budget.alertThreshold) {
          this.createAlert({
            type: 'budget_exceeded',
            severity: percentage >= 100 ? 'critical' : percentage >= 90 ? 'high' : 'medium',
            category: metric.category,
            message: `Budget exceeded: ${percentage.toFixed(1)}% of ${budget.budget} ${budget.currency}`,
            currentValue: budget.spent,
            threshold: budget.budget,
          });
        }
      }
    }
  }

  // Check anomalies
  private checkAnomalies(metric: CostMetric): void {
    const recentMetrics = Array.from(this.metrics.values())
      .filter(m => m.category === metric.category && m.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000))
      .slice(0, 100);

    if (recentMetrics.length < 10) return;

    const values = recentMetrics.map(m => m.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    if (Math.abs(metric.value - mean) > 2 * stdDev) {
      this.createAlert({
        type: 'anomaly_detected',
        severity: Math.abs(metric.value - mean) > 3 * stdDev ? 'high' : 'medium',
        category: metric.category,
        message: `Anomaly detected: ${metric.value} ${metric.unit} (expected: ${mean.toFixed(2)} ± ${stdDev.toFixed(2)})`,
        currentValue: metric.value,
        threshold: mean + 2 * stdDev,
      });
    }
  }

  // Create alert
  private createAlert(alert: Omit<CostAlert, 'id' | 'timestamp' | 'resolved'>): CostAlert {
    const costAlert: CostAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.set(costAlert.id, costAlert);
    return costAlert;
  }

  // Get alerts
  getAlerts(resolved?: boolean): CostAlert[] {
    let alerts = Array.from(this.alerts.values());
    if (resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === resolved);
    }
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Resolve alert
  resolveAlert(alertId: string): CostAlert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    return alert;
  }

  // Create budget
  createBudget(budget: Omit<CostBudget, 'id' | 'spent' | 'remaining'>): CostBudget {
    const costBudget: CostBudget = {
      ...budget,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      spent: 0,
      remaining: budget.budget,
    };

    this.budgets.set(costBudget.id, costBudget);
    return costBudget;
  }

  // Get budgets
  getBudgets(): CostBudget[] {
    return Array.from(this.budgets.values());
  }

  // Generate forecast
  generateForecast(category: CostMetric['category'], period: CostForecast['period']): CostForecast {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now);
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now);
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarterly':
        startDate = new Date(now);
        endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get historical data for prediction
    const historicalMetrics = this.getMetricsByCategory(
      category,
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      now
    );

    const averageCost = historicalMetrics.length > 0
      ? historicalMetrics.reduce((sum, m) => sum + m.cost, 0) / historicalMetrics.length
      : 0;

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const forecast = averageCost * days;

    const forecastData: CostForecast = {
      id: `forecast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      period,
      forecast,
      currency: 'USD',
      startDate,
      endDate,
      confidence: 0.7, // 70% confidence
    };

    this.forecasts.set(forecastData.id, forecastData);
    return forecastData;
  }

  // Get forecasts
  getForecasts(): CostForecast[] {
    return Array.from(this.forecasts.values());
  }

  // Generate recommendations
  generateRecommendations(): CostRecommendation[] {
    const recommendations: CostRecommendation[] = [];

    // Check for high database costs
    const dbMetrics = this.getMetricsByCategory('database');
    const dbCost = dbMetrics.reduce((sum, m) => sum + m.cost, 0);
    if (dbCost > 100) {
      recommendations.push({
        id: `rec_${Date.now()}_1`,
        type: 'optimize_query',
        category: 'database',
        title: 'Optimize Database Queries',
        description: 'Review and optimize slow queries to reduce database operation costs',
        estimatedSavings: dbCost * 0.2,
        currency: 'USD',
        effort: 'medium',
        status: 'pending',
        createdAt: new Date(),
      });
    }

    // Check for high storage costs
    const storageMetrics = this.getMetricsByCategory('storage');
    const storageCost = storageMetrics.reduce((sum, m) => sum + m.cost, 0);
    if (storageCost > 50) {
      recommendations.push({
        id: `rec_${Date.now()}_2`,
        type: 'reduce_storage',
        category: 'storage',
        title: 'Reduce Storage Usage',
        description: 'Archive old data and implement data retention policies',
        estimatedSavings: storageCost * 0.3,
        currency: 'USD',
        effort: 'low',
        status: 'pending',
        createdAt: new Date(),
      });
    }

    // Check for high bandwidth costs
    const bandwidthMetrics = this.getMetricsByCategory('bandwidth');
    const bandwidthCost = bandwidthMetrics.reduce((sum, m) => sum + m.cost, 0);
    if (bandwidthCost > 200) {
      recommendations.push({
        id: `rec_${Date.now()}_3`,
        type: 'compress_data',
        category: 'bandwidth',
        title: 'Compress Data Transfers',
        description: 'Enable compression for API responses and file transfers',
        estimatedSavings: bandwidthCost * 0.4,
        currency: 'USD',
        effort: 'low',
        status: 'pending',
        createdAt: new Date(),
      });
    }

    // Store recommendations
    for (const rec of recommendations) {
      this.recommendations.set(rec.id, rec);
    }

    return recommendations;
  }

  // Get recommendations
  getRecommendations(status?: CostRecommendation['status']): CostRecommendation[] {
    let recs = Array.from(this.recommendations.values());
    if (status) {
      recs = recs.filter(r => r.status === status);
    }
    return recs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Update recommendation status
  updateRecommendationStatus(recId: string, status: CostRecommendation['status']): CostRecommendation | null {
    const rec = this.recommendations.get(recId);
    if (!rec) return null;

    rec.status = status;
    return rec;
  }

  // Get cost dashboard data
  getDashboardData(startDate: Date, endDate: Date): {
    totalCost: number;
    costByCategory: Record<string, number>;
    costTrend: { date: string; cost: number }[];
    alerts: CostAlert[];
    budgets: CostBudget[];
    forecasts: CostForecast[];
    recommendations: CostRecommendation[];
  } {
    const costByCategory: Record<string, number> = {};
    for (const category of Object.keys(this.pricingRates) as CostMetric['category'][]) {
      costByCategory[category] = this.getTotalCostByCategory(category, startDate, endDate);
    }

    // Generate trend data
    const costTrend: { date: string; cost: number }[] = [];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dayCost = this.getTotalCost(dayStart, dayEnd);
      costTrend.push({ date: dayStart.toISOString().split('T')[0], cost: dayCost });
    }

    return {
      totalCost: this.getTotalCost(startDate, endDate),
      costByCategory,
      costTrend,
      alerts: this.getAlerts(false),
      budgets: this.getBudgets(),
      forecasts: this.getForecasts(),
      recommendations: this.getRecommendations('pending'),
    };
  }

  // Get statistics
  getStatistics(): {
    totalMetrics: number;
    totalCost: number;
    activeAlerts: number;
    totalBudgets: number;
    totalForecasts: number;
    pendingRecommendations: number;
    estimatedSavings: number;
  } {
    const totalCost = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.cost, 0);
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved).length;
    const pendingRecs = Array.from(this.recommendations.values()).filter(r => r.status === 'pending');
    const estimatedSavings = pendingRecs.reduce((sum, r) => sum + r.estimatedSavings, 0);

    return {
      totalMetrics: this.metrics.size,
      totalCost,
      activeAlerts,
      totalBudgets: this.budgets.size,
      totalForecasts: this.forecasts.size,
      pendingRecommendations: pendingRecs.length,
      estimatedSavings,
    };
  }

  // Initialize with sample data
  initializeSampleData(): void {
    const now = new Date();

    // Record sample metrics
    this.recordMetric({
      category: 'ai_tokens',
      metricName: 'GPT-4 tokens',
      value: 1000000,
      unit: 'tokens',
      currency: 'USD',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    this.recordMetric({
      category: 'database',
      metricName: 'DB operations',
      value: 1000000,
      unit: 'operations',
      currency: 'USD',
      timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    });

    this.recordMetric({
      category: 'storage',
      metricName: 'S3 storage',
      value: 1000,
      unit: 'GB',
      currency: 'USD',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    });

    // Create budgets
    this.createBudget({
      category: 'ai_tokens',
      period: 'monthly',
      budget: 100,
      currency: 'USD',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      alertThreshold: 80,
    });

    this.createBudget({
      category: 'database',
      period: 'monthly',
      budget: 50,
      currency: 'USD',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      alertThreshold: 90,
    });
  }
}

// Singleton instance
export const costOptimizer = new CostOptimizer();

// Initialize sample data
costOptimizer.initializeSampleData();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function recordCostMetric(metric: Omit<CostMetric, 'id' | 'cost'>): CostMetric {
  return costOptimizer.recordMetric(metric);
}

export function getCostDashboardData(startDate: Date, endDate: Date) {
  return costOptimizer.getDashboardData(startDate, endDate);
}

export function generateCostRecommendations(): CostRecommendation[] {
  return costOptimizer.generateRecommendations();
}

export function getCostStatistics() {
  return costOptimizer.getStatistics();
}
