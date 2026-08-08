# Kubernetes Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying SimTrace applications to Kubernetes.

## Prerequisites

### Cluster Access
- [ ] Kubernetes cluster running (EKS or other)
- [ ] kubectl configured and connected
- [ ] Cluster admin permissions
- [ ] kubectl >= 1.20.0

### Tools Required
- [ ] kubectl
- [ ] Docker
- [ ] Helm (optional)
- [ ] Git

### Container Images
- [ ] Backend image built and pushed to registry
- [ ] Worker image built and pushed to registry
- [ ] Frontend deployed to Vercel (separate process)

## Initial Setup

### 1. Configure kubectl
```bash
# For EKS
aws eks update-kubeconfig --name simtrace-production --region us-east-1

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 2. Create Namespace
```bash
kubectl create namespace simtrace-production
kubectl config set-context --current --namespace=simtrace-production
```

### 3. Create Secrets
```bash
# Database connection
kubectl create secret generic db-credentials \
  --from-literal=mongo-uri="mongodb://user:pass@host:27017/simtrace" \
  --from-literal=redis-uri="redis://host:6379"

# API keys
kubectl create secret generic api-keys \
  --from-literal=openai-api-key="your-openai-key" \
  --from-literal=telecom-api-key="your-telecom-key" \
  --from-literal=sentry-dsn="your-sentry-dsn"

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=jwt-secret="your-jwt-secret"
```

### 4. Create ConfigMaps
```bash
kubectl create configmap app-config \
  --from-literal=NODE_ENV="production" \
  --from-literal=PORT="3000" \
  --from-literal=LOG_LEVEL="info"
```

## Deployment Steps

### Step 1: Deploy Backend Application

#### 1.1 Create Deployment
```bash
kubectl apply -f kubernetes/deployment.yaml
```

**Verification:**
```bash
kubectl get deployments
kubectl describe deployment simtrace-backend
```

#### 1.2 Create Service
```bash
kubectl apply -f kubernetes/service.yaml
```

**Verification:**
```bash
kubectl get services
kubectl describe service simtrace-backend
```

#### 1.3 Verify Pods
```bash
kubectl get pods -l app=simtrace-backend
kubectl logs -l app=simtrace-backend --tail=50
```

### Step 2: Deploy Worker Application

#### 2.1 Create Worker Deployment
```bash
kubectl apply -f kubernetes/worker-deployment.yaml
```

**Verification:**
```bash
kubectl get deployments
kubectl describe deployment simtrace-worker
```

#### 2.2 Verify Worker Pods
```bash
kubectl get pods -l app=simtrace-worker
kubectl logs -l app=simtrace-worker --tail=50
```

### Step 3: Configure Horizontal Pod Autoscaler

#### 3.1 Verify HPA
```bash
kubectl get hpa
kubectl describe hpa simtrace-backend
kubectl describe hpa simtrace-worker
```

#### 3.2 Test Autoscaling
```bash
# Generate load to trigger autoscaling
kubectl run -it --rm load-test --image=busybox --restart=Never -- \
  sh -c 'while true; do wget -q -O- http://simtrace-backend/api/health; done'
```

### Step 4: Configure Ingress (Optional)

#### 4.1 Install NGINX Ingress Controller
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/aws/deploy.yaml
```

#### 4.2 Create Ingress Resource
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: simtrace-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.simtrace.site
    secretName: simtrace-tls
  rules:
  - host: api.simtrace.site
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: simtrace-backend
            port:
              number: 3000
```

#### 4.3 Apply Ingress
```bash
kubectl apply -f kubernetes/ingress.yaml
```

### Step 5: Configure Monitoring

#### 5.1 Install Prometheus Operator
```bash
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
```

#### 5.2 Configure ServiceMonitors
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: simtrace-backend
spec:
  selector:
    matchLabels:
      app: simtrace-backend
  endpoints:
  - port: http
    path: /metrics
```

#### 5.3 Apply ServiceMonitors
```bash
kubectl apply -f kubernetes/servicemonitor.yaml
```

## Post-Deployment Verification

### 1. Health Checks
```bash
# Backend health
kubectl exec -it $(kubectl get pods -l app=simtrace-backend -o jsonpath='{.items[0].metadata.name}') -- \
  curl http://localhost:3000/api/health

# External health check
curl https://api.simtrace.site/api/health
```

### 2. Check Logs
```bash
# Backend logs
kubectl logs -l app=simtrace-backend --tail=100 -f

# Worker logs
kubectl logs -l app=simtrace-worker --tail=100 -f
```

### 3. Verify Metrics
```bash
# Check metrics endpoint
kubectl port-forward svc/simtrace-backend 9090:3000
curl http://localhost:9090/metrics
```

### 4. Test API Endpoints
```bash
# Test authentication
curl -X POST https://api.simtrace.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test device endpoint
curl https://api.simtrace.site/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Pods Not Starting
**Issue:** Pods stuck in Pending state
**Solution:**
```bash
# Check pod status
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check resource requests
kubectl get pod <pod-name> -o yaml | grep -A 5 resources
```

### Pods Crashing
**Issue:** Pods in CrashLoopBackOff state
**Solution:**
```bash
# Check logs
kubectl logs <pod-name> --previous

