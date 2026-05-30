# Deployment Runbooks

This directory contains operational runbooks for deploying and managing SimTrace infrastructure.

## Runbooks

### 1. Terraform Deployment Runbook (`terraform-deployment-runbook.md`)
**Purpose:** Step-by-step guide for deploying AWS infrastructure using Terraform

**Contents:**
- Prerequisites and setup
- Initial configuration
- Deployment steps (network, EKS, database, Redis)
- Post-deployment verification
- Troubleshooting common issues
- Rollback procedures
- Maintenance and security

**Use When:**
- Initial infrastructure deployment
- Infrastructure updates
- Infrastructure troubleshooting
- Disaster recovery

---

### 2. Kubernetes Deployment Runbook (`kubernetes-deployment-runbook.md`)
**Purpose:** Step-by-step guide for deploying applications to Kubernetes

**Contents:**
- Cluster setup and configuration
- Secret and ConfigMap creation
- Application deployment (backend, workers)
- Horizontal Pod Autoscaler configuration
- Ingress setup
- Monitoring configuration
- Rolling updates and rollbacks
- Scaling procedures

**Use When:**
- Application deployment
- Application updates
- Scaling operations
- Kubernetes troubleshooting

---

### 3. Infrastructure Troubleshooting Runbook (`infrastructure-troubleshooting-runbook.md`)
**Purpose:** Troubleshooting procedures for common infrastructure issues

**Contents:**
- Quick reference table
- Common issues and solutions:
  - Cluster unreachable
  - Pods not starting
  - Database connection issues
  - Redis connection issues
  - High CPU/memory usage
  - Network issues
  - Queue processing issues
  - SSL/TLS issues
- Emergency procedures
- Monitoring and alerts

**Use When:**
- Infrastructure issues detected
- Performance problems
- Connection failures
- Resource exhaustion

---

### 4. Rollback Procedures Runbook (`rollback-procedures-runbook.md`)
**Purpose:** Procedures for rolling back deployments to previous states

**Contents:**
- Application rollbacks:
  - Kubernetes deployment rollback
  - Docker image rollback
  - Configuration rollback
  - Database migration rollback
- Infrastructure rollbacks:
  - Terraform rollback
  - EKS cluster rollback
  - Database rollback
  - Redis rollback
- Data rollbacks:
  - Data restoration
  - Partial data rollback
- Emergency rollback procedures
- Rollback decision criteria

**Use When:**
- Deployment causes issues
- Data corruption
- Infrastructure problems
- Emergency situations

---

## Quick Start

### First-Time Deployment

1. **Deploy Infrastructure**
   ```bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   ```

2. **Deploy Applications**
   ```bash
   cd kubernetes
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```

3. **Verify Deployment**
   ```bash
   kubectl get pods
   kubectl get services
   curl https://api.simtrace.site/api/health
   ```

### Troubleshooting

1. **Check Cluster Health**
   ```bash
   kubectl get nodes
   kubectl get pods
   ```

2. **Check Logs**
   ```bash
   kubectl logs -l app=simtrace-backend
   ```

3. **Check Events**
   ```bash
   kubectl get events --sort-by='.lastTimestamp'
   ```

### Rollback

1. **Rollback Deployment**
   ```bash
   kubectl rollout undo deployment simtrace-backend
   ```

2. **Verify Rollback**
   ```bash
   kubectl rollout status deployment simtrace-backend
   ```

---

## Emergency Procedures

### Complete Outage

1. **Assess Impact**
   ```bash
   kubectl get nodes
   kubectl get pods --all-namespaces
   ```

2. **Notify Team**
   - Alert on-call engineer
   - Notify engineering lead
   - Update status page

3. **Identify Root Cause**
   ```bash
   kubectl logs -l app=simtrace-backend --tail=500
   kubectl get events --sort-by='.lastTimestamp'
   ```

4. **Implement Fix**
   - Rollback if recent deployment
   - Restart affected services
   - Scale up resources

5. **Verify Resolution**
   ```bash
   curl https://api.simtrace.site/api/health
   ```

---

## Maintenance Schedule

### Daily
- Review Grafana dashboards
- Check error rates
- Monitor resource usage

### Weekly
- Review logs for anomalies
- Check backup status
- Review security alerts

### Monthly
- Review and update runbooks
- Test rollback procedures
- Review costs
- Update documentation

### Quarterly
- Infrastructure audit
- Security review
- Performance review
- Disaster recovery drill

---

## Contact Information

### On-Call
- **Primary:** @on-call
- **Secondary:** @on-call-secondary
- **Escalation:** @engineering-lead

### Engineering Leadership
- **Engineering Lead:** @engineering-lead
- **DevOps Engineer:** @devops
- **CTO:** @cto

### External Support
- **AWS Support:** https://console.aws.amazon.com/support/home
- **Kubernetes Support:** https://kubernetes.io/docs/
- **MongoDB Support:** https://www.mongodb.com/support

---

## Documentation Standards

### When Updating Runbooks

1. **Date stamp changes**
2. **Describe what changed**
3. **Why the change was made**
4. **Test the updated procedure**

### Format

```markdown
## Section Title

### Subsection
**Description:** What this does

**Steps:**
1. Step 1
2. Step 2

**Verification:**
```bash
command to verify
```

**Troubleshooting:**
- Issue: Description
- Solution: Steps to fix
```

---

## Training

### New Team Members

1. **Review all runbooks**
2. **Practice deployments in staging**
3. **Practice rollbacks in staging**
4. **Shadow on-call engineer**
5. **Complete training checklist**

### Training Checklist
- [ ] Read all runbooks
- [ ] Practice Terraform deployment
- [ ] Practice Kubernetes deployment
- [ ] Practice rollback procedures
- [ ] Practice troubleshooting
- [ ] Complete incident response drill

---

## Metrics and KPIs

### Deployment Metrics
- **Deployment Success Rate:** Target > 95%
- **Deployment Time:** Target < 30 minutes
- **Rollback Rate:** Target < 5%
- **Mean Time to Recovery (MTTR):** Target < 1 hour

### Infrastructure Metrics
- **Uptime:** Target > 99.9%
- **Error Rate:** Target < 0.1%
- **Response Time:** Target < 500ms (p95)
- **Resource Utilization:** Target < 70%

---

## Contributing

### Adding New Procedures

1. Create new runbook or update existing
2. Follow documentation standards
3. Test the procedure
4. Get review from team
5. Update this README
6. Commit and push changes

### Updating Existing Procedures

1. Identify what needs updating
2. Make changes
3. Test the updated procedure
4. Document why changes were made
5. Get review from team
6. Commit and push changes

---

## References

### Internal Documentation
- [Architecture Documentation](../docs/)
- [API Documentation](../backend/docs/swagger.js)
- [Monitoring Dashboards](../monitoring/grafana/)

### External Documentation
- [Terraform Documentation](https://www.terraform.io/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial runbooks created |
| 1.1.0 | 2024-02-01 | Added troubleshooting procedures |
| 1.2.0 | 2024-03-01 | Updated rollback procedures |
