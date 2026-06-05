# Monitoring and Alerting Guide

## Overview
This guide provides procedures for monitoring and alerting in the SimTrace platform.

## Monitoring Stack

### Components

#### Prometheus
- **Purpose:** Metrics collection and storage
- **Version:** Latest stable
- **Retention:** 15 days
- **Scrape Interval:** 15 seconds

#### Grafana
- **Purpose:** Visualization and dashboards
- **Version:** Latest stable
- **Authentication:** OAuth
- **Dashboards:** 5 pre-configured

#### Alertmanager
- **Purpose:** Alert routing and notification
- **Version:** Latest stable
- **Integrations:** Slack, PagerDuty, Email

#### Sentry
- **Purpose:** Error tracking and alerting
- **Version:** Latest stable
- **Projects:** Backend, Frontend, Workers

## Metrics Collection

### Application Metrics

#### HTTP Metrics
```yaml
# Request count
http_request_total{method, route, status}

# Request duration
http_request_duration_seconds{method, route}

# Request duration buckets
http_request_duration_seconds_bucket{method, route, le}

# In-flight requests
http_requests_in_flight{method, route}
```

#### Database Metrics
```yaml
# Operation count
db_operation_duration_seconds_count{operation, collection}

# Operation duration
db_operation_duration_seconds{operation, collection}

# Operation duration buckets
db_operation_duration_seconds_bucket{operation, collection, le}

# Connection pool
db_pool_connections_active
db_pool_connections_idle
db_pool_connections_total

# Errors
db_operation_errors_total{operation, collection}
```

#### Cache Metrics
```yaml
# Cache hits
cache_hits_total{cache}

# Cache misses
cache_misses_total{cache}

# Cache hit ratio
cache_hit_ratio{cache}

# Cache duration
cache_operation_duration_seconds{operation, cache}

# Cache errors
cache_errors_total{operation, cache}
```

#### Queue Metrics
```yaml
# Queue depth
bullmq_queue_depth{queue}

# Jobs processed
bullmq_queue_processed_total{queue}

# Jobs failed
bullmq_queue_failed_total{queue}

# Job duration
bullmq_job_duration_seconds{queue}

# Worker status
bullmq_workers_active
```

#### Business Metrics
```yaml
# Devices tracked
devices_tracked_total

# Alerts generated
alerts_generated_total{severity}

# IMEI checks
imei_checks_total{provider, status}

# AI requests
ai_requests_total{model, status}

# Token usage
ai_token_usage_total{model}
```

### Infrastructure Metrics

#### Kubernetes Metrics
```yaml
# Node metrics
kube_node_status_condition{condition, status}
kube_node_info{node}
kube_node_status_ready{node}

# Pod metrics
kube_pod_status_phase{namespace, pod, phase}
kube_pod_info{namespace, pod}
kube_pod_status_ready{namespace, pod}

# Container metrics
kube_container_resource_requests{namespace, pod, container, resource}
kube_container_resource_limits{namespace, pod, container, resource}
container_cpu_usage_seconds_total{namespace, pod, container}
container_memory_usage_bytes{namespace, pod, container}
```

#### AWS Metrics
```yaml
# EKS metrics
aws_eks_cluster_node_group_status{cluster, nodegroup}
aws_eks_cluster_status{cluster}

# DocumentDB metrics
aws_docdb_cpu_utilization{cluster}
aws_docdb_memory_utilization{cluster}
aws_docdb_connections{cluster}

# ElastiCache metrics
aws_elasticache_cpu_utilization{cluster}
aws_elasticache_memory_utilization{cluster}
aws_elasticache_connections{cluster}
```

## Dashboards

### System Overview Dashboard

#### Purpose
High-level system health monitoring

#### Panels
- Request rate
- Response time (p95)
- Error rate
- Active devices
- Alerts generated
- IMEI checks
- Queue depth
- Queue processing rate
- Database operations
- Database operation duration
- CPU usage
- Memory usage

#### Refresh Rate
30 seconds

### API Performance Dashboard

#### Purpose
Detailed API performance analytics

#### Panels
- Request rate by endpoint
- Response time distribution (p50, p95, p99)
- Response time heatmap
- Error rate by status code
- Slow requests
- API endpoints table (request count, error rate, p95 latency)

#### Refresh Rate
30 seconds

### Database Performance Dashboard

#### Purpose
MongoDB performance monitoring

#### Panels
- Database operation rate
- Database operation duration
- Slow queries
- Database connection pool
- Database operations by collection
- Database errors
- Index usage
- Collection sizes

#### Refresh Rate
30 seconds

### Queue Performance Dashboard

#### Purpose
BullMQ queue monitoring

#### Panels
- Queue depth
- Queue processing rate
- Queue failure rate
- Worker status
- Job duration
- Dead letter queue size
- Job types (pie chart)
- Queue latency

#### Refresh Rate
30 seconds

### Error Tracking Dashboard

#### Purpose
Sentry error monitoring

#### Panels
- Error rate
- Errors by level
- Errors by environment
- Top error types
- Errors by route
- Unhandled exceptions
- Error impact score
- Error resolution time

#### Refresh Rate
1 minute

## Alerting

### Alert Rules

#### Critical Alerts

```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_request_total{status=~"5.."}[5m]) / rate(http_request_total[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Error rate above 5%"
    description: "Error rate is {{ $value | humanizePercentage }}"

# Database connection failed
- alert: DatabaseConnectionFailed
  expr: rate(db_operation_errors_total[5m]) > 10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Database error rate high"
    description: "Database error rate is {{ $value }}/sec"

# Queue depth high
- alert: HighQueueDepth
  expr: bullmq_queue_depth > 1000
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Queue depth above 1000"
    description: "Queue depth is {{ $value }}"
```

