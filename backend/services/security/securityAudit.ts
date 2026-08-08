// services/security/securityAudit.ts - Security audit logging for all advanced features
import crypto from 'crypto';

export interface AuditLogEntry {
  logId: string;
  timestamp: number;
  userId?: string;
  deviceId?: string;
  eventType: string;
  eventCategory: 'zk_proof' | 'quantum_crypto' | 'secure_enclave' | 'blockchain' | 'biometrics' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata: {
    sessionId?: string;
    requestId?: string;
    correlationId?: string;
  };
}

export interface AuditQuery {
  userId?: string;
  deviceId?: string;
  eventType?: string;
  eventCategory?: AuditLogEntry['eventCategory'];
  severity?: AuditLogEntry['severity'];
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface AuditStatistics {
  totalLogs: number;
  logsByCategory: { [key: string]: number };
  logsBySeverity: { [key: string]: number };
  logsByEventType: { [key: string]: number };
  successRate: number;
  failureRate: number;
  criticalEvents: number;
  timeRange: { earliest: number; latest: number };
}

export class SecurityAuditService {
  private auditLogs: Map<string, AuditLogEntry> = new Map();
  private alertThresholds = {
    critical: 1,
    high: 5,
    medium: 10,
    low: 20
  };

  /**
   * Log a security event
   */
  async logEvent(event: Omit<AuditLogEntry, 'logId' | 'timestamp'>): Promise<AuditLogEntry> {
    const logId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();

    const auditLog: AuditLogEntry = {
      logId,
      timestamp,
      ...event
    };

    this.auditLogs.set(logId, auditLog);

    // Check if this event meets alert thresholds
    await this.checkAlertThresholds(auditLog);

    return auditLog;
  }