# Check environment variables
kubectl exec -it <pod-name> -- env

# Check secrets
kubectl describe secret db-credentials
```

### Service Not Accessible
**Issue:** Cannot access service from outside
**Solution:**
```bash
# Check service type
kubectl get svc simtrace-backend

# Check endpoints
kubectl get endpoints simtrace-backend

# Check network policies
kubectl get networkpolicies
```

### HPA Not Scaling
**Issue:** HPA not creating new pods
**Solution:**
```bash
# Check HPA status
kubectl describe hpa simtrace-backend

# Check metrics server
kubectl top nodes
kubectl top pods

# Check resource utilization
kubectl get hpa simtrace-backend -o yaml
```

### Image Pull Errors
**Issue:** Cannot pull container image
**Solution:**
```bash
# Check image pull secrets
kubectl get secrets

# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_PASSWORD

# Add to deployment
kubectl patch deployment simtrace-backend \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'
```

## Rolling Updates

### Update Backend Image
```bash
# Update image
kubectl set image deployment/simtrace-backend \
  simtrace-backend=your-registry/simtrace-backend:v2.0.0

# Watch rollout
kubectl rollout status deployment/simtrace-backend

# Check history
kubectl rollout history deployment/simtrace-backend
```

### Rollback Deployment
```bash
# Rollback to previous version
kubectl rollout undo deployment/simtrace-backend

# Rollback to specific revision
kubectl rollout undo deployment/simtrace-backend --to-revision=2

# Verify rollback
kubectl rollout status deployment/simtrace-backend
```

### Canary Deployment
```bash
# Create canary deployment
kubectl apply -f kubernetes/canary-deployment.yaml

# Split traffic (using service mesh or ingress)
# Monitor canary metrics
# Promote or rollback based on results
```

## Scaling

### Manual Scaling
```bash
# Scale up
kubectl scale deployment simtrace-backend --replicas=5

# Scale down
kubectl scale deployment simtrace-backend --replicas=2
```

### Configure HPA
```bash
# Create HPA
kubectl autoscale deployment simtrace-backend \
  --cpu-percent=70 \
  --min=3 \
  --max=10

# Update HPA
kubectl edit hpa simtrace-backend
```

## Maintenance

### Node Draining
```bash
# Cordon node (no new pods)
kubectl cordon <node-name>

# Drain node (evict pods)
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon node
kubectl uncordon <node-name>
```

### Cluster Upgrade
```bash
# Check available versions
kubectl version

# Upgrade control plane (EKS)
aws eks upgrade-cluster --name simtrace-production \
  --kubernetes-version 1.29.0

# Upgrade node groups
aws eks update-nodegroup-version --cluster-name simtrace-production \
  --nodegroup-name main --kubernetes-version 1.29.0
```

## Security

### Network Policies
```bash
# Apply network policies
kubectl apply -f kubernetes/network-policies.yaml

# Verify policies
kubectl get networkpolicies
```

### Pod Security Policies
```bash
# Apply pod security policies
kubectl apply -f kubernetes/pod-security-policies.yaml

# Verify policies
kubectl get psp
```

### Secrets Rotation
```bash
# Update secret
kubectl create secret generic db-credentials \
  --from-literal=mongo-uri="new-connection-string" \
  --dry-run=client -o yaml | kubectl apply -f -

# Rollout pods to pick up new secret
kubectl rollout restart deployment simtrace-backend
```

## Disaster Recovery

### Backup Resources
```bash
# Backup all resources
kubectl get all -o yaml > backup-$(date +%Y%m%d).yaml

# Backup specific namespace
kubectl get all -n simtrace-production -o yaml > backup-namespace.yaml
```

### Restore Resources
```bash
# Restore from backup
kubectl apply -f backup-$(date +%Y%m%d).yaml
```

### Cluster Recovery
```bash
# If cluster is lost, recreate using Terraform
cd ../terraform
terraform apply

# Re-apply Kubernetes manifests
cd ../kubernetes
kubectl apply -f .
```

## Monitoring

### Install Metrics Server
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Install Dashboard
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.5.1/aio/deploy/recommended.yaml

# Create admin user
kubectl create serviceaccount dashboard-admin -n kube-system
kubectl create clusterrolebinding dashboard-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=kube-system:dashboard-admin

# Get token
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep dashboard-admin | awk '{print $1}')
```

## Documentation

### Generate Documentation
```bash
# Generate deployment diagram
kubectl graph deployment simtrace-backend > deployment.dot
dot -Tpng deployment.dot > deployment.png
```

### Update Runbook
After each deployment, update this runbook with:
- Any issues encountered
- Solutions implemented
- Configuration changes
- Lessons learned

## Emergency Contacts

- **Engineering Lead:** @engineering-lead
- **DevOps Engineer:** @devops
- **Kubernetes Support:** https://kubernetes.io/docs/

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
