# Backup and Recovery Procedures

## Overview
This document defines backup and recovery procedures for the SimTrace platform.

## Backup Strategy

### Backup Types

#### Database Backups
- **Type:** MongoDB Atlas automated backups
- **Frequency:** Daily
- **Retention:** 30 days
- **Method:** Point-in-time recovery
- **Location:** AWS S3 (same region)

#### Cache Backups
- **Type:** ElastiCache automatic backups
- **Frequency:** Daily
- **Retention:** 7 days
- **Method:** Snapshot
- **Location:** AWS S3 (same region)

#### Application Backups
- **Type:** Kubernetes resource backups
- **Frequency:** Daily
- **Retention:** 30 days
- **Method:** Velero
- **Location:** AWS S3 (same region)

#### Configuration Backups
- **Type:** Git repository
- **Frequency:** On change
- **Retention:** Indefinite
- **Method:** Git version control
- **Location:** GitHub

### Backup Schedule

| Backup Type | Frequency | Time (UTC) | Retention |
|-------------|-----------|------------|-----------|
| Database | Daily | 02:00 | 30 days |
| Cache | Daily | 03:00 | 7 days |
| Application | Daily | 04:00 | 30 days |
| Configuration | On change | N/A | Indefinite |

## Backup Procedures

### Database Backup

#### Automated Backup
```bash
# Verify automated backup is enabled
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production \
  --query 'DBClusters[0].BackupRetentionPeriod'

# Check backup status
aws docdb describe-db-snapshots --db-cluster-identifier simtrace-production
```

#### Manual Backup
```bash
# Create manual snapshot
aws docdb create-db-cluster-snapshot \
  --db-cluster-identifier simtrace-production \
  --db-cluster-snapshot-identifier simtrace-manual-$(date +%Y%m%d-%H%M%S)

# Verify snapshot created
aws docdb describe-db-snapshots --db-cluster-snapshot-identifier simtrace-manual-*
```

#### Backup Verification
```bash
# Test backup integrity
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier simtrace-test-restore \
  --snapshot <snapshot-arn> \
  --vpc-security-group-ids <sg-ids>

# Test connectivity
kubectl run -it --rm db-test --image=mongo --restart=Never -- \
  mongo --host <test-endpoint> --port 27017

# Clean up test restore
aws docdb delete-db-cluster --db-cluster-identifier simtrace-test-restore \
  --skip-final-snapshot
```

### Cache Backup

#### Automated Backup
```bash
# Verify automated backup is enabled
aws elasticache describe-replication-groups --replication-group-id simtrace-production \
  --query 'ReplicationGroups[0].SnapshotRetentionLimit'

# Check backup status
aws elasticache describe-snapshots --replication-group-id simtrace-production
```

#### Manual Backup
```bash
# Create manual snapshot
aws elasticache create-snapshot \
  --replication-group-id simtrace-production \
  --snapshot-name simtrace-manual-$(date +%Y%m%d-%H%M%S)

# Verify snapshot created
aws elasticache describe-snapshots --snapshot-name simtrace-manual-*
```

#### Backup Verification
```bash
# Test backup integrity
aws elasticache create-replication-group \
  --replication-group-id simtrace-test-restore \
  --replication-group-description "Test restore" \
  --snapshot-name <snapshot-name>

# Test connectivity
kubectl run -it --rm redis-test --image=redis --restart=Never -- \
  redis-cli -h <test-endpoint> -p 6379 ping

# Clean up test restore
aws elasticache delete-replication-group \
  --replication-group-id simtrace-test-restore \
  --final-snapshot-identifier simtrace-test-final
```

### Application Backup

#### Kubernetes Resource Backup
```bash
# Install Velero
kubectl apply -f https://raw.githubusercontent.com/vmware-tanzu/velero/main/config/install/bundle.yaml

# Create backup
velero backup create simtrace-backup-$(date +%Y%m%d) \
  --include-namespaces simtrace-production

# Verify backup
velero backup describe simtrace-backup-$(date +%Y%m%d)

# List backups
velero backup get
```

#### Configuration Backup
```bash
# Backup all Kubernetes resources
kubectl get all -n simtrace-production -o yaml > backup-$(date +%Y%m%d).yaml

# Backup secrets separately
kubectl get secrets -n simtrace-production -o yaml > secrets-backup-$(date +%Y%m%d).yaml

# Commit to Git
git add backup-*.yaml
git commit -m "Backup $(date +%Y%m%d)"
git push origin main
```

## Recovery Procedures

### Database Recovery

