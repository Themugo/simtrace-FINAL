# Infrastructure Troubleshooting Runbook

## Overview
This runbook provides troubleshooting procedures for common infrastructure issues in the SimTrace production environment.

## Quick Reference

| Issue | Severity | First Action |
|-------|----------|--------------|
| Complete outage | P0 | Check cluster health, notify on-call |
| High error rate | P1 | Check application logs, verify dependencies |
| Slow performance | P2 | Check metrics, review resource utilization |
| Partial outage | P2 | Check specific service, verify routing |

## Common Issues

### 1. Cluster Unreachable

#### Symptoms
- `kubectl get nodes` times out
- Cannot connect to cluster API
- Applications showing connection errors

#### Diagnosis
```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# Check AWS EKS status
aws eks describe-cluster --name simtrace-production

# Check network connectivity
ping cluster-endpoint.eks.amazonaws.com
```

#### Solutions

**Solution 1: Update kubeconfig**
```bash
aws eks update-kubeconfig --name simtrace-production --region us-east-1
```

**Solution 2: Check IAM permissions**
```bash
# Verify IAM user has EKS permissions
aws iam get-user-policy --user-name YOUR_USER --policy-name AmazonEKSClusterPolicy
```

**Solution 3: Check security groups**
```bash
# Verify security group allows API server access
aws ec2 describe-security-groups --group-ids sg-xxxxxxxx
```

**Solution 4: Restart cluster (last resort)**
```bash
# Only if cluster is completely unresponsive
aws eks delete-cluster --name simtrace-production
# Re-create using Terraform
cd terraform && terraform apply
```

---

### 2. Pods Not Starting

#### Symptoms
- Pods stuck in Pending state
- Pods in CrashLoopBackOff
- Pods failing to schedule

#### Diagnosis
```bash
# Check pod status
kubectl get pods -o wide
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check resource availability
kubectl top nodes
kubectl describe nodes
```

#### Solutions

**Solution 1: Insufficient resources**
```bash
# Check node capacity
kubectl describe nodes | grep -A 5 "Allocated resources"

# Scale up node group
aws eks update-nodegroup-config --cluster-name simtrace-production \
  --nodegroup-name main --scaling-config minSize=5,maxSize=20,desiredSize=5
```

**Solution 2: Image pull errors**
```bash
# Check image pull secrets
kubectl get secrets

# Verify image exists
docker pull your-registry/simtrace-backend:latest

# Re-create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_PASSWORD
```

**Solution 3: ConfigMap/Secret missing**
```bash
# Check required secrets
kubectl get secrets
kubectl get configmaps

# Re-create missing secrets
kubectl create secret generic db-credentials \
  --from-literal=mongo-uri="mongodb://..."
```

**Solution 4: Init container failures**
```bash
# Check init container logs
kubectl logs <pod-name> -c <init-container-name>

# Fix init container configuration
kubectl edit deployment <deployment-name>
```

---

### 3. Database Connection Issues

#### Symptoms
- Application logs showing database connection errors
- High database latency
- Connection pool exhaustion

#### Diagnosis
```bash
# Check database endpoint
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxxxxx

# Test connectivity from pod
kubectl run -it --rm db-test --image=mongo --restart=Never -- \
  mongo --host <db-endpoint> --port 27017
```

#### Solutions

**Solution 1: Security group blocking**
```bash
# Add inbound rule to security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 27017 \
  --source-cidr 10.0.0.0/16
```

**Solution 2: Database not accessible**
```bash
# Check cluster status
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production

# Restart cluster if needed
aws docdb reboot-db-instance --db-instance-identifier simtrace-production-0
```

**Solution 3: Connection pool exhausted**
```bash
# Check connection pool metrics
kubectl logs -l app=simtrace-backend | grep "connection pool"

# Increase pool size in environment variables
kubectl set env deployment/simtrace-backend DB_POOL_SIZE=20
```

**Solution 4: DNS resolution issues**
```bash
# Check DNS from pod
kubectl run -it --rm dns-test --image=busybox --restart=Never -- \
  nslookup <db-endpoint>

# Check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns
```

---

### 4. Redis Connection Issues

#### Symptoms
- Cache misses
- Queue processing failures
- Session storage errors

#### Diagnosis
```bash
# Check Redis endpoint
aws elasticache describe-replication-groups --replication-group-id simtrace-production

# Test connectivity
kubectl run -it --rm redis-test --image=redis --restart=Never -- \
  redis-cli -h <redis-endpoint> -p 6379 ping
```

