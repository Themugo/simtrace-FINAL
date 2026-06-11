// services/ai/realTimeAnalytics.ts - Real-time analytics dashboard
import crypto from 'crypto';

export interface AnalyticsMetric {
  metricId: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  deviceId?: string;
  userId?: string;
  metadata: any;
}

export interface DashboardWidget {
  widgetId: string;
  widgetType: 'line_chart' | 'bar_chart' | 'pie_chart' | 'gauge' | 'counter' | 'table' | 'map';
  title: string;
  dataSource: string;
  config: any;
  refreshInterval: number; // milliseconds
  lastUpdated: number;
}

export interface AnalyticsDashboard {
  dashboardId: string;
  name: string;
  userId: string;
  widgets: DashboardWidget[];
  layout: { x: number; y: number; w: number; h: number }[];
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AlertRule {
  ruleId: string;
  userId: string;
  metricName: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
  lastTriggered?: number;
}

export class RealTimeAnalyticsService {
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private dashboards: Map<string, AnalyticsDashboard> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, any> = new Map();

  /**
   * Record metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    deviceId?: string,
    userId?: string,
    metadata?: any
  ): AnalyticsMetric {
    const metricId = crypto.randomBytes(16).toString('hex');

    const metric: AnalyticsMetric = {
      metricId,
      name,
      value,
      unit,
      timestamp: Date.now(),
      deviceId,
      userId,
      metadata: metadata || {}
    };

    this.metrics.set(metricId, metric);

    // Check alert rules
    this.checkAlertRules(metric);

    return metric;
  }

  /**
   * Get metrics for time range
   */
  getMetrics(
    name: string,
    startTime: number,
    endTime: number,
    deviceId?: string,
    userId?: string
  ): AnalyticsMetric[] {
    return Array.from(this.metrics.values())
      .filter(m => {
        if (m.name !== name) return false;
        if (m.timestamp < startTime || m.timestamp > endTime) return false;
        if (deviceId && m.deviceId !== deviceId) return false;
        if (userId && m.userId !== userId) return false;
        return true;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(
    name: string,
    startTime: number,
    endTime: number,
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count',
    interval: number = 3600000 // 1 hour default
  ): { timestamp: number; value: number }[] {
    const metrics = this.getMetrics(name, startTime, endTime);
    const aggregated: { timestamp: number; value: number }[] = [];

    const intervals: Map<number, AnalyticsMetric[]> = new Map();

    // Group metrics by interval
    for (const metric of metrics) {
      const intervalStart = Math.floor(metric.timestamp / interval) * interval;
      const intervalMetrics = intervals.get(intervalStart) || [];
      intervalMetrics.push(metric);
      intervals.set(intervalStart, intervalMetrics);
    }

    // Aggregate each interval
    for (const [timestamp, intervalMetrics] of intervals.entries()) {
      let value: number;

      switch (aggregation) {
        case 'sum':
          value = intervalMetrics.reduce((sum, m) => sum + m.value, 0);
          break;
        case 'avg':
          value = intervalMetrics.reduce((sum, m) => sum + m.value, 0) / intervalMetrics.length;
          break;
        case 'min':
          value = Math.min(...intervalMetrics.map(m => m.value));
          break;
        case 'max':
          value = Math.max(...intervalMetrics.map(m => m.value));
          break;
        case 'count':
          value = intervalMetrics.length;
          break;
        default:
          value = intervalMetrics.reduce((sum, m) => sum + m.value, 0);
      }

      aggregated.push({ timestamp, value });
    }

    return aggregated.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Create dashboard
   */
  createDashboard(
    name: string,
    userId: string,
    widgets: DashboardWidget[],
    layout: { x: number; y: number; w: number; h: number }[],
    isPublic: boolean = false
  ): AnalyticsDashboard {
    const dashboardId = crypto.randomBytes(16).toString('hex');

    const dashboard: AnalyticsDashboard = {
      dashboardId,
      name,
      userId,
      widgets,
      layout,
      isPublic,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.dashboards.set(dashboardId, dashboard);
    return dashboard;
  }

  /**
   * Update dashboard
   */
  updateDashboard(
    dashboardId: string,
    updates: {
      name?: string;
      widgets?: DashboardWidget[];
      layout?: { x: number; y: number; w: number; h: number }[];
      isPublic?: boolean;
    }
  ): AnalyticsDashboard | null {
    const dashboard = this.dashboards.get(dashboardId);
    
    if (!dashboard) {
      return null;
    }

    if (updates.name) dashboard.name = updates.name;
    if (updates.widgets) dashboard.widgets = updates.widgets;
    if (updates.layout) dashboard.layout = updates.layout;
    if (updates.isPublic !== undefined) dashboard.isPublic = updates.isPublic;
    dashboard.updatedAt = Date.now();

    this.dashboards.set(dashboardId, dashboard);
    return dashboard;
  }

  /**
   * Get dashboard
   */
  getDashboard(dashboardId: string): AnalyticsDashboard | null {
    return this.dashboards.get(dashboardId) || null;
  }

  /**
   * Get dashboards for user
   */
  getDashboardsForUser(userId: string): AnalyticsDashboard[] {
    return Array.from(this.dashboards.values())
      .filter(d => d.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Get public dashboards
   */
  getPublicDashboards(): AnalyticsDashboard[] {
    return Array.from(this.dashboards.values())
      .filter(d => d.isPublic)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Delete dashboard
   */
  deleteDashboard(dashboardId: string): boolean {
    return this.dashboards.delete(dashboardId);
  }

  /**
   * Create alert rule
   */
  createAlertRule(
    userId: string,
    metricName: string,
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals',
    threshold: number,
    severity: 'info' | 'warning' | 'error' | 'critical',
    notificationChannels: string[]
  ): AlertRule {
    const ruleId = crypto.randomBytes(16).toString('hex');

    const rule: AlertRule = {
      ruleId,
      userId,
      metricName,
      condition,
      threshold,
      severity,
      enabled: true,
      notificationChannels
    };

    this.alertRules.set(ruleId, rule);
    return rule;
  }

  /**
   * Check alert rules
   */
  private checkAlertRules(metric: AnalyticsMetric): void {
    for (const [_ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled || rule.metricName !== metric.name) {
        continue;
      }

      let triggered = false;

      switch (rule.condition) {
        case 'greater_than':
          triggered = metric.value > rule.threshold;
          break;
        case 'less_than':
          triggered = metric.value < rule.threshold;
          break;
        case 'equals':
          triggered = metric.value === rule.threshold;
          break;
        case 'not_equals':
          triggered = metric.value !== rule.threshold;
          break;
      }

      if (triggered) {
        this.triggerAlert(rule, metric);
      }
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(rule: AlertRule, metric: AnalyticsMetric): void {
    const alertId = crypto.randomBytes(16).toString('hex');

    const alert = {
      alertId: rule.ruleId,
      metric,
      severity: rule.severity,
      timestamp: Date.now(),
      notificationChannels: rule.notificationChannels
    };

    this.activeAlerts.set(alertId, alert);
    rule.lastTriggered = Date.now();
    this.alertRules.set(rule.ruleId, rule);

    // In production, this would send notifications via the configured channels
    console.log(`Alert triggered: ${rule.metricName} ${rule.condition} ${rule.threshold} (actual: ${metric.value})`);
  }

  /**
   * Get alert rules for user
   */
  getAlertRules(userId: string): AlertRule[] {
    return Array.from(this.alertRules.values())
      .filter(r => r.userId === userId);
  }

  /**
   * Update alert rule
   */
  updateAlertRule(
    ruleId: string,
    updates: {
      condition?: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
      threshold?: number;
      severity?: 'info' | 'warning' | 'error' | 'critical';
      enabled?: boolean;
      notificationChannels?: string[];
    }
  ): AlertRule | null {
    const rule = this.alertRules.get(ruleId);
    
    if (!rule) {
      return null;
    }

    if (updates.condition) rule.condition = updates.condition;
    if (updates.threshold !== undefined) rule.threshold = updates.threshold;
    if (updates.severity) rule.severity = updates.severity;
    if (updates.enabled !== undefined) rule.enabled = updates.enabled;
    if (updates.notificationChannels) rule.notificationChannels = updates.notificationChannels;

    this.alertRules.set(ruleId, rule);
    return rule;
  }

  /**
   * Delete alert rule
   */
  deleteAlertRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(userId?: string): any[] {
    const alerts = Array.from(this.activeAlerts.values());
    
    if (userId) {
      const userRuleIds = Array.from(this.alertRules.values())
        .filter(r => r.userId === userId)
        .map(r => r.ruleId);
      
      return alerts.filter(a => userRuleIds.includes(a.ruleId));
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalMetrics: number;
    totalDashboards: number;
    totalAlertRules: number;
    activeAlerts: number;
    metricsByType: { [key: string]: number };
    alertsBySeverity: { [key: string]: number };
  } {
    const metrics = Array.from(this.metrics.values());
    const dashboards = Array.from(this.dashboards.values());
    const alerts = Array.from(this.activeAlerts.values());

    const metricsByType: { [key: string]: number } = {};
    const alertsBySeverity: { [key: string]: number } = {};

    for (const metric of metrics) {
      metricsByType[metric.name] = (metricsByType[metric.name] || 0) + 1;
    }

    for (const alert of alerts) {
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    }

    return {
      totalMetrics: metrics.length,
      totalDashboards: dashboards.length,
      totalAlertRules: this.alertRules.size,
      activeAlerts: alerts.length,
      metricsByType,
      alertsBySeverity
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(maxAge: number = 604800000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [metricId, metric] of this.metrics.entries()) {
      if (now - metric.timestamp > maxAge) {
        this.metrics.delete(metricId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(maxAge: number = 86400000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [alertId, alert] of this.activeAlerts.entries()) {
      if (now - alert.timestamp > maxAge) {
        this.activeAlerts.delete(alertId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export metrics
   */
  exportMetrics(name?: string, startTime?: number, endTime?: number): string {
    const metrics = name
      ? this.getMetrics(name, startTime || 0, endTime || Date.now())
      : Array.from(this.metrics.values());
    
    return JSON.stringify(metrics, null, 2);
  }

  /**
   * Import metrics
   */
  importMetrics(metrics: AnalyticsMetric[]): number {
    let imported = 0;

    for (const metric of metrics) {
      if (!this.metrics.has(metric.metricId)) {
        this.metrics.set(metric.metricId, metric);
        imported++;
      }
    }

    return imported;
  }
}

export const realTimeAnalyticsService = new RealTimeAnalyticsService();

