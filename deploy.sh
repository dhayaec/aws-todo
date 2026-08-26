#!/bin/bash
# deploy.sh - Complete deployment script for cloud-todo app

set -e

echo "=== Starting Cloud-Todo Deployment ==="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    # For Windows WSL2
    sudo apt update
    sudo apt install -y docker.io
    sudo usermod -aG docker $USER
    echo "Docker installation complete. Restarting shell..."
    exec $SHELL -l
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Docker not running. Starting Docker service..."
    sudo service docker start
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
    echo "Terraform not found. Installing Terraform..."
    # Install Terraform
    curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list > /dev/null
    sudo apt update
    sudo apt install -y terraform
fi

echo "Terraform installed"

# Initialize Terraform
echo "Initializing Terraform..."
cd /c/Users/Dhayanandhan\ Raju/works/aws-todo/terraform
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