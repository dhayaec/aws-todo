# IAM Permissions Fix for Terraform Deployment

## Problem
Terraform fails with 403 errors for IAM operations.

## Required Policies

### Policy 1: Basic IAM & EC2 Permissions (for terraform plan)
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "iam:ListOpenIDConnectProviders",
      "iam:GetOpenIDConnectProvider",
      "ec2:DescribeAvailabilityZones"
    ],
    "Resource": "*"
  }]
}
```

### Policy 2: Full Terraform Deployment Permissions (for terraform apply)
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "*"
    ],
    "Resource": "*"
  }]
}
```

OR use managed policy **AdministratorAccess**.

---

## Quick Fix via AWS Console

1. Go to: https://console.aws.amazon.com/iam/
2. Users → `dhayaec` → Add permissions
3. Attach **AdministratorAccess** managed policy
4. This grants all permissions needed for Terraform deployment

---

## After Fix
```bash
cd terraform
terraform plan -var-file=../terraform.tfvars
terraform apply -var-file=../terraform.tfvars
```
