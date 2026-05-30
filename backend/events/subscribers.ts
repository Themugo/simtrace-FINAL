import { on, emitAsync } from './index.js';
// @ts-ignore - logAuditEvent import issue
import { logAuditEvent } from '../modules/audit/audit.js';
import { assessDeviceRisk } from '../modules/risk/engine.js';
import { getRedisClient } from '../services/redis.js';

// ── Event Subscribers ───────────────────────────────────────────────────────────
// These functions subscribe to events and perform actions in response

// Audit logging subscriber
on('device.detected', async (event) => {
  await logAuditEvent({
    action: 'device_detected',
    userId: event.userId,
    organizationId: event.organizationId,
    resourceType: 'device',
    resourceId: event.data.imei,
    details: event.data,
  });
});

on('device.locked', async (event) => {
  await logAuditEvent({
    action: 'device_locked',
    userId: event.userId,
    organizationId: event.organizationId,
    resourceType: 'device',
    resourceId: event.data.deviceId,
    details: event.data,
  });
});

on('device.unlocked', async (event) => {
  await logAuditEvent({
    action: 'device_unlocked',
    userId: event.userId,
    organizationId: event.organizationId,
    resourceType: 'device',
    resourceId: event.data.deviceId,
    details: event.data,
  });
});

on('user.login', async (event) => {
  await logAuditEvent({
    action: 'user_login',
    userId: event.userId,
    organizationId: event.organizationId,
    resourceType: 'user',
    resourceId: event.userId,
    details: event.data,
  });
});

on('case.created', async (event) => {
  await logAuditEvent({
    action: 'case_created',
    userId: event.userId,
    organizationId: event.organizationId,
    resourceType: 'case',
    resourceId: event.data.caseId,
    details: event.data,
  });
});

on('payment.completed', async (event) => {
  await logAuditEvent({
    action: 'payment_completed',
    userId: event.userId,
    organizationId: event.organizationId,
    resourceType: 'payment',
    resourceId: event.data.paymentId,
    details: event.data,
  });
});

// Risk assessment subscriber
on('location.detected', async (event) => {
  const { imei, lat, lng, ipAddress, deviceInfo } = event.data;
  
  // Trigger risk assessment
  const riskAssessment = await assessDeviceRisk(imei, ipAddress, deviceInfo);
  
  // Emit risk calculated event
  await emitAsync('risk.calculated', {
    imei,
    riskAssessment,
  }, {
    userId: event.userId,
    organizationId: event.organizationId,
    correlationId: event.correlationId,
  });
  
  // If risk is high, emit high risk event
  if (riskAssessment.threatLevel === 'HIGH' || riskAssessment.threatLevel === 'CRITICAL') {
    await emitAsync('risk.high', {
      imei,
      riskAssessment,
      location: { lat, lng },
    }, {
      userId: event.userId,
      organizationId: event.organizationId,
      correlationId: event.correlationId,
    });
  }
});

// SIM change alert subscriber
on('sim.changed', async (event) => {
  const { imei, oldSimIccid, newSimIccid } = event.data;
  
  await logAuditEvent({
    action: 'sim_changed',
    userId: event.userId,
    organizationId: event.organizationId,
    resourceType: 'device',
    resourceId: imei,
    details: event.data,
  });
  
  // Trigger risk assessment
  const riskAssessment = await assessDeviceRisk(imei);
  
  await emitAsync('risk.changed', {
    imei,
    riskAssessment,
    changeType: 'sim_swap',
  }, {
    userId: event.userId,
    organizationId: event.organizationId,
    correlationId: event.correlationId,
  });
});

// Redis pub/sub subscriber for distributed events
export async function setupRedisEventSubscriber() {
  const redis = getRedisClient();
  const subscriber = redis.duplicate();
  
  await subscriber.connect();
  
  subscriber.subscribe('simtrace:events', (message) => {
    try {
      const event = JSON.parse(message);
      emit(event.name, event.data, event.metadata);
    } catch (error) {
      console.error('[EventBus] Error processing Redis event:', error);
    }
  });
  
  console.log('[EventBus] Redis event subscriber initialized');
}

// Publish event to Redis for distributed systems
export async function publishEvent(eventName: string, data: any, metadata?: any) {
  const redis = getRedisClient();
  
  await redis.publish('simtrace:events', JSON.stringify({
    name: eventName,
    data,
    metadata,
  }));
}
