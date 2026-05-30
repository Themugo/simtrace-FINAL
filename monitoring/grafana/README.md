# Grafana Monitoring Dashboards

This directory contains Grafana dashboard configurations for SimTrace monitoring.

## Dashboards

### 1. System Overview (`system-overview-dashboard.json`)
**Purpose:** High-level system health monitoring

**Panels:**
- Request Rate
- Response Time (p95)
- Error Rate (with alert)
- Active Devices
- Alerts Generated
- IMEI Checks
- Queue Depth
- Queue Processing Rate
- Database Operations
- Database Operation Duration
- CPU Usage
- Memory Usage

**Import:** Load this dashboard in Grafana → Import → Upload JSON file

---

### 2. API Performance (`api-performance-dashboard.json`)
**Purpose:** Detailed API performance analytics

**Panels:**
- Request Rate by Endpoint
- Response Time Distribution (p50, p95, p99)
- Response Time Heatmap by Endpoint
- Error Rate by Status Code
- Slow Requests (> 1s)
- API Endpoints - Request Count (table)
- API Endpoints - Error Rate (table)
- API Endpoints - p95 Latency (table)

**Import:** Load this dashboard in Grafana → Import → Upload JSON file

---

### 3. Database Performance (`database-performance-dashboard.json`)
**Purpose:** MongoDB performance monitoring

**Panels:**
- Database Operation Rate
- Database Operation Duration (p50, p95, p99)
- Slow Queries (> 100ms) with alert
- Database Connection Pool
- Database Operations by Collection
- Database Errors with alert
- Index Usage
- Collection Sizes (table)

**Import:** Load this dashboard in Grafana → Import → Upload JSON file

---

### 4. Queue Performance (`queue-performance-dashboard.json`)
**Purpose:** BullMQ queue monitoring

**Panels:**
- Queue Depth with alert
- Queue Processing Rate
- Queue Failure Rate with alert
- Worker Status
- Job Duration (p95)
- Dead Letter Queue Size with alert
- Job Types by Queue (pie chart)
- Queue Latency

**Import:** Load this dashboard in Grafana → Import → Upload JSON file

---

### 5. Error Tracking (`error-tracking-dashboard.json`)
**Purpose:** Sentry error monitoring

**Panels:**
- Error Rate with alert
- Errors by Level
- Errors by Environment
- Top Error Types (table)
- Errors by Route
- Unhandled Exceptions with alert
- Error Impact Score (gauge)
- Error Resolution Time

**Import:** Load this dashboard in Grafana → Import → Upload JSON file

---

## Setup Instructions

### 1. Configure Prometheus Data Source
1. Open Grafana
2. Go to Configuration → Data Sources
3. Add Prometheus data source
4. URL: `http://prometheus:9090` (adjust based on your setup)
5. Click "Save & Test"

### 2. Import Dashboards
1. Go to Dashboards → Import
2. Upload JSON file
3. Select Prometheus data source
4. Click "Import"

### 3. Configure Alerts
Each dashboard includes pre-configured alerts. To enable:
1. Edit the dashboard
2. Click on alert panel
3. Configure notification channels
4. Set alert conditions
5. Save

## Alert Thresholds

### System Overview
- **Error Rate:** Alert if > 5%

### Database Performance
- **Slow Queries:** Alert if > 10/sec
- **Database Errors:** Alert if > 5/sec

### Queue Performance
- **Queue Depth:** Alert if > 1000
- **Queue Failure Rate:** Alert if > 10/sec
- **DLQ Size:** Alert if > 100

### Error Tracking
- **Error Rate:** Alert if > 10/sec
- **Unhandled Exceptions:** Alert if > 1/sec

## Customization

### Adjust Time Ranges
Each dashboard defaults to 1 hour. To change:
- Edit dashboard
- Change time range in top right corner
- Save

### Add Custom Panels
1. Edit dashboard
2. Click "Add panel"
3. Configure Prometheus query
4. Save

### Modify Alerts
1. Edit panel with alert
2. Adjust threshold values
3. Configure notification channels
4. Save

## Metrics Reference

### HTTP Metrics
- `http_request_total` - Total HTTP requests
- `http_request_duration_seconds` - HTTP request duration histogram
- `http_request_duration_seconds_bucket` - HTTP request duration buckets

### Database Metrics
- `db_operation_duration_seconds` - Database operation duration histogram
- `db_operation_duration_seconds_bucket` - Database operation duration buckets
- `db_operation_errors_total` - Total database operation errors
- `db_pool_connections_active` - Active database connections
- `db_pool_connections_idle` - Idle database connections
- `db_pool_connections_total` - Total database connections

### Queue Metrics
- `bullmq_queue_depth` - Queue depth
- `bullmq_queue_processed_total` - Total processed jobs
- `bullmq_queue_failed_total` - Total failed jobs
- `bullmq_workers_active` - Active workers
- `bullmq_job_duration_seconds` - Job duration histogram
- `bullmq_job_duration_seconds_bucket` - Job duration buckets
- `bullmq_dlq_size` - Dead letter queue size
- `bullmq_queue_latency_seconds` - Queue latency

### Business Metrics
- `devices_tracked_total` - Total devices tracked
- `alerts_generated_total` - Total alerts generated
- `imei_checks_total` - Total IMEI checks

### Error Metrics
- `sentry_errors_total` - Total Sentry errors
- `sentry_unhandled_exceptions_total` - Total unhandled exceptions
- `sentry_error_impact_score` - Error impact score
- `sentry_error_resolution_duration_seconds` - Error resolution duration histogram

## Troubleshooting

### No Data Showing
- Verify Prometheus data source is configured
- Check Prometheus is running
- Verify metrics are being exported
- Check time range

### Alerts Not Firing
- Verify alert conditions are met
- Check notification channels are configured
- Verify alert evaluation interval
- Check Grafana alerting is enabled

### Dashboard Not Loading
- Verify JSON file is valid
- Check Grafana version compatibility
- Verify data source is selected
- Check browser console for errors

## Maintenance

### Regular Updates
- Review alert thresholds monthly
- Update dashboards based on new metrics
- Remove unused panels
- Add new metrics as needed

### Performance
- Limit number of panels per dashboard (< 20)
- Use appropriate time ranges
- Avoid complex queries
- Use query caching

## Support

For issues or questions:
- Check Prometheus documentation
- Review Grafana documentation
- Consult metrics documentation in `/backend/observability/metrics.js`
