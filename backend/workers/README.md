# Worker Infrastructure

Background worker system for offloading heavy tasks from the API server.

## Features

- **Job Queue**: Priority-based job queue with concurrent processing
- **Job Types**: AI processing, exports, telemetry analysis, email fanout, reports, analytics
- **Retry Logic**: Configurable retry attempts and delays
- **Event Emission**: Events for job lifecycle (added, started, completed, failed)
- **Statistics**: Queue length and processing count monitoring

## Job Types

### AI Processing
- Report generation
- Timeline analysis
- Pattern detection

### Export Jobs
- PDF export
- CSV export
- XLSX export

### Telemetry Analysis
- Movement analysis
- Behavior analysis
- Risk analysis

### Email Fanout
- Bulk email sending
- Alert notifications
- Report delivery

### Report Generation
- Weekly risk reports
- Recovery summaries
- Organization analytics

### Analytics Aggregation
- Theft hotspots
- Recovery rates
- Movement heatmaps
- Risk trends

## Usage

### Add a Job

```typescript
import { 
  addAIJob, 
  addExportJob, 
  addTelemetryJob, 
  addEmailJob, 
  addReportJob, 
  addAnalyticsJob 
} from './workers/index.js';

// Add AI job
const jobId = addAIJob({
  type: 'report_generation',
  imei: '123456789012345',
}, 'high');

// Add export job
const jobId = addExportJob({
  type: 'pdf',
  format: 'pdf',
  data: { devices: [...] },
  filename: 'devices.pdf',
}, 'medium');

// Add telemetry job
const jobId = addTelemetryJob({
  imei: '123456789012345',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  analysisType: 'movement',
}, 'low');

// Add email job
const jobId = addEmailJob({
  type: 'alert',
  recipients: ['user1@example.com', 'user2@example.com'],
  subject: 'Device Alert',
  template: 'alert',
  data: { device: '...' },
}, 'high');

// Add report job
const jobId = addReportJob({
  type: 'weekly_risk',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-07'),
}, 'medium');

// Add analytics job
const jobId = addAnalyticsJob({
  type: 'theft_hotspots',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
}, 'low');
```

### Monitor Jobs

```typescript
import { workerManager } from './workers/index.js';

// Get job status
const job = workerManager.getJob('job_id');
console.log('Job status:', job?.status);

// Get all jobs
const allJobs = workerManager.getJobs();

// Get jobs by status
const pendingJobs = workerManager.getJobs('pending');
const processingJobs = workerManager.getJobs('processing');
const completedJobs = workerManager.getJobs('completed');

// Get queue statistics
const stats = workerManager.getStats();
console.log('Queue stats:', stats);
// { queueLength: 10, processingCount: 3, maxConcurrentJobs: 5 }
```

### Listen to Job Events

```typescript
import { workerManager } from './workers/index.js';

workerManager.on('job:added', (job) => {
  console.log('Job added:', job.id);
});

workerManager.on('job:started', (job) => {
  console.log('Job started:', job.id);
});

workerManager.on('job:completed', (job) => {
  console.log('Job completed:', job.id, job.result);
});

workerManager.on('job:failed', (job) => {
  console.log('Job failed:', job.id, job.error);
});

workerManager.on('job:cancelled', (jobId) => {
  console.log('Job cancelled:', jobId);
});
```

### Cancel a Job

```typescript
import { workerManager } from './workers/index.js';

const cancelled = workerManager.cancelJob('job_id');
if (cancelled) {
  console.log('Job cancelled successfully');
}
```

### Update Configuration

```typescript
import { workerManager } from './workers/index.js';

workerManager.updateConfig({
  maxConcurrentJobs: 10,
  retryAttempts: 5,
  retryDelay: 10000,
});
```

## Job Priority

Jobs are processed in priority order:
- **critical**: Highest priority
- **high**: High priority
- **medium**: Medium priority (default)
- **low**: Lowest priority

## Best Practices

1. **Use workers for heavy tasks**: Don't block the API server with long-running operations
2. **Set appropriate priorities**: Critical tasks should be processed first
3. **Monitor queue length**: Adjust maxConcurrentJobs based on system resources
4. **Handle job failures**: Implement retry logic and error handling
5. **Use events for notifications**: Listen to job events to update UI or send notifications
