// ── Stream Consumers ─────────────────────────────────────────────────────────────
// These consumers process events from Kafka/Redpanda streams

import { getStreamManager, STREAM_TOPICS } from './kafka.js';
import { emit } from '../events/index.js';
import { assessDeviceRisk } from '../modules/risk/engine.js';
import { logAuditEvent } from '../modules/audit/audit.js';

// ── Tracking Events Consumer ─────────────────────────────────────────────────────
export async function startTrackingEventsConsumer(): Promise<void> {
  const manager = getStreamManager();

  await manager.subscribe(
    STREAM_TOPICS.TRACKING_EVENTS,
    'tracking-consumer-group',
    async (message) => {
      const { imei, location, timestamp } = message.value;

      // Emit location detected event
      emit('location.detected', {
        imei,
        location,
        timestamp,
      });

      // Emit device detected event
      emit('device.detected', {
        imei,
        timestamp,
        location,
      });
    }
  );
}

// ── Risk Events Consumer ────────────────────────────────────────────────────────
export async function startRiskEventsConsumer(): Promise<void> {
  const manager = getStreamManager();

  await manager.subscribe(
    STREAM_TOPICS.RISK_EVENTS,
    'risk-consumer-group',
    async (message) => {
      const { imei, riskAssessment } = message.value;

      // Emit risk calculated event
      emit('risk.calculated', {
        imei,
        riskAssessment,
      });

      // If risk is high, emit high risk event
      if (riskAssessment.threatLevel === 'HIGH' || riskAssessment.threatLevel === 'CRITICAL') {
        emit('risk.high', {
          imei,
          riskAssessment,
        });
      }
    }
  );
}

// ── Audit Events Consumer ────────────────────────────────────────────────────────
export async function startAuditEventsConsumer(): Promise<void> {
  const manager = getStreamManager();

  await manager.subscribe(
    STREAM_TOPICS.AUDIT_EVENTS,
    'audit-consumer-group',
    async (message) => {
      const { action, userId, organizationId, resourceType, resourceId, details } = message.value;

      // Log audit event to database
      await logAuditEvent({
        action,
        userId,
        organizationId,
        resourceType,
        resourceId,
        details,
      });
    }
  );
}

// ── Notifications Consumer ───────────────────────────────────────────────────────
export async function startNotificationsConsumer(): Promise<void> {
  const manager = getStreamManager();

  await manager.subscribe(
    STREAM_TOPICS.NOTIFICATIONS,
    'notifications-consumer-group',
    async (message) => {
      const { type, userId, recipients, subject, content } = message.value;

      // Process notification based on type
      switch (type) {
        case 'email':
          // Send email notification
          break;
        case 'sms':
          // Send SMS notification
          break;
        case 'push':
          // Send push notification
          break;
        case 'websocket':
          // Send websocket notification
          break;
        default:
          console.warn(`Unknown notification type: ${type}`);
      }
    }
  );
}

// ── Analytics Events Consumer ────────────────────────────────────────────────────
export async function startAnalyticsEventsConsumer(): Promise<void> {
  const manager = getStreamManager();

  await manager.subscribe(
    STREAM_TOPICS.ANALYTICS_EVENTS,
    'analytics-consumer-group',
    async (message) => {
      const { type, data } = message.value;

      // Process analytics event
      switch (type) {
        case 'movement':
          // Update movement analytics
          break;
        case 'risk':
          // Update risk analytics
          break;
        case 'theft':
          // Update theft analytics
          break;
        case 'recovery':
          // Update recovery analytics
          break;
        default:
          console.warn(`Unknown analytics type: ${type}`);
      }
    }
  );
}

// ── AI Events Consumer ───────────────────────────────────────────────────────────
export async function startAIEventsConsumer(): Promise<void> {
  const manager = getStreamManager();

  await manager.subscribe(
    STREAM_TOPICS.AI_EVENTS,
    'ai-consumer-group',
    async (message) => {
      const { type, data } = message.value;

      // Process AI event
      switch (type) {
        case 'report_generated':
          // Handle AI report generation
          break;
        case 'pattern_detected':
          // Handle pattern detection
          break;
        case 'prediction':
          // Handle AI prediction
          break;
        default:
          console.warn(`Unknown AI event type: ${type}`);
      }
    }
  );
}

// ── Start All Consumers ─────────────────────────────────────────────────────────
export async function startAllConsumers(): Promise<void> {
  await Promise.all([
    startTrackingEventsConsumer(),
    startRiskEventsConsumer(),
    startAuditEventsConsumer(),
    startNotificationsConsumer(),
    startAnalyticsEventsConsumer(),
    startAIEventsConsumer(),
  ]);
}

// ── Stop All Consumers ──────────────────────────────────────────────────────────
export async function stopAllConsumers(): Promise<void> {
  const manager = getStreamManager();
  
  await Promise.all([
    manager.unsubscribe(STREAM_TOPICS.TRACKING_EVENTS, 'tracking-consumer-group'),
    manager.unsubscribe(STREAM_TOPICS.RISK_EVENTS, 'risk-consumer-group'),
    manager.unsubscribe(STREAM_TOPICS.AUDIT_EVENTS, 'audit-consumer-group'),
    manager.unsubscribe(STREAM_TOPICS.NOTIFICATIONS, 'notifications-consumer-group'),
    manager.unsubscribe(STREAM_TOPICS.ANALYTICS_EVENTS, 'analytics-consumer-group'),
    manager.unsubscribe(STREAM_TOPICS.AI_EVENTS, 'ai-consumer-group'),
  ]);
}
