// Prometheus Metrics Collection
import promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Database operation duration
const dbOperationDuration = new promClient.Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
});

// Queue job duration
const queueJobDuration = new promClient.Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of queue jobs in seconds',
  labelNames: ['queue', 'job_type', 'status'],
  buckets: [0.5, 1, 5, 10, 30, 60],
});

// Queue job counter
const queueJobCounter = new promClient.Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'job_type', 'status'],
});

// Active connections gauge
const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type'],
});

// Error rate counter
const errorCounter = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
});

// Business metrics
const devicesTracked = new promClient.Gauge({
  name: 'devices_tracked_total',
  help: 'Total number of devices being tracked',
});

const alertsGenerated = new promClient.Counter({
  name: 'alerts_generated_total',
  help: 'Total number of alerts generated',
  labelNames: ['alert_type', 'severity'],
});

const imeiChecksPerformed = new promClient.Counter({
  name: 'imei_checks_total',
  help: 'Total number of IMEI checks performed',
  labelNames: ['result'],
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);
register.registerMetric(dbOperationDuration);
register.registerMetric(queueJobDuration);
register.registerMetric(queueJobCounter);
register.registerMetric(activeConnections);
register.registerMetric(errorCounter);
register.registerMetric(devicesTracked);
register.registerMetric(alertsGenerated);
register.registerMetric(imeiChecksPerformed);

// Middleware to track HTTP requests
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      { method: req.method, route: req.path, status_code: res.statusCode },
      duration
    );
    httpRequestCounter.inc({ method: req.method, route: req.path, status_code: res.statusCode });
  });
  
  next();
}

// Helper functions to update metrics
export function trackDbOperation(operation, collection, duration) {
  dbOperationDuration.observe({ operation, collection }, duration);
}

export function trackQueueJob(queue, jobType, status, duration) {
  queueJobDuration.observe({ queue, jobType, status }, duration);
  queueJobCounter.inc({ queue, jobType, status });
}

export function setActiveConnections(type, count) {
  activeConnections.set({ type }, count);
}

export function incrementError(type, severity = 'error') {
  errorCounter.inc({ type, severity });
}

export function setDevicesTracked(count) {
  devicesTracked.set(count);
}

export function incrementAlert(alertType, severity) {
  alertsGenerated.inc({ alert_type: alertType, severity });
}

export function incrementImeiCheck(result) {
  imeiChecksPerformed.inc({ result });
}

// Metrics endpoint
export async function metricsEndpoint(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

export { register, httpRequestDuration, httpRequestCounter };
