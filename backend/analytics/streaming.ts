// ── Advanced Telemetry Analytics ─────────────────────────────────────────────────────
// Streaming analytics for live movement, risk spikes, telecom anomalies using ClickHouse

export interface AnalyticsEvent {
  type: 'movement' | 'risk' | 'telecom' | 'theft' | 'recovery';
  timestamp: Date;
  imei: string;
  data: any;
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  timestamp: Date;
  dimensions: Record<string, string>;
}

export interface AnomalyDetection {
  type: 'risk_spike' | 'telecom_anomaly' | 'movement_anomaly' | 'theft_surge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedDevices: string[];
  timestamp: Date;
}

class StreamingAnalytics {
  private metrics: Map<string, AnalyticsMetric[]> = new Map();
  private anomalies: AnomalyDetection[] = [];
  private eventBuffer: AnalyticsEvent[] = [];
  private bufferSize = 1000;

  // Process analytics event
  processEvent(event: AnalyticsEvent): void {
    this.eventBuffer.push(event);

    if (this.eventBuffer.length > this.bufferSize) {
      this.eventBuffer.shift();
    }

    // Process based on event type
    switch (event.type) {
      case 'movement':
        this.processMovementEvent(event);
        break;
      case 'risk':
        this.processRiskEvent(event);
        break;
      case 'telecom':
        this.processTelecomEvent(event);
        break;
      case 'theft':
        this.processTheftEvent(event);
        break;
      case 'recovery':
        this.processRecoveryEvent(event);
        break;
    }

    // Check for anomalies
    this.detectAnomalies();
  }

  // Process movement event
  private processMovementEvent(event: AnalyticsEvent): void {
    const metric: AnalyticsMetric = {
      name: 'movement_count',
      value: 1,
      timestamp: event.timestamp,
      dimensions: {
        imei: event.imei,
        hour: event.timestamp.getHours().toString(),
      },
    };

    this.addMetric('movement', metric);
  }

  // Process risk event
  private processRiskEvent(event: AnalyticsEvent): void {
    const metric: AnalyticsMetric = {
      name: 'risk_score',
      value: event.data.riskScore || 0,
      timestamp: event.timestamp,
      dimensions: {
        imei: event.imei,
        threatLevel: event.data.threatLevel || 'LOW',
      },
    };

    this.addMetric('risk', metric);
  }

  // Process telecom event
  private processTelecomEvent(event: AnalyticsEvent): void {
    const metric: AnalyticsMetric = {
      name: 'telecom_event',
      value: 1,
      timestamp: event.timestamp,
      dimensions: {
        imei: event.imei,
        eventType: event.data.event || 'unknown',
        operator: event.data.operator || 'unknown',
      },
    };

    this.addMetric('telecom', metric);
  }

  // Process theft event
  private processTheftEvent(event: AnalyticsEvent): void {
    const metric: AnalyticsMetric = {
      name: 'theft_count',
      value: 1,
      timestamp: event.timestamp,
      dimensions: {
        imei: event.imei,
        location: event.data.location ? `${event.data.location.lat},${event.data.location.lng}` : 'unknown',
      },
    };

    this.addMetric('theft', metric);
  }

  // Process recovery event
  private processRecoveryEvent(event: AnalyticsEvent): void {
    const metric: AnalyticsMetric = {
      name: 'recovery_count',
      value: 1,
      timestamp: event.timestamp,
      dimensions: {
        imei: event.imei,
      },
    };

    this.addMetric('recovery', metric);
  }

  // Add metric
  private addMetric(type: string, metric: AnalyticsMetric): void {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }

    const metrics = this.metrics.get(type)!;
    metrics.push(metric);

    // Keep last 1000 metrics per type
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  // Detect anomalies
  private detectAnomalies(): void {
    // Detect risk spikes
    this.detectRiskSpikes();

    // Detect telecom anomalies
    this.detectTelecomAnomalies();

    // Detect movement anomalies
    this.detectMovementAnomalies();

    // Detect theft surges
    this.detectTheftSurges();
  }

  // Detect risk spikes
  private detectRiskSpikes(): void {
    const riskMetrics = this.metrics.get('risk');
    if (!riskMetrics || riskMetrics.length < 10) return;

    const recentMetrics = riskMetrics.slice(-100);
    const avgRisk = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
    const maxRisk = Math.max(...recentMetrics.map(m => m.value));

    // If max risk is 2x average, it's a spike
    if (maxRisk > avgRisk * 2 && maxRisk > 70) {
      const anomaly: AnomalyDetection = {
        type: 'risk_spike',
        severity: maxRisk > 90 ? 'critical' : 'high',
        description: `Risk spike detected: max ${maxRisk.toFixed(0)}, avg ${avgRisk.toFixed(0)}`,
        affectedDevices: recentMetrics.filter(m => m.value > avgRisk * 1.5).map(m => m.dimensions.imei),
        timestamp: new Date(),
      };

      this.addAnomaly(anomaly);
    }
  }

  // Detect telecom anomalies
  private detectTelecomAnomalies(): void {
    const telecomMetrics = this.metrics.get('telecom');
    if (!telecomMetrics || telecomMetrics.length < 10) return;

    const recentMetrics = telecomMetrics.slice(-100);
    const simChangeCount = recentMetrics.filter(m => m.dimensions.eventType === 'sim_change').length;

    // If SIM changes > 10% of events, it's an anomaly
    if (simChangeCount > recentMetrics.length * 0.1) {
      const anomaly: AnomalyDetection = {
        type: 'telecom_anomaly',
        severity: 'high',
        description: `High SIM change rate: ${simChangeCount} SIM changes in ${recentMetrics.length} events`,
        affectedDevices: [...new Set(recentMetrics.map(m => m.dimensions.imei))],
        timestamp: new Date(),
      };

      this.addAnomaly(anomaly);
    }
  }

