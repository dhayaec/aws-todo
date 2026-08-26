# Complete Deployment Pipeline
# ==========================

## 1. Terraform Setup
Run in the terraform directory:

```bash
cd terraform
terraform init
terraform plan -var-file=../terraform.tfvars
terraform apply -var-file=../terraform.tfvars
```

This creates:
- ✅ VPC, subnets, security groups
- ✅ RDS PostgreSQL (cloudtodo-db)
- ✅ S3 bucket for attachments
- ✅ ECR registry
- ✅ ECS Fargate cluster + task definition
- ✅ ECS service
- ✅ CloudWatch logs & alarms

**Post-apply tasks:**
- Set `JWT_SECRET` and `REFRESH_SECRET` in AWS Secrets Manager
- Note the ECS service URL from outputs
- Get ECR repo URL: `terraform output ecr_repository_url`

## 2. Docker Image Build & Push
```bash
# Build the image
docker build -t cloud-todo:dev .

# Get ECR login and tag
aws ecr get-login-password | docker login --username AWS --password-stdin
docker tag cloud-todo:dev <ECR_REPO_URL>:latest
docker push <ECR_REPO_URL>:latest
```

## 3. Deploy via GitHub Actions
Push to `main` triggers the workflow at `.github/workflows/deploy.yml`:
- Builds Docker image
- Pushes to ECR
- Updates ECS task definition
- Deploys to ECS service (zero-downtime rolling deploy)

## 4. Environment Configuration
### .env.local (local dev, outside Docker):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cloudtodo
JWT_SECRET=dev-jwt-secret-change-in-production-min-32-chars
REFRESH_SECRET=dev-refresh-secret-change-in-production-min-32-chars
AWS_REGION=us-east-1
S3_BUCKET=cloud-todo-dev
```

### AWS Secrets Manager (after terraform apply):
- `/cloud-todo/dev/JWT_SECRET` - auto-created by terraform
- `/cloud-todo/dev/REFRESH_SECRET` - auto-created by terraform

## 5. What Happens on Deploy
1. GitHub push → workflow runs
2. Docker image built and pushed to ECR
3. ECS task definition updated with new image
4. ECS service rolls out new task definition (100% min healthy, 200% max)
5. Zero-downtime deployment

## 6. Rollback
```bash
terraform apply -var-file=../terraform.tfvars
# Or revert to previous ECS task definition via AWS Console
```

## 📋 Summary Checklist
- [ ] Run terraform init + plan
- [ ] Run terraform apply
- [ ] Configure AWS Secrets Manager passwords
- [ ] Build + push Docker image to ECR
- [ ] Push to main → GitHub Actions deploys
- [ ] Verify app running at ECS service URL