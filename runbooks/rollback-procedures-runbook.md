# Rollback Procedures Runbook

## Overview
This runbook provides procedures for rolling back SimTrace deployments to previous states.

## Prerequisites

### Access Requirements
- [ ] Kubernetes admin access
- [ ] AWS admin access (for infrastructure rollbacks)
- [ ] Git access for code rollbacks
- [ ] Database access for data rollbacks

### Tools Required
- [ ] kubectl
- [ ] AWS CLI
- [ ] Git
- [ ] Docker

## Quick Rollback Decision Tree

```
Is the issue critical?
├─ Yes → Immediate rollback
└─ No → Can we fix it quickly?
    ├─ Yes → Fix in place
    └─ No → Rollback
```

## Application Rollbacks

### 1. Kubernetes Deployment Rollback

#### Scenario: Recent deployment caused issues

#### Step 1: Identify Problematic Deployment
```bash
# Check deployment history
kubectl rollout history deployment simtrace-backend

# Check recent revisions
kubectl rollout history deployment simtrace-backend --revision=5
```

#### Step 2: Rollback to Previous Version
```bash
# Rollback to previous version
kubectl rollout undo deployment simtrace-backend

# Rollback to specific revision
kubectl rollout undo deployment simtrace-backend --to-revision=3

# Watch rollback progress
kubectl rollout status deployment simtrace-backend
```

#### Step 3: Verify Rollback
```bash
# Check pod status
kubectl get pods -l app=simtrace-backend

# Check logs
kubectl logs -l app=simtrace-backend --tail=50

# Test health endpoint
kubectl exec -it $(kubectl get pods -l app=simtrace-backend -o jsonpath='{.items[0].metadata.name}') -- \
  curl http://localhost:3000/api/health
```

#### Step 4: Monitor
```bash
# Monitor for 15 minutes
kubectl logs -l app=simtrace-backend -f

# Check metrics
kubectl top pods -l app=simtrace-backend
```

---

### 2. Docker Image Rollback

#### Scenario: New container image has issues

#### Step 1: Identify Previous Image
```bash
# Check current image
kubectl get deployment simtrace-backend -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check image history
kubectl rollout history deployment simtrace-backend
```

#### Step 2: Rollback to Previous Image
```bash
# Set previous image
kubectl set image deployment/simtrace-backend \
  simtrace-backend=your-registry/simtrace-backend:v1.2.3

# Watch rollout
kubectl rollout status deployment/simtrace-backend
```

#### Step 3: Verify
```bash
# Confirm image
kubectl get deployment simtrace-backend -o jsonpath='{.spec.template.spec.containers[0].image}'

# Test application
curl https://api.simtrace.site/api/health
```

---

### 3. Configuration Rollback

#### Scenario: Environment variable changes caused issues

#### Step 1: Identify Problematic Config
```bash
# Check current config
kubectl get configmap app-config -o yaml

# Check current secrets
kubectl get secrets db-credentials -o yaml
```

#### Step 2: Restore Previous Config
```bash
# If using GitOps, revert config commit
git revert <commit-hash>
git push

# Or manually restore
kubectl apply -f kubernetes/configmap-backup.yaml
kubectl apply -f kubernetes/secrets-backup.yaml

# Restart pods to pick up new config
kubectl rollout restart deployment simtrace-backend
```

#### Step 3: Verify
```bash
# Check environment variables in pod
kubectl exec -it <pod-name> -- env

# Test application
curl https://api.simtrace.site/api/health
```

---

### 4. Database Migration Rollback

#### Scenario: Database migration caused issues

#### Step 1: Identify Migration
```bash
# Check migration status
kubectl exec -it <pod-name> -- node scripts/check-migration-status.js

# Check database schema
kubectl exec -it <pod-name> -- node scripts/describe-schema.js
```

#### Step 2: Rollback Migration
```bash
# Run rollback script
kubectl exec -it <pod-name> -- node scripts/rollback-migration.js <migration-id>

# Or manually revert
kubectl exec -it <pod-name> -- mongo --host <db-host> --eval "
  db.devices.dropIndex('new_index');
"
```

#### Step 3: Verify
```bash
# Check schema
kubectl exec -it <pod-name> -- node scripts/describe-schema.js

# Test application queries
kubectl exec -it <pod-name> -- node scripts/test-queries.js
```

---

## Infrastructure Rollbacks

### 1. Terraform Rollback

#### Scenario: Terraform apply caused infrastructure issues

#### Step 1: Identify Problematic Change
```bash
# Check Terraform state
terraform show

# Check recent changes
terraform plan -detailed-exitcode
```

