import { EventEmitter } from 'events';

// ── Worker Infrastructure ─────────────────────────────────────────────────────────
// This provides a worker system for offloading heavy tasks from the API server

export interface WorkerJob {
  id: string;
  type: 'ai_processing' | 'export' | 'telemetry_analysis' | 'email_fanout' | 'report' | 'analytics';
  data: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  result?: Record<string, unknown>;
}

export interface WorkerConfig {
  maxConcurrentJobs: number;
  retryAttempts: number;
  retryDelay: number;
}

class WorkerManager extends EventEmitter {
  private queue: WorkerJob[] = [];
  private processing: Map<string, WorkerJob> = new Map();
  private config: WorkerConfig = {
    maxConcurrentJobs: 5,
    retryAttempts: 3,
    retryDelay: 5000,
  };

  // Add a job to the queue
  addJob(type: WorkerJob['type'], data: Record<string, unknown>, priority: WorkerJob['priority'] = 'medium'): string {
    const job: WorkerJob = {
      id: this.generateJobId(),
      type,
      data,
      priority,
      createdAt: new Date(),
      status: 'pending',
    };

    this.queue.push(job);
    this.queue.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));

    this.emit('job:added', job);
    this.processQueue();

    return job.id;
  }

  // Get job status
  getJob(jobId: string): WorkerJob | null {
    // Check processing jobs
    const processingJob = this.processing.get(jobId);
    if (processingJob) return processingJob;

    // Check queued jobs
    return this.queue.find(j => j.id === jobId) || null;
  }

  // Get all jobs (optionally filtered by status)
  getJobs(status?: WorkerJob['status']): WorkerJob[] {
    const allJobs = [...Array.from(this.processing.values()), ...this.queue];
    return status ? allJobs.filter(j => j.status === status) : allJobs;
  }

  // Cancel a job
  cancelJob(jobId: string): boolean {
    // Remove from queue if pending
    const queueIndex = this.queue.findIndex(j => j.id === jobId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      this.emit('job:cancelled', jobId);
      return true;
    }

    // Cannot cancel processing jobs (they would need to be killed)
    return false;
  }

  // Process the job queue
  private async processQueue(): Promise<void> {
    while (this.processing.size < this.config.maxConcurrentJobs && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.processing.set(job.id, job);
      job.status = 'processing';
      job.startedAt = new Date();

      this.emit('job:started', job);

      // Process job in background
      this.processJob(job).catch(error => {
        console.error(`[Worker] Error processing job ${job.id}:`, error);
      });
    }
  }

  // Process a single job
  private async processJob(job: WorkerJob): Promise<void> {
    let attempts = 0;

    while (attempts <= this.config.retryAttempts) {
      try {
        const result = await this.executeJob(job);

        job.status = 'completed';
        job.completedAt = new Date();
        job.result = result;

        this.processing.delete(job.id);
        this.emit('job:completed', job);

        return;
      } catch (error) {
        attempts++;

        if (attempts > this.config.retryAttempts) {
          job.status = 'failed';
          job.completedAt = new Date();
          job.error = error instanceof Error ? error.message : String(error);

          this.processing.delete(job.id);
          this.emit('job:failed', job);
          return;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }
  }

  // Execute a job based on its type
  private async executeJob(job: WorkerJob): Promise<Record<string, unknown>> {
    switch (job.type) {
      case 'ai_processing':
        return this.processAIJob(job.data);
      case 'export':
        return this.processExportJob(job.data);
      case 'telemetry_analysis':
        return this.processTelemetryJob(job.data);
      case 'email_fanout':
        return this.processEmailJob(job.data);
      case 'report':
        return this.processReportJob(job.data);
      case 'analytics':
        return this.processAnalyticsJob(job.data);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  // Job processors (to be implemented)
  private async processAIJob(_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // AI processing logic
    return { success: true };
  }

  private async processExportJob(_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Export logic
    return { success: true };
  }

  private async processTelemetryJob(_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Telemetry analysis logic
    return { success: true };
  }

  private async processEmailJob(_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Email fanout logic
    return { success: true };
  }

  private async processReportJob(_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Report generation logic
    return { success: true };
  }

  private async processAnalyticsJob(_data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Analytics aggregation logic
    return { success: true };
  }

  // Helper: Get priority score for sorting
  private getPriorityScore(priority: WorkerJob['priority']): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority];
  }

  // Helper: Generate job ID
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update configuration
  updateConfig(config: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get queue statistics
  getStats() {
    return {
      queueLength: this.queue.length,
      processingCount: this.processing.size,
      maxConcurrentJobs: this.config.maxConcurrentJobs,
    };
  }
}

// Singleton instance
export const workerManager = new WorkerManager();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addAIJob(data: Record<string, unknown>, priority?: WorkerJob['priority']): string {
  return workerManager.addJob('ai_processing', data, priority);
}

export function addExportJob(data: Record<string, unknown>, priority?: WorkerJob['priority']): string {
  return workerManager.addJob('export', data, priority);
}

export function addTelemetryJob(data: Record<string, unknown>, priority?: WorkerJob['priority']): string {
  return workerManager.addJob('telemetry_analysis', data, priority);
}

export function addEmailJob(data: Record<string, unknown>, priority?: WorkerJob['priority']): string {
  return workerManager.addJob('email_fanout', data, priority);
}

export function addReportJob(data: Record<string, unknown>, priority?: WorkerJob['priority']): string {
  return workerManager.addJob('report', data, priority);
}

export function addAnalyticsJob(data: Record<string, unknown>, priority?: WorkerJob['priority']): string {
  return workerManager.addJob('analytics', data, priority);
}
