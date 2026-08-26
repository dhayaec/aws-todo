# Terraform deployment checklist
# ============================

## ✅ Infrastructure already defined:
- ECS Fargate cluster with task definition
- RDS PostgreSQL database (db.t3.micro)
- VPC with public/private subnets
- S3 bucket for attachments (encrypted)
- ECR registry for Docker images
- IAM roles for ECS and GitHub OIDC

## ⚠️ What needs to be done:
1. Install Terraform and Docker in your environment
2. Configure AWS credentials (use `aws configure` or IAM roles)
3. Uncomment and set `ec2_ami_id` and `ec2_key_name` if using EC2
4. Update `terraform.tfvars` with your real AWS region and GitHub repo (if using OIDC)
5. Run `terraform apply` to create infrastructure
6. Build and push Docker image to ECR
7. Deploy the ECS service

## 🔧 Recommended next steps:
1. Run `terraform init` in the terraform directory
2. Run `terraform plan` to see what will be created
3. Run `terraform apply` to create infrastructure
4. Use `deploy.sh` script to build and deploy everything

## 🔐 Security note:
- The .env file contains AWS credentials - consider moving to IAM roles
- Secrets Manager is used for JWT_SECRET and REFRESH_SECRET - make sure these are set after terraform apply