#### Step 2: Rollback Specific Resources
```bash
# Destroy specific resources
terraform destroy -target=aws_eks_cluster.main

# Re-apply previous state
terraform apply -var-file=terraform.tfvars.backup
```

#### Step 3: Full Rollback
```bash
# Destroy all resources
terraform destroy

# Apply previous state
terraform apply <previous-state-file>
```

#### Step 4: Verify
```bash
# Check resources
terraform show

# Test connectivity
kubectl cluster-info
```

---

### 2. EKS Cluster Rollback

#### Scenario: EKS upgrade caused issues

#### Step 1: Check Cluster Status
```bash
# Check cluster version
aws eks describe-cluster --name simtrace-production

# Check node status
kubectl get nodes
```

#### Step 2: Rollback Cluster Version
```bash
# Note: EKS does not support direct rollback
# Must create new cluster with previous version

# Create new cluster
aws eks create-cluster --name simtrace-production-rollback \
  --role-arn <role-arn> \
  --resources-vpc-config subnetIds=<subnet-ids> \
  --version 1.28.0

# Migrate workloads
kubectl get all -n simtrace-production -o yaml > backup.yaml
kubectl apply -f backup.yaml --context=new-cluster
```

#### Step 3: Update DNS
```bash
# Update Route53 to point to new cluster
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://dns-change.json
```

---

### 3. Database Rollback

#### Scenario: DocumentDB upgrade or configuration change caused issues

#### Step 1: Check Cluster Status
```bash
# Check cluster status
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production

# Check recent snapshots
aws docdb describe-db-snapshots --db-cluster-identifier simtrace-production
```

#### Step 2: Restore from Snapshot
```bash
# Find snapshot before issue
aws docdb describe-db-snapshots --db-cluster-identifier simtrace-production \
  --query 'DBSnapshots[?SnapshotCreateTime<=`2024-01-01`]'

# Restore from snapshot
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier simtrace-production-restored \
  --snapshot <snapshot-arn> \
  --vpc-security-group-ids <sg-ids> \
  --subnet-group-name default

# Update application connection string
kubectl set env deployment simtrace-backend MONGO_URI="mongodb://..."
```

#### Step 3: Verify
```bash
# Test connection
kubectl run -it --rm db-test --image=mongo --restart=Never -- \
  mongo --host <new-endpoint> --port 27017

# Test application
kubectl rollout restart deployment simtrace-backend
```

---

### 4. Redis Rollback

#### Scenario: ElastiCache upgrade or configuration change caused issues

#### Step 1: Check Cluster Status
```bash
# Check cluster status
aws elasticache describe-replication-groups --replication-group-id simtrace-production

# Check recent snapshots
aws elasticache describe-snapshots --replication-group-id simtrace-production
```

#### Step 2: Restore from Snapshot
```bash
# Restore from snapshot
aws elasticache create-replication-group \
  --replication-group-id simtrace-production-restored \
  --replication-group-description "Restored from snapshot" \
  --snapshot-name <snapshot-name>

# Update application connection string
kubectl set env deployment simtrace-backend REDIS_URI="redis://..."
```

#### Step 3: Verify
```bash
# Test connection
kubectl run -it --rm redis-test --image=redis --restart=Never -- \
  redis-cli -h <new-endpoint> -p 6379 ping

# Test application
kubectl rollout restart deployment simtrace-backend
```

---

## Data Rollbacks

### 1. Data Restoration

#### Scenario: Accidental data deletion or corruption

#### Step 1: Assess Damage
```bash
# Check data integrity
kubectl exec -it <pod-name> -- node scripts/validate-data.js

# Check backup availability
aws docdb describe-db-snapshots --db-cluster-identifier simtrace-production
```

#### Step 2: Restore from Backup
```bash
# Option 1: Point-in-time recovery
aws docdb restore-db-cluster-to-point-in-time \
  --db-cluster-identifier simtrace-production-restored \
  --source-db-cluster-identifier simtrace-production \
  --restore-to-time 2024-01-01T12:00:00Z

# Option 2: Snapshot restore
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier simtrace-production-restored \
  --snapshot <snapshot-arn>
```

#### Step 3: Data Recovery
```bash
# Extract specific data from restored cluster
kubectl exec -it <pod-name> -- node scripts/extract-data.js \
  --source-uri="mongodb://restored-cluster" \
  --output-file=data.json

# Import into production
kubectl exec -it <pod-name> -- node scripts/import-data.js \
  --input-file=data.json
```

---

### 2. Partial Data Rollback

#### Scenario: Specific collection or document needs rollback

#### Step 1: Identify Affected Data
```bash
# Find affected documents
kubectl exec -it <pod-name> -- mongo --host <db-host> --eval "
  db.devices.find({updatedAt: {\$gte: ISODate('2024-01-01')}}).count();
"
```

