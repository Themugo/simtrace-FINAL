// Webhook Retry Worker
// Handles webhook delivery with retry logic

import { Worker, Job } from 'bullmq';

const webhookWorker = new Worker(
  'webhook-retry',
  async (job: Job) => {
    const { url, payload, headers, attempt } = job.data;

    console.log(`[Webhook Worker] Processing job ${job.id}: POST to ${url} (attempt ${attempt})`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      console.log(`[Webhook Worker] Job ${job.id} completed successfully`);
      return {
        success: true,
        statusCode: response.status,
        response: responseData,
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[Webhook Worker] Job ${job.id} failed:`, (error as Error).message);
      
      // Add retry information to job data
      job.data.attempt = (job.data.attempt || 0) + 1;
      
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 20,
    limiter: {
      max: 500,
      duration: 60000, // 500 webhooks per minute
    },
  }
);

// Worker events
webhookWorker.on('completed', (job: Job) => {
  console.log(`[Webhook Worker] Job ${job.id} completed`);
});

webhookWorker.on('failed', (job, err: Error) => {
  console.error(`[Webhook Worker] Job ${job?.id} failed:`, err.message);
  
  // Move to dead-letter queue after max retries
  if (job && job.attemptsMade != null && job.opts?.attempts != null && job.attemptsMade >= job.opts.attempts) {
    console.log(`[Webhook Worker] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
  }
});

webhookWorker.on('error', (err: Error) => {
  console.error('[Webhook Worker] Worker error:', err);
});

export default webhookWorker;
