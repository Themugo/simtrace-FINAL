// ── Full Observability Platform ───────────────────────────────────────────────────
// OpenTelemetry, distributed tracing, requests, queues, AI jobs, websocket flows

export interface Trace {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  service: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'started' | 'completed' | 'error';
  tags: Record<string, string>;
  logs: Array<{ timestamp: Date; level: string; message: string }>;
  metadata?: Record<string, any>;
}

export interface Metric {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
}

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userId?: string;
  deviceId?: string;
}

export interface QueueMetrics {
  queueName: string;
  operation: 'enqueue' | 'dequeue' | 'process' | 'error';
  duration?: number;
  timestamp: Date;
  jobId?: string;
}

export interface AIJobMetrics {
  jobId: string;
  jobType: string;
  model: string;
  tokensUsed: number;
  duration: number;
  timestamp: Date;
  status: 'started' | 'completed' | 'error';
}

export interface WebSocketMetrics {
  connectionId: string;
  event: string;
  duration?: number;
  timestamp: Date;
  userId?: string;
  deviceId?: string;
}

class ObservabilityPlatform {
  private traces: Map<string, Trace> = new Map();
  private metrics: Map<string, Metric[]> = new Map();
  private logs: LogEntry[] = [];
  private requestMetrics: RequestMetrics[] = [];
  private queueMetrics: QueueMetrics[] = [];
  private aiJobMetrics: AIJobMetrics[] = [];
  private webSocketMetrics: WebSocketMetrics[] = [];