#### Solutions

**Solution 1: Security group blocking**
```bash
# Add inbound rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 6379 \
  --source-cidr 10.0.0.0/16
```

**Solution 2: Redis cluster down**
```bash
# Check cluster status
aws elasticache describe-replication-groups --replication-group-id simtrace-production

# Reboot if needed
aws elasticache reboot-cache-cluster --cache-cluster-id simtrace-production-001
```

**Solution 3: Memory full**
```bash
# Check memory usage
aws elasticache describe-cache-clusters --cache-cluster-id simtrace-production-001

# Evict keys or scale up
aws elasticache modify-replication-group \
  --replication-group-id simtrace-production \
  --cache-node-type cache.r6g.large
```

---

### 5. High CPU/Memory Usage

#### Symptoms
- Slow response times
- OOMKilled pods
- High load on nodes

#### Diagnosis
```bash
# Check resource usage
kubectl top nodes
kubectl top pods

# Check resource limits
kubectl describe pod <pod-name> | grep -A 10 "Limits"

# Check HPA status
kubectl get hpa
kubectl describe hpa <hpa-name>
```

#### Solutions

**Solution 1: Increase resource limits**
```bash
# Edit deployment
kubectl edit deployment <deployment-name>

# Or patch
kubectl set resources deployment <deployment-name> \
  --limits=cpu=2,memory=4Gi \
  --requests=cpu=1,memory=2Gi
```

**Solution 2: Scale horizontally**
```bash
# Manual scale
kubectl scale deployment <deployment-name> --replicas=5

# Or let HPA handle it
kubectl autoscale deployment <deployment-name> \
  --cpu-percent=70 --min=3 --max=10
```

**Solution 3: Optimize application**
```bash
# Profile application
kubectl exec -it <pod-name> -- node --prof

# Check for memory leaks
kubectl logs <pod-name> | grep "memory"
```

**Solution 4: Add nodes**
```bash
# Scale node group
aws eks update-nodegroup-config --cluster-name simtrace-production \
  --nodegroup-name main --scaling-config minSize=5,maxSize=20,desiredSize=5
```

---

### 6. Network Issues

#### Symptoms
- Intermittent connection failures
- High latency
- DNS resolution failures

#### Diagnosis
```bash
# Check network policies
kubectl get networkpolicies

# Check pod-to-pod connectivity
kubectl run -it --rm net-test --image=nicolaka/netshoot --restart=Never -- \
  ping <other-pod-ip>

# Check DNS
kubectl run -it --rm dns-test --image=busybox --restart=Never -- \
  nslookup kubernetes.default
```

#### Solutions

**Solution 1: Network policy blocking**
```bash
# Check policies
kubectl get networkpolicies -o yaml

# Remove restrictive policy
kubectl delete networkpolicy <policy-name>
```

**Solution 2: DNS issues**
```bash
# Check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns

# Restart CoreDNS
kubectl rollout restart deployment coredns -n kube-system
```

**Solution 3: Ingress issues**
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resources
kubectl get ingress

# Check ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

---

### 7. Queue Processing Issues

#### Symptoms
- Jobs stuck in queue
- High queue depth
- Worker pods failing

#### Diagnosis
```bash
# Check queue depth
kubectl exec -it <worker-pod> -- redis-cli -h <redis-host> LLEN bullmq:queue

# Check worker status
kubectl get pods -l app=simtrace-worker
kubectl logs -l app=simtrace-worker

# Check Redis connection
kubectl exec -it <worker-pod> -- redis-cli -h <redis-host> ping
```

#### Solutions

**Solution 1: Workers not processing**
```bash
# Restart workers
kubectl rollout restart deployment simtrace-worker

# Check worker logs
kubectl logs -l app=simtrace-worker --tail=100
```

**Solution 2: Redis connection issues**
```bash
# Test Redis connection
kubectl run -it --rm redis-test --image=redis --restart=Never -- \
  redis-cli -h <redis-host> -p 6379 ping

# Re-create Redis connection secret
kubectl create secret generic redis-credentials \
  --from-literal=redis-uri="redis://..."
```

**Solution 3: Queue backlog**
```bash
# Scale workers
kubectl scale deployment simtrace-worker --replicas=10

# Or drain queue manually
kubectl exec -it <worker-pod> -- node -e "const Queue = require('bullmq'); const queue = new Queue('default', { connection: { host: '<redis-host>', port: 6379 }}); queue.drain();"
```

---

### 8. SSL/TLS Issues