#### Warning Alerts

```yaml
# High response time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Response time above 1s"
    description: "p95 response time is {{ $value }}s"

# High CPU usage
- alert: HighCPUUsage
  expr: rate(process_cpu_seconds_total[5m]) * 100 > 70
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "CPU usage above 70%"
    description: "CPU usage is {{ $value }}%"

# High memory usage
- alert: HighMemoryUsage
  expr: process_resident_memory_bytes / 1024 / 1024 / 1024 > 4
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Memory usage above 4GB"
    description: "Memory usage is {{ $value }}GB"
```

### Alert Routing

#### Severity-Based Routing
- **Critical:** PagerDuty + Slack #alerts
- **Warning:** Slack #alerts
- **Info:** Email

#### Time-Based Routing
- **Business Hours:** Slack + Email
- **After Hours:** PagerDuty for critical only

#### Service-Based Routing
- **Database:** Database team
- **Cache:** Cache team
- **Application:** Application team

### Notification Channels

#### Slack
```yaml
# Slack webhook configuration
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
    channel: '#alerts'
    username: 'SimTrace Alerts'
    icon_emoji: ':warning:'
```

#### PagerDuty
```yaml
# PagerDuty configuration
pagerduty_configs:
  - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
    severity: 'critical'
```

#### Email
```yaml
# Email configuration
email_configs:
  - to: 'oncall@simtrace.com'
    from: 'alerts@simtrace.com'
    smarthost: 'smtp.simtrace.com:587'
    auth_username: 'alerts@simtrace.com'
    auth_password: 'YOUR_PASSWORD'
```

## Alert Management

### Alert Acknowledgment
- **Purpose:** Acknowledge alerts to prevent duplicate notifications
- **Process:** Click "Acknowledge" in Grafana/Alertmanager
- **Duration:** 1 hour (configurable)

### Alert Silence
- **Purpose:** Silence alerts during maintenance
- **Process:** Create silence in Alertmanager
- **Duration:** Configurable

### Alert Resolution
- **Purpose:** Mark alerts as resolved
- **Process:** Automatic when condition clears
- **Verification:** Manual verification recommended

## Incident Response

### Alert to Incident Conversion

#### Criteria
- **Critical alert:** Automatically creates incident
- **Multiple warnings:** May create incident
- **Recurring alerts:** May create incident

#### Process
1. Alert fires
2. On-call engineer notified
3. Engineer assesses severity
4. If critical, create incident
5. Assign incident commander
6. Begin incident response

### Incident Monitoring

#### During Incident
- Monitor all relevant dashboards
- Track key metrics
- Document timeline
- Communicate status

#### Post-Incident
- Review alert performance
- Adjust alert thresholds
- Update alert rules
- Document lessons learned

## Monitoring Maintenance

### Daily Tasks
- Review Grafana dashboards
- Check alert status
- Verify notification delivery
- Review error logs

### Weekly Tasks
- Review alert performance
- Adjust alert thresholds
- Update dashboards
- Review metrics collection

### Monthly Tasks
- Review retention policies
- Optimize storage
- Review costs
- Update documentation

### Quarterly Tasks
- Full monitoring audit
- Alert rule review
- Dashboard review
- Tool updates

## Troubleshooting

### Metrics Not Appearing

#### Check Prometheus
```bash
# Check Prometheus status
kubectl get pods -n monitoring -l app=prometheus

# Check Prometheus logs
kubectl logs -n monitoring -l app=prometheus

# Check Prometheus targets
kubectl port-forward svc/prometheus 9090:9090
# Open http://localhost:9090/targets
```

#### Check Metrics Endpoint
```bash
# Test metrics endpoint
kubectl port-forward svc/simtrace-backend 3000:3000
curl http://localhost:3000/metrics
```

### Alerts Not Firing

#### Check Alertmanager
```bash
# Check Alertmanager status
kubectl get pods -n monitoring -l app=alertmanager

# Check Alertmanager logs
kubectl logs -n monitoring -l app=alertmanager

# Check Alertmanager UI
kubectl port-forward svc/alertmanager 9093:9093
# Open http://localhost:9093
```

#### Check Alert Rules
```bash
# Check alert rules
kubectl port-forward svc/prometheus 9090:9090
# Open http://localhost:9090/rules
```

### Dashboards Not Loading

#### Check Grafana
```bash
# Check Grafana status
kubectl get pods -n monitoring -l app=grafana

# Check Grafana logs
kubectl logs -n monitoring -l app=grafana

# Check Grafana UI
kubectl port-forward svc/grafana 3000:3000
# Open http://localhost:3000
```

## Monitoring Best Practices

### Metric Naming
- Use consistent naming conventions
- Include relevant labels
- Use snake_case for names
- Use camelCase for labels

### Alert Thresholds
- Set thresholds based on baselines
- Avoid alert fatigue
- Use severity levels appropriately
- Test alerts before enabling

### Dashboard Design
- Keep dashboards focused
- Use appropriate visualizations
- Include context and descriptions
- Optimize for performance

### Storage Optimization
- Set appropriate retention periods
- Use downsampling for long-term storage
- Monitor storage costs
- Archive old data

## Contact Information

### Monitoring Team
- **DevOps Engineer:** @devops
- **Engineering Lead:** @engineering-lead
- **CTO:** @cto

### Escalation
- **Critical Alerts:** @on-call
- **Monitoring Issues:** @devops

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Sentry Documentation](https://docs.sentry.io/)
