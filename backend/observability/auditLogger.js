// Audit Logging System
// Logs admin actions, tenant actions, login attempts, security events

import pino from 'pino';

const auditLogger = pino({
  level: 'info',
  transport: {
    target: 'pino/file',
    options: {
      destination: './logs/audit.log',
    },
  },
});

export function logAdminAction(userId, action, details = {}) {
  auditLogger.info({
    type: 'admin_action',
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function logTenantAction(tenantId, userId, action, details = {}) {
  auditLogger.info({
    type: 'tenant_action',
    tenantId,
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function logLoginAttempt(userId, email, success, ip, details = {}) {
  auditLogger.info({
    type: 'login_attempt',
    userId,
    email,
    success,
    ip,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function logSecurityEvent(eventType, severity, details = {}) {
  auditLogger.warn({
    type: 'security_event',
    eventType,
    severity,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function logPaymentEvent(userId, paymentId, amount, status, details = {}) {
  auditLogger.info({
    type: 'payment_event',
    userId,
    paymentId,
    amount,
    status,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function logApiAccess(userId, endpoint, method, statusCode, details = {}) {
  auditLogger.info({
    type: 'api_access',
    userId,
    endpoint,
    method,
    statusCode,
    details,
    timestamp: new Date().toISOString(),
  });
}

export default auditLogger;
