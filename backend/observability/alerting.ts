// Alerting System
// Monitors system metrics and triggers alerts on thresholds

import { incrementError } from './metrics.js';

// Alert thresholds
const thresholds = {
  errorRate: 0.05, // 5% error rate
  queueFailureRate: 0.1, // 10% queue failure rate
  apiTimeoutRate: 0.02, // 2% API timeout rate
  cpuUsage: 80, // 80% CPU usage
  memoryUsage: 85, // 85% memory usage
  diskUsage: 90, // 90% disk usage
};

// Alert state
const alertState = {
  errorCount: 0,
  totalRequests: 0,
  queueFailures: 0,
  totalQueueJobs: 0,
  apiTimeouts: 0,
  totalApiCalls: 0,
};

// Check error rate
export function checkErrorRate(): void {
  if (alertState.totalRequests === 0) return;
  
  const errorRate = alertState.errorCount / alertState.totalRequests;
  
  if (errorRate > thresholds.errorRate) {
    triggerAlert('HIGH_ERROR_RATE', 'error', {
      currentRate: errorRate,
      threshold: thresholds.errorRate,
      errorCount: alertState.errorCount,
      totalRequests: alertState.totalRequests,
    });
  }
}

// Check queue failure rate
export function checkQueueFailureRate(): void {
  if (alertState.totalQueueJobs === 0) return;
  
  const failureRate = alertState.queueFailures / alertState.totalQueueJobs;
  
  if (failureRate > thresholds.queueFailureRate) {
    triggerAlert('HIGH_QUEUE_FAILURE_RATE', 'error', {
      currentRate: failureRate,
      threshold: thresholds.queueFailureRate,
      failures: alertState.queueFailures,
      totalJobs: alertState.totalQueueJobs,
    });
  }
}

// Check API timeout rate
export function checkApiTimeoutRate(): void {
  if (alertState.totalApiCalls === 0) return;
  
  const timeoutRate = alertState.apiTimeouts / alertState.totalApiCalls;
  
  if (timeoutRate > thresholds.apiTimeoutRate) {
    triggerAlert('HIGH_API_TIMEOUT_RATE', 'warning', {
      currentRate: timeoutRate,
      threshold: thresholds.apiTimeoutRate,
      timeouts: alertState.apiTimeouts,
      totalCalls: alertState.totalApiCalls,
    });
  }
}

// Trigger alert
function triggerAlert(alertType: string, severity: string, details: any): void {
  console.error(`[ALERT] ${alertType}:`, details);
  incrementError(alertType, severity);
  
  // In production, send to alerting system (PagerDuty, Slack, etc.)
  // For now, just log to console
}

// Update alert state
export function recordRequest(isError = false): void {
  alertState.totalRequests++;
  if (isError) {
    alertState.errorCount++;
  }
}

export function recordQueueJob(isFailure = false): void {
  alertState.totalQueueJobs++;
  if (isFailure) {
    alertState.queueFailures++;
  }
}

export function recordApiCall(isTimeout = false): void {
  alertState.totalApiCalls++;
  if (isTimeout) {
    alertState.apiTimeouts++;
  }
}

// Reset alert state (call periodically)
export function resetAlertState(): void {
  alertState.errorCount = 0;
  alertState.totalRequests = 0;
  alertState.queueFailures = 0;
  alertState.totalQueueJobs = 0;
  alertState.apiTimeouts = 0;
  alertState.totalApiCalls = 0;
}

// Start alert monitoring
export function startAlertMonitoring(intervalMs = 60000): void {
  setInterval(() => {
    checkErrorRate();
    checkQueueFailureRate();
    checkApiTimeoutRate();
    resetAlertState();
  }, intervalMs);
  
  console.log('[Alerting] Monitoring started');
}
