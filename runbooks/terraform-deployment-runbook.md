# Terraform Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying SimTrace infrastructure using Terraform on AWS.

## Prerequisites

### AWS Account Setup
- [ ] AWS account with admin access
- [ ] AWS CLI installed and configured
- [ ] AWS credentials configured (`aws configure`)
- [ ] IAM user with appropriate permissions
- [ ] S3 bucket for Terraform state (optional but recommended)

### Tools Required
- [ ] Terraform >= 1.0.0
- [ ] AWS CLI >= 2.0.0
- [ ] kubectl >= 1.20.0
- [ ] Git

### Environment Variables
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
export TF_VAR_db_username="simtrace-admin"
export TF_VAR_db_password="your-secure-password"
export TF_VAR_environment="production"
```

## Initial Setup

### 1. Clone Repository
```bash
git clone https://github.com/Themugo/simtrace-FINAL.git
cd simtrace-FINAL/terraform
```

### 2. Initialize Terraform
```bash
terraform init
```

**Expected Output:**
```
Initializing the backend...
Initializing provider plugins...
Terraform has been successfully initialized!
```

### 3. Configure Terraform Backend (Optional)
Create `backend.tf` for remote state:
```hcl
terraform {
  backend "s3" {
    bucket         = "simtrace-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "simtrace-terraform-locks"
  }
}
```

### 4. Review Terraform Plan
```bash
terraform plan -out=tfplan
```

**Review the output carefully:**
- Check resource counts
- Verify region configuration
- Confirm database credentials
- Validate network configuration

## Deployment Steps

### Step 1: Deploy Network Infrastructure
```bash
terraform apply -target=aws_vpc.main -target=aws_subnet.public -target=aws_subnet.private
```

**Verification:**
```bash
aws ec2 describe-vpcs --vpc-ids $(terraform output -raw vpc_id)
```

### Step 2: Deploy EKS Cluster
```bash
terraform apply -target=aws_eks_cluster.main -target=aws_eks_node_group.main
```

**Verification:**
```bash
aws eks describe-cluster --name simtrace-production
```

### Step 3: Configure kubectl
```bash
aws eks update-kubeconfig --name simtrace-production --region us-east-1
kubectl get nodes
```

**Expected Output:**
```
NAME                           STATUS   ROLES    AGE   VERSION
ip-192-168-1-100.ec2.internal  Ready    <none>   5m    v1.28.0
ip-192-168-1-101.ec2.internal  Ready    <none>   5m    v1.28.0
ip-192-168-1-102.ec2.internal  Ready    <none>   5m    v1.28.0
```

### Step 4: Deploy Database Infrastructure
```bash
terraform apply -target=aws_docdb_cluster.main -target=aws_docdb_cluster_instance.main
```

**Verification:**
```bash
aws docdb describe-db-clusters --db-cluster-identifier simtrace-production
```

### Step 5: Deploy Redis Infrastructure
```bash
terraform apply -target=aws_elasticache_replication_group.main
```

**Verification:**
```bash
aws elasticache describe-replication-groups --replication-group-id simtrace-production
```

### Step 6: Deploy Supporting Infrastructure
```bash
terraform apply -target=aws_s3_bucket.main -target=aws_cloudwatch_log_group.main -target=aws_sns_topic.main
```

### Step 7: Deploy IAM Roles and Policies
```bash
terraform apply -target=aws_iam_role.eks_node_role -target=aws_iam_role_policy.eks_node_policy
```

### Step 8: Full Deployment
```bash
terraform apply tfplan
```

**Expected Duration:** 15-30 minutes

## Post-Deployment Verification

### 1. Verify All Resources
```bash
terraform show
```

### 2. Check EKS Cluster Health
```bash
kubectl cluster-info
kubectl get nodes -o wide
kubectl get pods -n kube-system
```

### 3. Verify Database Connectivity
```bash
kubectl run -it --rm mongo-client --image=mongo --restart=Never -- \
  mongo --host $(terraform output -raw db_endpoint) --port 27017
```

### 4. Verify Redis Connectivity
```bash
kubectl run -it --rm redis-client --image=redis --restart=Never -- \
  redis-cli -h $(terraform output -raw redis_endpoint) -p 6379 ping
