#!/bin/bash
# deploy.sh - Complete deployment script for cloud-todo app
# Windows-compatible version (Git Bash / MINGW64)

set -e

echo "=== Starting Cloud-Todo Deployment ==="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please ensure Docker Desktop is installed and running."
    echo "Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Build Docker image
echo "Building Docker image..."
docker build -t cloud-todo:dev .

# Check if Docker image built successfully
if [ $? -ne 0 ]; then
    echo "Docker build failed!"
    exit 1
fi

echo "Docker image built successfully: cloud-todo:dev"

# Check if Terraform is available
if ! command -v terraform &> /dev/null; then
    echo "Terraform not found. Attempting installation..."

    # Check if we're on Windows and Terraform.exe is in Downloads
    if [ -f "/c/Users/Dhayanandhan Raju/Downloads/terraform.exe" ]; then
        echo "Found terraform.exe in Downloads. Adding to PATH..."
        export PATH="/c/Users/Dhayanandhan Raju/Downloads:$PATH"
        terraform --version
    else
        echo "Terraform not found and cannot auto-install on this platform."
        echo "Please install Terraform manually or ensure terraform.exe is in Downloads folder."
        exit 1
    fi
fi

echo "Terraform installed"

# Initialize Terraform
echo "Initializing Terraform..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/terraform"
terraform init

# Validate Terraform configuration
echo "Validating Terraform configuration..."
terraform validate

# Plan Terraform deployment
echo "Planning Terraform deployment..."
terraform plan -var-file=../terraform.tfvars

# Apply Terraform deployment
echo "Applying Terraform deployment..."
terraform apply -auto-approve -var-file=../terraform.tfvars

echo "Terraform deployment completed successfully!"

echo "=== Deployment Summary ==="
echo "1. Docker image: cloud-todo:dev"
echo "2. Infrastructure: ECS Fargate + RDS PostgreSQL"
echo "3. Service: cloud-todo-ecs-service-dev"
echo "4. Database: cloudtodo (RDS PostgreSQL)"
echo "5. Access: Use AWS Console or CLI to get endpoint details"
echo "6. Next steps:"
echo "   - Configure environment variables in AWS Secrets Manager"
echo "   - Deploy application using GitHub Actions or manually"
echo "   - Test the application at the ECS service endpoint"

echo "=== Deployment Complete ==="