  // Create trace
  createTrace(operation: string, service: string, parentSpanId?: string): Trace {
    const trace: Trace = {
      id: `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      traceId: parentSpanId ? this.getTraceBySpanId(parentSpanId)?.traceId || this.generateTraceId() : this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId,
      operation,
      service,
      startTime: new Date(),
      status: 'started',
      tags: {},
      logs: [],
    };

    this.traces.set(trace.id, trace);
    return trace;
  }

  // End trace
  endTrace(traceId: string, status: 'completed' | 'error' = 'completed'): Trace | null {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();
    trace.status = status;

    return trace;
  }

  // Add tag to trace
  addTraceTag(traceId: string, key: string, value: string): boolean {
    const trace = this.traces.get(traceId);
    if (!trace) return false;

    trace.tags[key] = value;
    return true;
  }

  // Add log to trace
  addTraceLog(traceId: string, level: string, message: string): boolean {
    const trace = this.traces.get(traceId);
    if (!trace) return false;

    trace.logs.push({
      timestamp: new Date(),
      level,
      message,
    });
    return true;
  }

  // Get trace
  getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }

  // Get trace by span ID
  getTraceBySpanId(spanId: string): Trace | undefined {
    return Array.from(this.traces.values()).find(t => t.spanId === spanId);
  }

  // Get all traces
  getAllTraces(): Trace[] {
    return Array.from(this.traces.values());
  }

  // Get traces by operation
  getTracesByOperation(operation: string): Trace[] {
    return Array.from(this.traces.values()).filter(t => t.operation === operation);
  }

  // Record metric
  recordMetric(name: string, type: 'counter' | 'gauge' | 'histogram', value: number, tags: Record<string, string> = {}): Metric {
    const metric: Metric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      value,
      timestamp: new Date(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);
    return metric;
  }

  // Get metrics
  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  // Get all metric names
  getAllMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  // Log
  log(level: 'debug' | 'info' | 'warn' | 'error', service: string, message: string, context?: Record<string, any>, traceId?: string, spanId?: string): LogEntry {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      service,
      message,
      context,
      traceId,
      spanId,
    };

    this.logs.push(logEntry);
    return logEntry;
  }

  // Get logs
  getLogs(level?: 'debug' | 'info' | 'warn' | 'error', service?: string, limit = 100): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(l => l.level === level);
    }

    if (service) {
      filtered = filtered.filter(l => l.service === service);
    }

    return filtered.slice(-limit);
  }

  // Record request metric
  recordRequestMetric(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics);
  }

  // Get request metrics
  getRequestMetrics(path?: string, method?: string, limit = 100): RequestMetrics[] {
    let filtered = this.requestMetrics;

    if (path) {
      filtered = filtered.filter(m => m.path === path);
    }

    if (method) {
      filtered = filtered.filter(m => m.method === method);
    }

    return filtered.slice(-limit);
  }

  // Get request statistics
  getRequestStatistics(): {
    totalRequests: number;
    avgDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
    errorRate: number;
  } {
    const durations = this.requestMetrics.map(m => m.duration).sort((a, b) => a - b);
    const errors = this.requestMetrics.filter(m => m.statusCode >= 400).length;

    return {
      totalRequests: this.requestMetrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
      p50Duration: durations[Math.floor(durations.length * 0.5)] || 0,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
      errorRate: errors / this.requestMetrics.length || 0,
    };
  }

  // Record queue metric
  recordQueueMetric(metrics: QueueMetrics): void {
    this.queueMetrics.push(metrics);
  }

  // Get queue metrics
  getQueueMetrics(queueName?: string, operation?: string, limit = 100): QueueMetrics[] {
    let filtered = this.queueMetrics;

    if (queueName) {
      filtered = filtered.filter(m => m.queueName === queueName);
    }

    if (operation) {
      filtered = filtered.filter(m => m.operation === operation);
    }

    return filtered.slice(-limit);
  }

  // Get queue statistics
  getQueueStatistics(queueName: string): {
    totalOperations: number;
    avgProcessTime: number;
    errorRate: number;
  } {
    const queueMetrics = this.queueMetrics.filter(m => m.queueName === queueName);
    const processMetrics = queueMetrics.filter(m => m.operation === 'process' && m.duration);
    const errors = queueMetrics.filter(m => m.operation === 'error').length;

    return {
      totalOperations: queueMetrics.length,
      avgProcessTime: processMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / processMetrics.length || 0,
      errorRate: errors / queueMetrics.length || 0,
    };
  }

  // Record AI job metric
  recordAIJobMetric(metrics: AIJobMetrics): void {
    this.aiJobMetrics.push(metrics);
  }

  // Get AI job metrics
  getAIJobMetrics(jobType?: string, model?: string, limit = 100): AIJobMetrics[] {
    let filtered = this.aiJobMetrics;

    if (jobType) {
      filtered = filtered.filter(m => m.jobType === jobType);
    }

    if (model) {
      filtered = filtered.filter(m => m.model === model);
    }

    return filtered.slice(-limit);
  }

  // Get AI job statistics
  getAIJobStatistics(): {
    totalJobs: number;
    avgTokensUsed: number;
    avgDuration: number;
    errorRate: number;
    byModel: Record<string, { count: number; avgTokens: number }>;
  } {
    const byModel: Record<string, { count: number; avgTokens: number }> = {};
    const errors = this.aiJobMetrics.filter(m => m.status === 'error').length;

    for (const metric of this.aiJobMetrics) {
      if (!byModel[metric.model]) {
        byModel[metric.model] = { count: 0, avgTokens: 0 };
      }
      byModel[metric.model].count++;
      byModel[metric.model].avgTokens += metric.tokensUsed;
    }

    for (const model in byModel) {
      byModel[model].avgTokens /= byModel[model].count;
    }

    return {
      totalJobs: this.aiJobMetrics.length,
      avgTokensUsed: this.aiJobMetrics.reduce((sum, m) => sum + m.tokensUsed, 0) / this.aiJobMetrics.length || 0,
      avgDuration: this.aiJobMetrics.reduce((sum, m) => sum + m.duration, 0) / this.aiJobMetrics.length || 0,
      errorRate: errors / this.aiJobMetrics.length || 0,
      byModel,
    };
  }

  // Record WebSocket metric
  recordWebSocketMetric(metrics: WebSocketMetrics): void {
    this.webSocketMetrics.push(metrics);
  }

  // Get WebSocket metrics
  getWebSocketMetrics(event?: string, limit = 100): WebSocketMetrics[] {
    let filtered = this.webSocketMetrics;

    if (event) {
      filtered = filtered.filter(m => m.event === event);
    }

    return filtered.slice(-limit);
  }

  // Get WebSocket statistics
  getWebSocketStatistics(): {
    totalConnections: number;
    totalEvents: number;
    avgDuration: number;
    byEvent: Record<string, number>;
  } {
    const byEvent: Record<string, number> = {};

    for (const metric of this.webSocketMetrics) {
      byEvent[metric.event] = (byEvent[metric.event] || 0) + 1;
    }

    const durations = this.webSocketMetrics.filter(m => m.duration).map(m => m.duration!);

    return {
      totalConnections: new Set(this.webSocketMetrics.map(m => m.connectionId)).size,
      totalEvents: this.webSocketMetrics.length,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
      byEvent,
    };
  }

  // Clear old data
  clearOldData(maxAgeHours = 24): void {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

    for (const [id, trace] of this.traces) {
      if (trace.startTime.getTime() < cutoff) {
        this.traces.delete(id);
      }
    }

    for (const [name, metrics] of this.metrics) {
      this.metrics.set(name, metrics.filter(m => m.timestamp.getTime() > cutoff));
    }

    this.logs = this.logs.filter(l => l.timestamp.getTime() > cutoff);
    this.requestMetrics = this.requestMetrics.filter(m => m.timestamp.getTime() > cutoff);
    this.queueMetrics = this.queueMetrics.filter(m => m.timestamp.getTime() > cutoff);
    this.aiJobMetrics = this.aiJobMetrics.filter(m => m.timestamp.getTime() > cutoff);
    this.webSocketMetrics = this.webSocketMetrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  // Get statistics
  getStatistics(): {
    totalTraces: number;
    totalMetrics: number;
    totalLogs: number;
    totalRequestMetrics: number;
    totalQueueMetrics: number;
    totalAIJobMetrics: number;
    totalWebSocketMetrics: number;
  } {
    const totalMetrics = Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0);

    return {
      totalTraces: this.traces.size,
      totalMetrics,
      totalLogs: this.logs.length,
      totalRequestMetrics: this.requestMetrics.length,
      totalQueueMetrics: this.queueMetrics.length,
      totalAIJobMetrics: this.aiJobMetrics.length,
      totalWebSocketMetrics: this.webSocketMetrics.length,
    };
  }

  // Generate trace ID
  private generateTraceId(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 16)}`;
  }

  // Generate span ID
  private generateSpanId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

// Singleton instance
export const observability = new ObservabilityPlatform();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function createTrace(operation: string, service: string, parentSpanId?: string): Trace {
  return observability.createTrace(operation, service, parentSpanId);
}

export function endTrace(traceId: string, status?: 'completed' | 'error'): Trace | null {
  return observability.endTrace(traceId, status);
}

export function addTraceTag(traceId: string, key: string, value: string): boolean {
  return observability.addTraceTag(traceId, key, value);
}

export function addTraceLog(traceId: string, level: string, message: string): boolean {
  return observability.addTraceLog(traceId, level, message);
}

export function recordMetric(name: string, type: 'counter' | 'gauge' | 'histogram', value: number, tags?: Record<string, string>): Metric {
  return observability.recordMetric(name, type, value, tags);
}

export function log(level: 'debug' | 'info' | 'warn' | 'error', service: string, message: string, context?: Record<string, any>, traceId?: string, spanId?: string): LogEntry {
  return observability.log(level, service, message, context, traceId, spanId);
}

export function recordRequestMetric(metrics: RequestMetrics): void {
  observability.recordRequestMetric(metrics);
}

export function recordQueueMetric(metrics: QueueMetrics): void {
  observability.recordQueueMetric(metrics);
}

export function recordAIJobMetric(metrics: AIJobMetrics): void {
  observability.recordAIJobMetric(metrics);
}

export function recordWebSocketMetric(metrics: WebSocketMetrics): void {
  observability.recordWebSocketMetric(metrics);
}

export function getObservabilityStatistics() {
  return observability.getStatistics();
}

export function getRequestStatistics() {
  return observability.getRequestStatistics();
}

export function getQueueStatistics(queueName: string) {
  return observability.getQueueStatistics(queueName);
}

export function getAIJobStatistics() {
  return observability.getAIJobStatistics();
}

export function getWebSocketStatistics() {
  return observability.getWebSocketStatistics();
}