  /**
   * Query audit logs
   */
  async queryLogs(query: AuditQuery): Promise<AuditLogEntry[]> {
    let logs = Array.from(this.auditLogs.values());

    // Apply filters
    if (query.userId) {
      logs = logs.filter(log => log.userId === query.userId);
    }

    if (query.deviceId) {
      logs = logs.filter(log => log.deviceId === query.deviceId);
    }

    if (query.eventType) {
      logs = logs.filter(log => log.eventType === query.eventType);
    }

    if (query.eventCategory) {
      logs = logs.filter(log => log.eventCategory === query.eventCategory);
    }

    if (query.severity) {
      logs = logs.filter(log => log.severity === query.severity);
    }

    if (query.startTime) {
      logs = logs.filter(log => log.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      logs = logs.filter(log => log.timestamp <= query.endTime!);
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (query.limit) {
      logs = logs.slice(0, query.limit);
    }

    return logs;
  }

  /**
   * Get audit statistics
   */
  async getStatistics(query?: AuditQuery): Promise<AuditStatistics> {
    const logs = query ? await this.queryLogs(query) : Array.from(this.auditLogs.values());

    const logsByCategory: { [key: string]: number } = {};
    const logsBySeverity: { [key: string]: number } = {};
    const logsByEventType: { [key: string]: number } = {};

    let successCount = 0;
    let failureCount = 0;
    let criticalEvents = 0;

    let earliestTime = Infinity;
    let latestTimestamp = 0;

    for (const log of logs) {
      // Count by category
      logsByCategory[log.eventCategory] = (logsByCategory[log.eventCategory] || 0) + 1;

      // Count by severity
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1;

      // Count by event type
      logsByEventType[log.eventType] = (logsByEventType[log.eventType] || 0) + 1;

      // Count success/failure
      if (log.success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Count critical events
      if (log.severity === 'critical') {
        criticalEvents++;
      }

      // Track time range
      if (log.timestamp < earliestTime) {
        earliestTime = log.timestamp;
      }
      if (log.timestamp > latestTimestamp) {
        latestTimestamp = log.timestamp;
      }
    }

    const totalLogs = logs.length;
    const successRate = totalLogs > 0 ? (successCount / totalLogs) * 100 : 0;
    const failureRate = totalLogs > 0 ? (failureCount / totalLogs) * 100 : 0;

    return {
      totalLogs,
      logsByCategory,
      logsBySeverity,
      logsByEventType,
      successRate,
      failureRate,
      criticalEvents,
      timeRange: {
        earliest: earliestTime === Infinity ? 0 : earliestTime,
        latest: latestTimestamp
      }
    };
  }

  /**
   * Get security alerts based on recent activity
   */
  async getSecurityAlerts(timeWindow: number = 3600000): Promise<AuditLogEntry[]> {
    const now = Date.now();
    const startTime = now - timeWindow;

    const recentLogs = Array.from(this.auditLogs.values())
      .filter(log => log.timestamp >= startTime);

    const alerts: AuditLogEntry[] = [];

    // Count events by severity in the time window
    const severityCounts: { [key: string]: number } = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const log of recentLogs) {
      severityCounts[log.severity]++;

      // Check if threshold exceeded
      if (severityCounts[log.severity] >= this.alertThresholds[log.severity]) {
        alerts.push(log);
      }
    }

    // Also include all critical events
    const criticalEvents = recentLogs.filter(log => log.severity === 'critical');
    alerts.push(...criticalEvents);

    // Remove duplicates and sort
    const uniqueAlerts = Array.from(new Set(alerts.map(a => a.logId)))
      .map(logId => this.auditLogs.get(logId)!)
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp);

    return uniqueAlerts;
  }

  /**
   * Generate audit report
   */
  async generateReport(query: AuditQuery): Promise<{
    summary: AuditStatistics;
    logs: AuditLogEntry[];
    alerts: AuditLogEntry[];
    recommendations: string[];
  }> {
    const logs = await this.queryLogs(query);
    const statistics = await this.getStatistics(query);
    const alerts = await this.getSecurityAlerts();

    const recommendations = this.generateRecommendations(statistics, alerts);

    return {
      summary: statistics,
      logs,
      alerts,
      recommendations
    };
  }

  /**
   * Clear old audit logs
   */
  clearOldLogs(maxAge: number = 2592000000): number {
    const now = Date.now();
    let clearedCount = 0;

    for (const [logId, log] of this.auditLogs.entries()) {
      if (now - log.timestamp > maxAge) {
        this.auditLogs.delete(logId);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  /**
   * Export audit logs
   */
  exportLogs(query?: AuditQuery): string {
    const logs = query 
      ? Array.from(this.auditLogs.values()).filter(log => {
        if (query.userId && log.userId !== query.userId) return false;
        if (query.deviceId && log.deviceId !== query.deviceId) return false;
        if (query.eventType && log.eventType !== query.eventType) return false;
        if (query.eventCategory && log.eventCategory !== query.eventCategory) return false;
        if (query.severity && log.severity !== query.severity) return false;
        if (query.startTime && log.timestamp < query.startTime) return false;
        if (query.endTime && log.timestamp > query.endTime) return false;
        return true;
      })
      : Array.from(this.auditLogs.values());

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Import audit logs
   */
  importLogs(logsData: string): number {
    try {
      const logs = JSON.parse(logsData) as AuditLogEntry[];
      let importedCount = 0;

      for (const log of logs) {
        if (!this.auditLogs.has(log.logId)) {
          this.auditLogs.set(log.logId, log);
          importedCount++;
        }
      }

      return importedCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Set alert thresholds
   */
  setAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  /**
   * Get alert thresholds
   */
  getAlertThresholds(): typeof this.alertThresholds {
    return { ...this.alertThresholds };
  }

  /**
   * Check if event meets alert thresholds
   */
  private async checkAlertThresholds(log: AuditLogEntry): Promise<void> {
    const now = Date.now();
    const timeWindow = 3600000; // 1 hour
    const startTime = now - timeWindow;

    const recentLogs = Array.from(this.auditLogs.values())
      .filter(l => l.timestamp >= startTime && l.eventType === log.eventType);

    const count = recentLogs.length + 1; // Include current event
    const threshold = this.alertThresholds[log.severity];

    if (count >= threshold) {
      // Log an alert event
      await this.logEvent({
        eventType: 'security_alert',
        eventCategory: 'general',
        severity: log.severity === 'critical' ? 'critical' : 'high',
        details: {
          triggerEvent: log.eventType,
          count,
          threshold,
          originalLog: log.logId
        },
        success: true,
        metadata: {}
      });
    }
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    statistics: AuditStatistics,
    alerts: AuditLogEntry[]
  ): string[] {
    const recommendations: string[] = [];

    // High failure rate
    if (statistics.failureRate > 30) {
      recommendations.push('High failure rate detected. Review authentication mechanisms and error handling.');
    }

    // Critical events
    if (statistics.criticalEvents > 0) {
      recommendations.push('Critical security events detected. Immediate investigation required.');
    }

    // Recent alerts
    if (alerts.length > 5) {
      recommendations.push('Multiple security alerts in recent time window. Review system security posture.');
    }

    // Category-specific recommendations
    if (statistics.logsByCategory['zk_proof'] > 100) {
      recommendations.push('High volume of zero-knowledge proof operations. Monitor for potential abuse.');
    }

    if (statistics.logsByCategory['biometrics'] > 100) {
      recommendations.push('High volume of biometric authentication attempts. Monitor for potential brute force attacks.');
    }

    if (statistics.logsByCategory['blockchain'] > 50) {
      recommendations.push('High volume of blockchain operations. Review evidence chain integrity.');
    }

    if (recommendations.length === 0) {
      recommendations.push('No immediate security concerns detected. Continue monitoring.');
    }

    return recommendations;
  }

  /**
   * Get log by ID
   */
  getLog(logId: string): AuditLogEntry | undefined {
    return this.auditLogs.get(logId);
  }

  /**
   * Delete log by ID
   */
  deleteLog(logId: string): boolean {
    return this.auditLogs.delete(logId);
  }

  /**
   * Get total log count
   */
  getTotalLogCount(): number {
    return this.auditLogs.size;
  }
}

export const securityAuditService = new SecurityAuditService();
