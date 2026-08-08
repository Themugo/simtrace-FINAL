// services/enterprise/slaMonitoring.ts - SLA monitoring and alerting
import crypto from 'crypto';

export interface SLA {
  slaId: string;
  tenantId: string;
  name: string;
  description: string;
  serviceType: 'api' | 'storage' | 'bandwidth' | 'support' | 'uptime';
  metrics: {
    uptimeTarget: number; // percentage
    responseTimeTarget: number; // milliseconds
    errorRateTarget: number; // percentage
    availabilityTarget: number; // percentage
  };
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  penalties: {
    uptimeBelowThreshold: number; // percentage refund
    responseTimeAboveThreshold: number; // percentage refund
    errorRateAboveThreshold: number; // percentage refund
  };
  isActive: boolean;
  startDate: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SLAMetric {
  metricId: string;
  slaId: string;
  timestamp: number;
  uptime: number;
  responseTime: number;
  errorRate: number;
  availability: number;
  requests: number;
  errors: number;
}

export interface SLAViolation {
  violationId: string;
  slaId: string;
  tenantId: string;
  metricType: 'uptime' | 'response_time' | 'error_rate' | 'availability';
  threshold: number;
  actualValue: number;
  severity: 'minor' | 'major' | 'critical';
  startTime: number;
  endTime?: number;
  duration?: number;
  resolved: boolean;
  penalty?: number;
}

export interface SLAReport {
  reportId: string;
  slaId: string;
  tenantId: string;
  period: { start: number; end: number };
  metrics: {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    availability: number;
  };
  compliance: {
    uptime: boolean;
    responseTime: boolean;
    errorRate: boolean;
    availability: boolean;
    overall: boolean;
  };
  violations: SLAViolation[];
  credits: number;
  generatedAt: number;
}

export class SLAMonitoringService {
  private slas: Map<string, SLA> = new Map();
  private metrics: Map<string, SLAMetric> = new Map();
  private violations: Map<string, SLAViolation> = new Map();
  private reports: Map<string, SLAReport> = new Map();