#### Step 2: Restore Specific Data
```bash
# Extract from backup
kubectl exec -it <pod-name> -- node scripts/extract-collection.js \
  --collection=devices \
  --query='{"updatedAt":{"$gte":"2024-01-01"}}' \
  --output-file=devices-backup.json

# Restore to production
kubectl exec -it <pod-name> -- node scripts/restore-collection.js \
  --collection=devices \
  --input-file=devices-backup.json
```

#### Step 3: Verify
```bash
# Validate restored data
kubectl exec -it <pod-name> -- node scripts/validate-data.js --collection=devices
```

---

## Emergency Rollback Procedures

### Complete System Rollback

#### Scenario: Multiple components affected, need full system rollback

#### Step 1: Declare Incident
- Alert on-call engineer
- Notify engineering lead
- Update status page

#### Step 2: Assess Impact
```bash
# Check all components
kubectl get all -n simtrace-production
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production
aws elasticache describe-replication-groups --replication-group-id simtrace-production
```

#### Step 3: Rollback Order
1. **Application** (fastest rollback)
   ```bash
   kubectl rollout undo deployment simtrace-backend
   kubectl rollout undo deployment simtrace-worker
   ```

2. **Configuration** (if needed)
   ```bash
   kubectl apply -f kubernetes/config-backup.yaml
   ```

3. **Infrastructure** (if needed)
   ```bash
   cd terraform
   terraform apply -var-file=terraform.tfvars.backup
   ```

4. **Data** (if needed)
   ```bash
   aws docdb restore-db-cluster-from-snapshot \
     --db-cluster-identifier simtrace-production-restored \
     --snapshot <snapshot-arn>
   ```

#### Step 4: Verify System
```bash
# Run smoke tests
kubectl run -it --rm smoke-test --image=curlimages/curl --restart=Never -- \
  curl https://api.simtrace.site/api/health

# Monitor metrics
kubectl top pods
kubectl top nodes
```

#### Step 5: Update Status
- Update status page
- Notify stakeholders
- Document incident

---

## Rollback Testing

### Pre-Deployment Rollback Test

#### Before deploying, test rollback procedure:
```bash
# Deploy to staging
kubectl apply -f kubernetes/deployment-staging.yaml

# Test rollback
kubectl rollout undo deployment simtrace-backend-staging

# Verify rollback successful
kubectl get pods -l app=simtrace-backend-staging
```

---

## Rollback Decision Criteria

### When to Rollback

**Rollback Immediately If:**
- Complete system outage
- Data loss or corruption
- Security vulnerability
- Critical functionality broken
- Error rate > 10%

**Consider Rollback If:**
- Performance degradation > 50%
- Partial functionality broken
- High resource consumption
- User complaints increasing

**Fix in Place If:**
- Minor UI issues
- Non-critical bugs
- Performance degradation < 20%
- Can be fixed quickly (< 30 min)

---

## Rollback Checklist

### Before Rollback
- [ ] Identify root cause
- [ ] Confirm rollback will fix issue
- [ ] Communicate with team
- [ ] Update status page
- [ ] Prepare rollback plan

### During Rollback
- [ ] Execute rollback steps
- [ ] Monitor rollback progress
- [ ] Verify rollback success
- [ ] Test critical functionality
- [ ] Monitor for side effects

### After Rollback
- [ ] Document incident
- [ ] Schedule post-incident review
- [ ] Update runbooks
- [ ] Implement prevention measures
- [ ] Update status page

---

## Post-Rollback Actions

### 1. Root Cause Analysis
```bash
# Collect logs
kubectl logs -l app=simtrace-backend --tail=1000 > incident-logs.txt

# Collect metrics
kubectl top pods -n simtrace-production > incident-metrics.txt

# Collect events
kubectl get events --sort-by='.lastTimestamp' > incident-events.txt
```

### 2. Post-Incident Review
- Schedule review meeting
- Discuss timeline
- Identify root cause
- Document lessons learned
- Create action items

### 3. Prevention Measures
- Add automated tests
- Improve monitoring
- Update deployment process
- Add rollback automation
- Improve documentation

---

## Emergency Contacts

- **On-Call Engineer:** @on-call
- **Engineering Lead:** @engineering-lead
- **DevOps Engineer:** @devops
- **CTO:** @cto

## References

- [Kubernetes Rollback Documentation](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-back-a-deployment)
- [Terraform Rollback Documentation](https://www.terraform.io/docs/cli/commands/rollback.html)
- [DocumentDB Restore Documentation](https://docs.aws.amazon.com/documentdb/latest/developerguide/backup-restore.html)