#### Point-in-Time Recovery
```bash
# Identify recovery point
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production

# Restore to specific time
aws docdb restore-db-cluster-to-point-in-time \
  --db-cluster-identifier simtrace-production-restored \
  --source-db-cluster-identifier simtrace-production \
  --restore-to-time 2024-01-01T12:00:00Z \
  --vpc-security-group-ids <sg-ids>

# Update application connection string
kubectl set env deployment simtrace-backend MONGO_URI="mongodb://..."
```

#### Snapshot Recovery
```bash
# Find appropriate snapshot
aws docdb describe-db-snapshots --db-cluster-identifier simtrace-production

# Restore from snapshot
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier simtrace-production-restored \
  --snapshot <snapshot-arn> \
  --vpc-security-group-ids <sg-ids>

# Update application connection string
kubectl set env deployment simtrace-backend MONGO_URI="mongodb://..."
```

#### Data Recovery
```bash
# Extract specific data from restored cluster
kubectl exec -it <pod-name> -- node scripts/extract-data.js \
  --source-uri="mongodb://restored-cluster" \
  --output-file=data.json

# Import into production
kubectl exec -it <pod-name> -- node scripts/import-data.js \
  --input-file=data.json

# Verify data
kubectl exec -it <pod-name> -- node scripts/validate-data.js
```

### Cache Recovery

#### Snapshot Recovery
```bash
# Find appropriate snapshot
aws elasticache describe-snapshots --replication-group-id simtrace-production

# Restore from snapshot
aws elasticache create-replication-group \
  --replication-group-id simtrace-production-restored \
  --replication-group-description "Restored from snapshot" \
  --snapshot-name <snapshot-name>

# Update application connection string
kubectl set env deployment simtrace-backend REDIS_URI="redis://..."
```

#### Cache Rebuild
```bash
# If snapshot not available, rebuild cache
kubectl rollout restart deployment simtrace-backend

# Warm up cache
kubectl exec -it <pod-name> -- node scripts/warm-cache.js

# Monitor cache hit ratio
kubectl logs -l app=simtrace-backend | grep "cache hit ratio"
```

### Application Recovery

#### Kubernetes Resource Recovery
```bash
# List available backups
velero backup get

# Restore from backup
velero restore create simtrace-restore \
  --from-backup simtrace-backup-$(date +%Y%m%d)

# Verify restore
kubectl get all -n simtrace-production

# Monitor pods
kubectl get pods -n simtrace-production -w
```

#### Configuration Recovery
```bash
# Restore from Git
git checkout <commit-hash>

# Apply configuration
kubectl apply -f backup-$(date +%Y%m%d).yaml

# Apply secrets
kubectl apply -f secrets-backup-$(date +%Y%m%d).yaml

# Restart pods
kubectl rollout restart deployment simtrace-backend
```

## Disaster Recovery

### Disaster Scenarios

#### Scenario 1: Complete Region Outage
**Impact:** Entire AWS region unavailable

**Recovery Steps:**
1. Activate disaster recovery plan
2. Deploy to secondary region
3. Restore database from cross-region backup
4. Restore cache from cross-region backup
5. Update DNS to point to secondary region
6. Verify all services operational
7. Monitor for issues

**Timeline:**
- Detection: 5 minutes
- Activation: 15 minutes
- Deployment: 2 hours
- Verification: 30 minutes
- Total: ~3 hours

#### Scenario 2: Database Cluster Failure
**Impact:** Database unavailable

**Recovery Steps:**
1. Detect database failure
2. Initiate failover to read replica
3. Restore primary cluster
4. Verify data integrity
5. Switch back to primary

**Timeline:**
- Detection: 5 minutes
- Failover: 10 minutes
- Restoration: 1 hour
- Verification: 15 minutes
- Total: ~1.5 hours

#### Scenario 3: Cache Cluster Failure
**Impact:** Cache unavailable

**Recovery Steps:**
1. Detect cache failure
2. Application operates without cache (degraded mode)
3. Restore cache cluster
4. Warm up cache
5. Verify cache operational

**Timeline:**
- Detection: 5 minutes
- Degraded mode: Immediate
- Restoration: 30 minutes
- Warm up: 15 minutes
- Total: ~50 minutes

#### Scenario 4: Application Deployment Failure
**Impact:** Application unavailable

**Recovery Steps:**
1. Detect deployment failure
2. Rollback to previous version
3. Verify application operational
4. Investigate failure
5. Fix and redeploy

**Timeline:**
- Detection: 5 minutes
- Rollback: 10 minutes
- Verification: 15 minutes
- Total: ~30 minutes

### Recovery Objectives

| Component | RTO | RPO |
|-----------|-----|-----|
| Database | 4 hours | 24 hours |
| Cache | 1 hour | 7 days |
| Application | 30 minutes | 24 hours |
| Configuration | 15 minutes | On change |

