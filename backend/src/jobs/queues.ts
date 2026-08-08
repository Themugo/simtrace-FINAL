import { logger } from "../config/logger.js";
import { SimTraceEvent } from "../events/types.js";

export type QueueName = "DEVICE_EVENTS_QUEUE" | "REPORT_QUEUE" | "NOTIFICATION_QUEUE" | "SYSTEM_QUEUE";

export interface Job<T = any> {
  id: string;
  name: string;
  queue: QueueName;
  data: T;
  timestamp: number;
  attempts: number;
}

class QueueManager {
  private queues: Map<QueueName, Job[]> = new Map([
    ["DEVICE_EVENTS_QUEUE", []],
    ["REPORT_QUEUE", []],
    ["NOTIFICATION_QUEUE", []],
    ["SYSTEM_QUEUE", []],
  ]);

  public async addJob<T>(queue: QueueName, name: string, data: T): Promise<Job<T>> {
    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      queue,
      data,
      timestamp: Date.now(),
      attempts: 0,
    };

    const targetQueue = this.queues.get(queue) || [];
    targetQueue.push(job);
    this.queues.set(queue, targetQueue);

    logger.info(`[Queue] Added job ${job.id} (${name}) to ${queue}`);

    // Process job asynchronously with retry strategy
    this.processJob(job);

    return job;
  }

  private async processJob(job: Job): Promise<void> {
    job.attempts += 1;
    try {
      logger.info(`[Worker] Processing job ${job.id} (${job.name}) on ${job.queue}...`);
      // Simulate asynchronous heavy processing
      await new Promise((resolve) => setTimeout(resolve, 50));
      logger.info(`[Worker] Job ${job.id} completed successfully.`);
    } catch (err: any) {
      logger.error(`[Worker] Job ${job.id} failed on attempt ${job.attempts}: ${err.message}`);
      if (job.attempts < 3) {
        logger.info(`[Worker] Retrying job ${job.id} in 500ms...`);
        setTimeout(() => this.processJob(job), 500);
      } else {
        logger.error(`[Worker] Job ${job.id} moved to Dead Letter Queue after 3 failed attempts.`);
      }
    }
  }

  public getQueueStats() {
    return {
      DEVICE_EVENTS_QUEUE: (this.queues.get("DEVICE_EVENTS_QUEUE") || []).length,
      REPORT_QUEUE: (this.queues.get("REPORT_QUEUE") || []).length,
      NOTIFICATION_QUEUE: (this.queues.get("NOTIFICATION_QUEUE") || []).length,
      SYSTEM_QUEUE: (this.queues.get("SYSTEM_QUEUE") || []).length,
    };
  }
}

export const queueManager = new QueueManager();
