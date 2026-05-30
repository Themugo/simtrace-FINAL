// Notification Worker
// Handles email, SMS, and push notifications

import { Worker } from 'bullmq';
import { queues, JobTypes } from '../index.js';

const notificationWorker = new Worker(
  'notification',
  async (job) => {
    const { type, recipient, data } = job.data;

    console.log(`[Notification Worker] Processing job ${job.id}: ${type} to ${recipient}`);

    try {
      let result;

      switch (type) {
        case 'email':
          result = await sendEmail(recipient, data);
          break;
        case 'sms':
          result = await sendSMS(recipient, data);
          break;
        case 'push':
          result = await sendPushNotification(recipient, data);
          break;
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      console.log(`[Notification Worker] Job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      console.error(`[Notification Worker] Job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 10,
    limiter: {
      max: 200,
      duration: 60000, // 200 notifications per minute
    },
  }
);

// Notification functions
async function sendEmail(recipient, data) {
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`[Email] Sent to ${recipient}: ${data.subject}`);
  
  return {
    type: 'email',
    recipient,
    subject: data.subject,
    sentAt: new Date().toISOString(),
    status: 'sent',
  };
}

async function sendSMS(recipient, data) {
  // Simulate SMS sending
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log(`[SMS] Sent to ${recipient}: ${data.message}`);
  
  return {
    type: 'sms',
    recipient,
    message: data.message,
    sentAt: new Date().toISOString(),
    status: 'sent',
  };
}

async function sendPushNotification(recipient, data) {
  // Simulate push notification
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log(`[Push] Sent to ${recipient}: ${data.title}`);
  
  return {
    type: 'push',
    recipient,
    title: data.title,
    sentAt: new Date().toISOString(),
    status: 'sent',
  };
}

// Worker events
notificationWorker.on('completed', (job) => {
  console.log(`[Notification Worker] Job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[Notification Worker] Job ${job?.id} failed:`, err.message);
});

notificationWorker.on('error', (err) => {
  console.error('[Notification Worker] Worker error:', err);
});

export default notificationWorker;