## Backup Testing

### Monthly Backup Verification

#### Database Backup Test
```bash
# Restore to test cluster
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier simtrace-test-restore \
  --snapshot <latest-snapshot-arn>

# Test connectivity
kubectl run -it --rm db-test --image=mongo --restart=Never -- \
  mongo --host <test-endpoint> --port 27017

# Test queries
kubectl exec -it <pod-name> -- node scripts/test-queries.js

# Clean up
aws docdb delete-db-cluster --db-cluster-identifier simtrace-test-restore \
  --skip-final-snapshot
```

#### Cache Backup Test
```bash
# Restore to test cluster
aws elasticache create-replication-group \
  --replication-group-id simtrace-test-restore \
  --snapshot-name <latest-snapshot-name>

# Test connectivity
kubectl run -it --rm redis-test --image=redis --restart=Never -- \
  redis-cli -h <test-endpoint> -p 6379 ping

# Test operations
kubectl exec -it <pod-name> -- redis-cli -h <test-endpoint> -p 6379 SET test "value"

# Clean up
aws elasticache delete-replication-group \
  --replication-group-id simtrace-test-restore
```

#### Application Backup Test
```bash
# Restore from backup
velero restore create test-restore \
  --from-backup simtrace-backup-$(date +%Y%m%d)

# Verify restore
kubectl get all -n simtrace-production

# Clean up
velero restore delete test-restore
```

### Quarterly Disaster Recovery Drill

#### Full Disaster Recovery Test
1. Simulate region outage
2. Deploy to secondary region
3. Restore all components
4. Verify all services operational
5. Document results
6. Update procedures based on findings

## Backup Monitoring

### Backup Status Monitoring

#### Alerts
```yaml
# Backup failure alert
- alert: BackupFailed
  expr: backup_status == "failed"
  for: 5m
  annotations:
    summary: "Backup failed"

# Backup age alert
- alert: BackupTooOld
  expr: backup_age_hours > 36
  for: 5m
  annotations:
    summary: "Backup is older than 36 hours"
```

#### Dashboard
- Backup status dashboard in Grafana
- Shows last backup time, status, age
- Alerts configured for failures

### Backup Storage Monitoring

#### Storage Capacity
```bash
# Check S3 storage
aws s3 ls s3://simtrace-backups --recursive --summarize

# Check storage costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY --metrics BlendedCost \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon S3"]}}'
```

#### Storage Optimization
- Implement lifecycle policies
- Move old backups to Glacier
- Delete expired backups
- Monitor storage costs

## Backup Retention

### Retention Policy

| Backup Type | Retention Period | Archive Location |
|-------------|------------------|-----------------|
| Database | 30 days | S3 Standard |
| Database Archive | 1 year | S3 Glacier |
| Cache | 7 days | S3 Standard |
| Application | 30 days | S3 Standard |
| Configuration | Indefinite | Git |

### Retention Enforcement

#### Automated Cleanup
```bash
# Delete old database backups
aws docdb delete-db-cluster-snapshot \
  --db-cluster-snapshot-identifier <old-snapshot>

# Delete old cache backups
aws elasticache delete-snapshot --snapshot-name <old-snapshot>

# Delete old application backups
velero backup delete <old-backup>
```

#### Lifecycle Policies
```bash
# Configure S3 lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket simtrace-backups \
  --lifecycle-configuration file://lifecycle-policy.json
```

## Backup Security

### Encryption
- **At Rest:** AES-256 encryption
- **In Transit:** TLS 1.3
- **Key Management:** AWS KMS

### Access Control
- **Principle:** Least privilege
- **IAM Roles:** Specific roles for backup operations
- **Audit:** All backup operations logged

### Backup Verification
- **Integrity:** Checksums verified
- **Authenticity:** Digital signatures
- **Completeness:** Full backup verification

## Documentation

### Backup Documentation
- Backup procedures documented
- Recovery procedures documented
- Contact information documented
- Escalation procedures documented

### Backup Reports
- Monthly backup status report
- Quarterly backup verification report
- Annual disaster recovery drill report

## Contact Information

### Backup Team
- **DevOps Engineer:** @devops
- **Engineering Lead:** @engineering-lead
- **CTO:** @cto

### Escalation
- **Emergency:** @on-call
- **Management:** @ceo

## References

- [MongoDB Atlas Backup](https://docs.atlas.mongodb.com/backup/)
- [ElastiCache Backup](https://docs.aws.amazon.com/elasticache/)
- [Velero Backup](https://velero.io/docs/)
- [AWS Backup](https://docs.aws.amazon.com/backup/)