  /**
   * Create SLA
   */
  createSLA(
    tenantId: string,
    name: string,
    description: string,
    serviceType: 'api' | 'storage' | 'bandwidth' | 'support' | 'uptime',
    metrics: {
      uptimeTarget: number;
      responseTimeTarget: number;
      errorRateTarget: number;
      availabilityTarget: number;
    },
    billingPeriod: 'monthly' | 'quarterly' | 'yearly',
    penalties: {
      uptimeBelowThreshold: number;
      responseTimeAboveThreshold: number;
      errorRateAboveThreshold: number;
    },
    startDate: number,
    endDate?: number
  ): SLA {
    const slaId = crypto.randomBytes(16).toString('hex');

    const sla: SLA = {
      slaId,
      tenantId,
      name,
      description,
      serviceType,
      metrics,
      billingPeriod,
      penalties,
      isActive: true,
      startDate,
      endDate,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.slas.set(slaId, sla);
    return sla;
  }

  /**
   * Get SLA by ID
   */
  getSLA(slaId: string): SLA | null {
    return this.slas.get(slaId) || null;
  }

  /**
   * Get SLAs for tenant
   */
  getSLAsForTenant(tenantId: string): SLA[] {
    return Array.from(this.slas.values())
      .filter(s => s.tenantId === tenantId && s.isActive);
  }

  /**
   * Update SLA
   */
  updateSLA(
    slaId: string,
    updates: {
      name?: string;
      description?: string;
      metrics?: {
        uptimeTarget?: number;
        responseTimeTarget?: number;
        errorRateTarget?: number;
        availabilityTarget?: number;
      };
      penalties?: {
        uptimeBelowThreshold?: number;
        responseTimeAboveThreshold?: number;
        errorRateAboveThreshold?: number;
      };
      isActive?: boolean;
      endDate?: number;
    }
  ): SLA | null {
    const sla = this.slas.get(slaId);
    
    if (!sla) {
      return null;
    }

    if (updates.name) sla.name = updates.name;
    if (updates.description) sla.description = updates.description;
    if (updates.metrics) sla.metrics = { ...sla.metrics, ...updates.metrics };
    if (updates.penalties) sla.penalties = { ...sla.penalties, ...updates.penalties };
    if (updates.isActive !== undefined) sla.isActive = updates.isActive;
    if (updates.endDate !== undefined) sla.endDate = updates.endDate;

    sla.updatedAt = Date.now();
    this.slas.set(slaId, sla);

    return sla;
  }

  /**
   * Delete SLA
   */
  deleteSLA(slaId: string): boolean {
    const sla = this.slas.get(slaId);
    
    if (sla) {
      sla.isActive = false;
      this.slas.set(slaId, sla);
      return true;
    }

    return false;
  }

  /**
   * Record metric
   */
  recordMetric(
    slaId: string,
    uptime: number,
    responseTime: number,
    errorRate: number,
    availability: number,
    requests: number,
    errors: number
  ): SLAMetric {
    const metricId = crypto.randomBytes(16).toString('hex');

    const metric: SLAMetric = {
      metricId,
      slaId,
      timestamp: Date.now(),
      uptime,
      responseTime,
      errorRate,
      availability,
      requests,
      errors
    };

    this.metrics.set(metricId, metric);

    // Check for SLA violations
    this.checkSLAViolations(slaId, metric);

    return metric;
  }

  /**
   * Check for SLA violations
   */
  private checkSLAViolations(slaId: string, metric: SLAMetric): void {
    const sla = this.slas.get(slaId);
    
    if (!sla || !sla.isActive) {
      return;
    }

    // Check uptime
    if (metric.uptime < sla.metrics.uptimeTarget) {
      this.createViolation(slaId, 'uptime', sla.metrics.uptimeTarget, metric.uptime);
    }

    // Check response time
    if (metric.responseTime > sla.metrics.responseTimeTarget) {
      this.createViolation(slaId, 'response_time', sla.metrics.responseTimeTarget, metric.responseTime);
    }

    // Check error rate
    if (metric.errorRate > sla.metrics.errorRateTarget) {
      this.createViolation(slaId, 'error_rate', sla.metrics.errorRateTarget, metric.errorRate);
    }

    // Check availability
    if (metric.availability < sla.metrics.availabilityTarget) {
      this.createViolation(slaId, 'availability', sla.metrics.availabilityTarget, metric.availability);
    }
  }

  /**
   * Create violation
   */
  private createViolation(
    slaId: string,
    metricType: 'uptime' | 'response_time' | 'error_rate' | 'availability',
    threshold: number,
    actualValue: number
  ): void {
    const sla = this.slas.get(slaId);
    
    if (!sla) {
      return;
    }

    // Check if there's an active violation for this metric type
    const existingViolation = Array.from(this.violations.values())
      .find(v => v.slaId === slaId && v.metricType === metricType && !v.resolved);

    if (existingViolation) {
      return; // Already tracking this violation
    }

    const violationId = crypto.randomBytes(16).toString('hex');

    // Calculate severity
    const deviation = metricType === 'response_time' || metricType === 'error_rate'
      ? (actualValue - threshold) / threshold
      : (threshold - actualValue) / threshold;

    let severity: 'minor' | 'major' | 'critical';
    if (deviation < 0.1) severity = 'minor';
    else if (deviation < 0.25) severity = 'major';
    else severity = 'critical';

    const violation: SLAViolation = {
      violationId,
      slaId,
      tenantId: sla.tenantId,
      metricType,
      threshold,
      actualValue,
      severity,
      startTime: Date.now(),
      resolved: false
    };

    this.violations.set(violationId, violation);
  }

  /**
   * Resolve violation
   */
  resolveViolation(violationId: string): boolean {
    const violation = this.violations.get(violationId);
    
    if (violation && !violation.resolved) {
      violation.resolved = true;
      violation.endTime = Date.now();
      violation.duration = violation.endTime - violation.startTime;

      // Calculate penalty
      const sla = this.slas.get(violation.slaId);
      if (sla) {
        let penalty = 0;
        
        switch (violation.metricType) {
          case 'uptime':
            penalty = sla.penalties.uptimeBelowThreshold;
            break;
          case 'response_time':
            penalty = sla.penalties.responseTimeAboveThreshold;
            break;
          case 'error_rate':
            penalty = sla.penalties.errorRateAboveThreshold;
            break;
          case 'availability':
            penalty = sla.penalties.uptimeBelowThreshold;
            break;
        }

        // Adjust penalty based on severity
        if (violation.severity === 'minor') penalty *= 0.5;
        if (violation.severity === 'critical') penalty *= 1.5;

        violation.penalty = penalty;
      }

      this.violations.set(violationId, violation);
      return true;
    }

    return false;
  }

  /**
   * Get violations for SLA
   */
  getViolationsForSLA(slaId: string, includeResolved: boolean = false): SLAViolation[] {
    return Array.from(this.violations.values())
      .filter(v => v.slaId === slaId && (includeResolved || !v.resolved))
      .sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Get violations for tenant
   */
  getViolationsForTenant(tenantId: string, includeResolved: boolean = false): SLAViolation[] {
    return Array.from(this.violations.values())
      .filter(v => v.tenantId === tenantId && (includeResolved || !v.resolved))
      .sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * Get metrics for SLA
   */
  getMetricsForSLA(slaId: string, startTime: number, endTime: number): SLAMetric[] {
    return Array.from(this.metrics.values())
      .filter(m => m.slaId === slaId && m.timestamp >= startTime && m.timestamp <= endTime)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Generate SLA report
   */
  generateSLAReport(slaId: string, period: { start: number; end: number }): SLAReport {
    const sla = this.slas.get(slaId);
    
    if (!sla) {
      throw new Error('SLA not found');
    }

    const metrics = this.getMetricsForSLA(slaId, period.start, period.end);

    // Calculate averages
    const uptime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.uptime, 0) / metrics.length
      : 100;

    const averageResponseTime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
      : 0;

    const errorRate = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length
      : 0;

    const availability = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.availability, 0) / metrics.length
      : 100;

    // Check compliance
    const compliance = {
      uptime: uptime >= sla.metrics.uptimeTarget,
      responseTime: averageResponseTime <= sla.metrics.responseTimeTarget,
      errorRate: errorRate <= sla.metrics.errorRateTarget,
      availability: availability >= sla.metrics.availabilityTarget,
      overall: false
    };

    compliance.overall = compliance.uptime && compliance.responseTime && compliance.errorRate && compliance.availability;

    // Get violations for the period
    const violations = this.getViolationsForSLA(slaId, true)
      .filter(v => v.startTime >= period.start && v.startTime <= period.end);

    // Calculate credits
    let credits = 0;
    for (const violation of violations) {
      if (violation.resolved && violation.penalty) {
        credits += violation.penalty;
      }
    }

    const reportId = crypto.randomBytes(16).toString('hex');

    const report: SLAReport = {
      reportId,
      slaId,
      tenantId: sla.tenantId,
      period,
      metrics: {
        uptime,
        averageResponseTime,
        errorRate,
        availability
      },
      compliance,
      violations,
      credits,
      generatedAt: Date.now()
    };

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Get report by ID
   */
  getReport(reportId: string): SLAReport | null {
    return this.reports.get(reportId) || null;
  }

  /**
   * Get reports for SLA
   */
  getReportsForSLA(slaId: string, limit: number = 50): SLAReport[] {
    return Array.from(this.reports.values())
      .filter(r => r.slaId === slaId)
      .sort((a, b) => b.generatedAt - a.generatedAt)
      .slice(0, limit);
  }

  /**
   * Get reports for tenant
   */
  getReportsForTenant(tenantId: string, limit: number = 50): SLAReport[] {
    return Array.from(this.reports.values())
      .filter(r => r.tenantId === tenantId)
      .sort((a, b) => b.generatedAt - a.generatedAt)
      .slice(0, limit);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSLAs: number;
    totalMetrics: number;
    totalViolations: number;
    activeViolations: number;
    totalReports: number;
    violationsByType: { [key: string]: number };
    violationsBySeverity: { [key: string]: number };
    totalCredits: number;
  } {
    const slas = Array.from(this.slas.values());
    const violations = Array.from(this.violations.values());
    const reports = Array.from(this.reports.values());

    const violationsByType: { [key: string]: number } = {};
    const violationsBySeverity: { [key: string]: number } = {};

    for (const violation of violations) {
      violationsByType[violation.metricType] = (violationsByType[violation.metricType] || 0) + 1;
      violationsBySeverity[violation.severity] = (violationsBySeverity[violation.severity] || 0) + 1;
    }

    const totalCredits = reports.reduce((sum, r) => sum + r.credits, 0);

    return {
      totalSLAs: slas.length,
      totalMetrics: this.metrics.size,
      totalViolations: violations.length,
      activeViolations: violations.filter(v => !v.resolved).length,
      totalReports: reports.length,
      violationsByType,
      violationsBySeverity,
      totalCredits
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(maxAge: number = 2592000000): number {
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
   * Clear old reports
   */
  clearOldReports(maxAge: number = 7776000000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [reportId, report] of this.reports.entries()) {
      if (now - report.generatedAt > maxAge) {
        this.reports.delete(reportId);
        cleared++;
      }
    }

    return cleared;
  }
}

export const slaMonitoringService = new SLAMonitoringService();
