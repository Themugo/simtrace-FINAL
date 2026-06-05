// Queue Infrastructure Foundation
// BullMQ-based job queue system with Redis backend

import { Queue, Worker, QueueOptions, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
  lazyConnect: true,          // connect explicitly in initializeQueues()
});

redisConnection.on('error', (err) => console.error('Redis Client Error', err));

// Queue configuration
const queueOptions: QueueOptions = {
  connection: redisConnection as ConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 5000,
      age: 7 * 24 * 3600, // 7 days
    },
  },
};

// Queue definitions
export const telecomLookupQueue = new Queue('telecom-lookup', queueOptions);
export const aiProcessingQueue = new Queue('ai-processing', queueOptions);
export const emailQueue = new Queue('email', queueOptions);
export const smsQueue = new Queue('sms', queueOptions);
export const deviceSyncQueue = new Queue('device-sync', queueOptions);
export const notificationQueue = new Queue('notification', queueOptions);
export const webhookRetryQueue = new Queue('webhook-retry', queueOptions);

// Dead-letter queues for failed jobs
export const telecomLookupDLQ = new Queue('telecom-lookup-dlq', queueOptions);
export const aiProcessingDLQ = new Queue('ai-processing-dlq', queueOptions);
export const webhookRetryDLQ = new Queue('webhook-retry-dlq', queueOptions);

// Initialize queues
export async function initializeQueues() {
  try {
    // BullMQ's Queue constructors already begin connecting the shared connection,
    // so only call connect() if it is still in the lazy "wait" state — otherwise
    // ioredis throws "Redis is already connecting/connected". ping() then confirms.
    if (redisConnection.status === 'wait') {
      await redisConnection.connect();
    }
    await redisConnection.ping();
    console.log('[Queue] Redis connected successfully');
    console.log('[Queue] All queues initialized');
  } catch (error) {
    console.error('[Queue] Failed to initialize queues:', error);
    throw error;
  }
}

// Job types
export const JobTypes = {
  TELECOM_LOOKUP: 'telecom-lookup',
  AI_RISK_ASSESSMENT: 'ai-risk-assessment',
  AI_FRAUD_DETECTION: 'ai-fraud-detection',
  EMAIL_SEND: 'email-send',
  SMS_SEND: 'sms-send',
  DEVICE_SYNC: 'device-sync',
  NOTIFICATION_SEND: 'notification-send',
  WEBHOOK_RETRY: 'webhook-retry',
};

// Priority levels
export const JobPriority = {
  CRITICAL: 1,
  HIGH: 3,
  NORMAL: 5,
  LOW: 7,
  BACKGROUND: 10,
};

// Export queues for use in workers
export const queues = {
  telecomLookup: telecomLookupQueue,
  aiProcessing: aiProcessingQueue,
  email: emailQueue,
  sms: smsQueue,
  deviceSync: deviceSyncQueue,
  notification: notificationQueue,
  webhookRetry: webhookRetryQueue,
};
