import { on, emit, emitAsync } from './index.js';
import { createAuditLog } from '../modules/audit/audit.js';
import { assessDeviceRisk } from '../modules/risk/engine.js';
import { getRedisClient } from '../services/redis.js';

// ── Event Subscribers ───────────────────────────────────────────────────────────
// These functions subscribe to events and perform actions in response

const audit = (a: string, userId?: string, _orgId?: string, resourceType?: string, resourceId?: string, details?: Record<string, any>) =>
  createAuditLog({ action: a as any, userId: userId || '', resourceType, resourceId, details: details as any });

// Audit logging subscriber
on('device.detected', async (event) => {
  audit('device_detected', event.userId, event.organizationId, 'device', event.data.imei, event.data);
});

on('device.locked', async (event) => {
  audit('device_locked', event.userId, event.organizationId, 'device', event.data.deviceId, event.data);
});

on('device.unlocked', async (event) => {
  audit('device_unlocked', event.userId, event.organizationId, 'device', event.data.deviceId, event.data);
});

on('user.login', async (event) => {
  audit('user_login', event.userId, event.organizationId, 'user', event.userId, event.data);
});

on('case.created', async (event) => {
  audit('case_created', event.userId, event.organizationId, 'case', event.data.caseId, event.data);
});

on('payment.completed', async (event) => {
  audit('payment_completed', event.userId, event.organizationId, 'payment', event.data.paymentId, event.data);
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
  const { imei, oldSimIccid: _oldSimIccid, newSimIccid: _newSimIccid } = event.data;
  
  audit('sim_changed', event.userId, event.organizationId, 'device', imei, event.data);
  
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
  
  subscriber.subscribe('simtrace:events', (message: any) => {
    try {
      if (typeof message !== 'string') return;
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
