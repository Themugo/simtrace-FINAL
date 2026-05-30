// Audit Logging System
// Logs admin actions, tenant actions, login attempts, security events

import pino, { Logger } from 'pino';

const auditLogger: Logger = pino({
  level: 'info',
  transport: {
    target: 'pino/file',
    options: {
      destination: './logs/audit.log',
    },
  },
});

export function logAdminAction(userId: string, action: string, details: any = {}): void {
  auditLogger.info({
    type: 'admin_action',
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function logTenantAction(tenantId: string, userId: string, action: string, details: any = {}): void {
  auditLogger.info({
    type: 'tenant_action',
    tenantId,
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function logLoginAttempt(userId: string, email: string, success: boolean, ip: string, details: any = {}): void {
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

export function logSecurityEvent(eventType: string, severity: string, details: any = {}): void {
  auditLogger.warn({
    type: 'security_event',
    eventType,
    severity,
    details,
    timestamp: new Date().toISOString(),
  });
}

export function logPaymentEvent(userId: string, paymentId: string, amount: number, status: string, details: any = {}): void {
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

export function logApiAccess(userId: string, endpoint: string, method: string, statusCode: number, details: any = {}): void {
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