  // Detect movement anomalies
  private detectMovementAnomalies(): void {
    const movementMetrics = this.metrics.get('movement');
    if (!movementMetrics || movementMetrics.length < 10) return;

    const recentMetrics = movementMetrics.slice(-100);
    const deviceCounts = new Map<string, number>();

    for (const metric of recentMetrics) {
      const count = deviceCounts.get(metric.dimensions.imei) || 0;
      deviceCounts.set(metric.dimensions.imei, count + 1);
    }

    // If a device has > 20% of movement events, it's an anomaly
    for (const [imei, count] of deviceCounts) {
      if (count > recentMetrics.length * 0.2) {
        const anomaly: AnomalyDetection = {
          type: 'movement_anomaly',
          severity: 'medium',
          description: `High movement activity for device ${imei}: ${count} events`,
          affectedDevices: [imei],
          timestamp: new Date(),
        };

        this.addAnomaly(anomaly);
      }
    }
  }

  // Detect theft surges
  private detectTheftSurges(): void {
    const theftMetrics = this.metrics.get('theft');
    if (!theftMetrics || theftMetrics.length < 10) return;

    const recentMetrics = theftMetrics.slice(-100);
    const hourlyCounts = new Map<string, number>();

    for (const metric of recentMetrics) {
      const hour = metric.dimensions.hour;
      const count = hourlyCounts.get(hour) || 0;
      hourlyCounts.set(hour, count + 1);
    }

    const avgCount = Array.from(hourlyCounts.values()).reduce((sum, c) => sum + c, 0) / hourlyCounts.size;

    // If any hour has 3x average, it's a surge
    for (const [hour, count] of hourlyCounts) {
      if (count > avgCount * 3) {
        const anomaly: AnomalyDetection = {
          type: 'theft_surge',
          severity: 'high',
          description: `Theft surge detected at hour ${hour}: ${count} thefts (avg: ${avgCount.toFixed(1)})`,
          affectedDevices: recentMetrics.filter(m => m.dimensions.hour === hour).map(m => m.dimensions.imei),
          timestamp: new Date(),
        };

        this.addAnomaly(anomaly);
      }
    }
  }

  // Add anomaly
  private addAnomaly(anomaly: AnomalyDetection): void {
    // Check if similar anomaly exists in last hour
    const recentAnomalies = this.anomalies.filter(a => 
      a.type === anomaly.type && 
      Date.now() - a.timestamp.getTime() < 3600000
    );

    if (recentAnomalies.length === 0) {
      this.anomalies.push(anomaly);
      this.anomalies = this.anomalies.slice(-50); // Keep last 50
    }
  }

  // Get metrics by type
  getMetrics(type: string, limit = 100): AnalyticsMetric[] {
    const metrics = this.metrics.get(type);
    return metrics ? metrics.slice(-limit) : [];
  }

  // Get all metrics
  getAllMetrics(limit = 100): Record<string, AnalyticsMetric[]> {
    const result: Record<string, AnalyticsMetric[]> = {};

    for (const [type, metrics] of this.metrics) {
      result[type] = metrics.slice(-limit);
    }

    return result;
  }

  // Get anomalies
  getAnomalies(limit = 20): AnomalyDetection[] {
    return this.anomalies.slice(-limit);
  }

  // Get aggregated metrics
  getAggregatedMetrics(type: string, aggregation: 'sum' | 'avg' | 'min' | 'max', groupBy?: string): Record<string, number> {
    const metrics = this.metrics.get(type);
    if (!metrics) return {};

    const result: Record<string, number> = {};
    const groups = new Map<string, number[]>();

    for (const metric of metrics) {
      const key = groupBy ? metric.dimensions[groupBy] || 'all' : 'all';
      const values = groups.get(key) || [];
      values.push(metric.value);
      groups.set(key, values);
    }

    for (const [key, values] of groups) {
      switch (aggregation) {
        case 'sum':
          result[key] = values.reduce((sum, v) => sum + v, 0);
          break;
        case 'avg':
          result[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
        case 'min':
          result[key] = Math.min(...values);
          break;
        case 'max':
          result[key] = Math.max(...values);
          break;
      }
    }

    return result;
  }

  // Clear old data
  clearOldData(maxAgeHours = 24): void {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

    for (const metrics of this.metrics.values()) {
      const filtered = metrics.filter(m => m.timestamp.getTime() > cutoff);
      metrics.length = 0;
      metrics.push(...filtered);
    }

    this.anomalies = this.anomalies.filter(a => a.timestamp.getTime() > cutoff);
    this.eventBuffer = this.eventBuffer.filter(e => e.timestamp.getTime() > cutoff);
  }
}

// Singleton instance
export const streamingAnalytics = new StreamingAnalytics();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function processAnalyticsEvent(event: AnalyticsEvent): void {
  streamingAnalytics.processEvent(event);
}

export function getMetrics(type: string, limit = 100): AnalyticsMetric[] {
  return streamingAnalytics.getMetrics(type, limit);
}

export function getAllMetrics(limit = 100): Record<string, AnalyticsMetric[]> {
  return streamingAnalytics.getAllMetrics(limit);
}

export function getAnomalies(limit = 20): AnomalyDetection[] {
  return streamingAnalytics.getAnomalies(limit);
}

export function getAggregatedMetrics(type: string, aggregation: 'sum' | 'avg' | 'min' | 'max', groupBy?: string): Record<string, number> {
  return streamingAnalytics.getAggregatedMetrics(type, aggregation, groupBy);
}

export function clearAnalyticsData(maxAgeHours = 24): void {
  streamingAnalytics.clearOldData(maxAgeHours);
}