#### Symptoms
- Certificate errors
- HTTPS not working
- Mixed content warnings

#### Diagnosis
```bash
# Check TLS secrets
kubectl get secrets
kubectl describe secret tls-secret

# Check certificate expiry
kubectl exec -it <pod> -- openssl x509 -in /etc/tls/cert.crt -noout -dates

# Check ingress TLS configuration
kubectl describe ingress simtrace-ingress
```

#### Solutions

**Solution 1: Certificate expired**
```bash
# Renew certificate (cert-manager)
kubectl annotate certificate simtrace-tls cert-manager.io/issue-temporary-certificate=true

# Or manually update
kubectl create secret tls tls-secret \
  --cert=path/to/cert.crt \
  --key=path/to/cert.key
```

**Solution 2: Certificate not trusted**
```bash
# Add CA certificate to trust store
kubectl create configmap ca-certs --from-file=ca.crt
kubectl patch deployment <deployment-name> \
  -p '{"spec":{"template":{"spec":{"volumes":[{"name":"ca-certs","configMap":{"name":"ca-certs"}}]}}}}'
```

**Solution 3: Mixed content**
```bash
# Update application to use HTTPS
kubectl set env deployment <deployment-name> FRONTEND_URL=https://www.simtrace.site
```

---

## Emergency Procedures

### Complete Outage

#### Step 1: Assess Impact
```bash
# Check cluster health
kubectl get nodes
kubectl get pods --all-namespaces

# Check external dependencies
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production
aws elasticache describe-replication-groups --replication-group-id simtrace-production
```

#### Step 2: Notify Team
- Alert on-call engineer
- Notify engineering lead
- Update status page

#### Step 3: Identify Root Cause
```bash
# Check recent changes
kubectl rollout history deployment <deployment-name>

# Check logs
kubectl logs -l app=simtrace-backend --tail=500

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

#### Step 4: Implement Fix
- Rollback if recent deployment
- Restart affected services
- Scale up resources

#### Step 5: Verify Resolution
```bash
# Run smoke tests
kubectl run -it --rm smoke-test --image=curlimages/curl --restart=Never -- \
  curl https://api.simtrace.site/api/health

# Monitor metrics
kubectl top pods
kubectl top nodes
```

### Data Loss

#### Step 1: Assess Impact
```bash
# Check database status
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production

# Check recent snapshots
aws docdb describe-db-snapshots --db-cluster-identifier simtrace-production
```

#### Step 2: Restore from Backup
```bash
# Restore from snapshot
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier simtrace-production-restored \
  --snapshot <snapshot-arn>

# Update connection string
kubectl set env deployment simtrace-backend MONGO_URI="mongodb://..."
```

#### Step 3: Verify Data
```bash
# Run data validation scripts
kubectl exec -it <pod> -- node scripts/validate-data.js
```

## Monitoring and Alerts

### Set Up Critical Alerts

#### Alert: Cluster Down
```yaml
- alert: ClusterDown
  expr: up{job="kubernetes-nodes"} == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Kubernetes cluster is down"
```

#### Alert: High Error Rate
```yaml
- alert: HighErrorRate
  expr: rate(http_request_total{status=~"5.."}[5m]) / rate(http_request_total[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Error rate above 5%"
```

#### Alert: Database Connection Failed
```yaml
- alert: DatabaseConnectionFailed
  expr: rate(db_operation_errors_total[5m]) > 10
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Database error rate high"
```

## Documentation

### Update Runbook
After resolving any issue, update this runbook with:
- Issue description
- Root cause analysis
- Resolution steps
- Prevention measures

### Create Post-Incident Report
```markdown
# Incident Report

## Summary
[Brief description]

## Timeline
- [Time]: Event detected
- [Time]: Investigation started
- [Time]: Root cause identified
- [Time]: Fix implemented
- [Time]: Service restored

## Root Cause
[Detailed analysis]

## Resolution
[Steps taken]

## Prevention
[Future improvements]
```

## Emergency Contacts

- **On-Call Engineer:** @on-call
- **Engineering Lead:** @engineering-lead
- **DevOps Engineer:** @devops
- **CTO:** @cto

## References

- [Kubernetes Troubleshooting](https://kubernetes.io/docs/tasks/debug/)
- [EKS Troubleshooting](https://docs.aws.amazon.com/eks/latest/userguide/troubleshooting.html)
- [DocumentDB Troubleshooting](https://docs.aws.amazon.com/documentdb/latest/developerguide/troubleshooting.html)