```

### 5. Verify S3 Bucket
```bash
aws s3 ls $(terraform output -raw s3_bucket_name)
```

### 6. Verify CloudWatch Alarms
```bash
aws cloudwatch describe-alarms --alarm-name-prefix simtrace
```

## Environment Variables Configuration

### Kubernetes Secrets
```bash
# Create secrets
kubectl create secret generic simtrace-secrets \
  --from-literal=MONGO_URI="mongodb://$(terraform output -raw db_endpoint)/simtrace" \
  --from-literal=REDIS_URI="redis://$(terraform output -raw redis_endpoint):6379" \
  --from-literal=JWT_SECRET="your-jwt-secret" \
  --from-literal=SENTRY_DSN="your-sentry-dsn" \
  --from-literal=OPENAI_API_KEY="your-openai-key" \
  --from-literal=TELECOM_API_KEY="your-telecom-key"
```

## Troubleshooting

### Terraform Init Fails
**Issue:** Cannot initialize Terraform
**Solution:**
```bash
# Clear local state
rm -rf .terraform terraform.tfstate*
terraform init
```

### EKS Cluster Creation Fails
**Issue:** EKS cluster stuck in "CREATING" state
**Solution:**
```bash
# Check CloudFormation stacks
aws cloudformation describe-stacks --stack-name eksctl-simtrace-production-cluster

# Delete and retry
aws eks delete-cluster --name simtrace-production
terraform apply
```

### Database Connection Fails
**Issue:** Cannot connect to DocumentDB
**Solution:**
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids $(terraform output -raw db_security_group_id)

# Verify VPC peering if needed
aws ec2 describe-vpc-peering-connections
```

### Node Group Not Joining Cluster
**Issue:** EKS nodes not showing in kubectl
**Solution:**
```bash
# Check node group status
aws eks describe-nodegroup --cluster-name simtrace-production --nodegroup-name main

# Check IAM roles
aws iam get-instance-profile --instance-profile-name simtrace-node-profile

# Verify node logs
aws logs tail /aws/eks/simtrace-production/cluster --follow
```

### State Lock Timeout
**Issue:** Terraform state locked
**Solution:**
```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>

# Or manually clear DynamoDB lock
aws dynamodb delete-item --table-name simtrace-terraform-locks --key '{"LockID":{"S":"simtrace-production/terraform.tfstate-md5"}}'
```

## Rollback Procedures

### Rollback to Previous State
```bash
terraform plan -destroy
terraform destroy
# Apply previous Terraform state
terraform apply <previous-state-file>
```

### Partial Rollback
```bash
# Destroy specific resources
terraform destroy -target=aws_eks_cluster.main

# Re-deploy specific resources
terraform apply -target=aws_eks_cluster.main
```

## Maintenance

### Regular Updates
```bash
# Update Terraform providers
terraform init -upgrade

# Update Kubernetes version
terraform apply -var=kubernetes_version="1.29.0"
```

### State Management
```bash
# Backup state
terraform output -json > state-backup-$(date +%Y%m%d).json

# Import existing resources
terraform import aws_vpc.main vpc-xxxxxxxx
```

## Security Considerations

### Rotate Secrets
```bash
# Update database password
terraform apply -var=db_password="new-secure-password"

# Rotate AWS keys
aws iam delete-access-key --access-key-id OLD_KEY
aws iam create-access-key --user-name simtrace-terraform
```

### Enable Encryption
```bash
# Verify EBS encryption
aws ec2 get-ebs-encryption-by-default

# Enable S3 encryption
aws s3api put-bucket-encryption --bucket simtrace-terraform-state \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

## Cost Optimization

### Review Costs
```bash
# Check AWS cost explorer
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY --metrics BlendedCost
```

### Optimize Resources
```bash
# Reduce node count during off-hours
terraform apply -var=node_desired_size=2

# Use spot instances
terraform apply -var=instance_type="t3.medium" -var=spot_price="0.02"
```

## Monitoring

### Enable CloudWatch Metrics
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard --dashboard-name simtrace-infrastructure \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Set Up Alerts
```bash
# Create SNS subscription
aws sns subscribe --topic-arn $(terraform output -raw sns_topic_arn) \
  --protocol email --notification-endpoint oncall@simtrace.com
```

## Documentation

### Update Runbook
After each deployment, update this runbook with:
- Any issues encountered
- Solutions implemented
- Lessons learned
- Configuration changes

### Generate Diagrams
```bash
# Generate infrastructure diagram
terraform graph | dot -Tpng > infrastructure.png
```

## Emergency Contacts

- **Engineering Lead:** @engineering-lead
- **DevOps Engineer:** @devops
- **AWS Support:** https://console.aws.amazon.com/support/home

## References

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [DocumentDB Documentation](https://docs.aws.amazon.com/documentdb/)
- [ElastiCache Documentation](https://docs.aws.amazon.com/elasticache/)
