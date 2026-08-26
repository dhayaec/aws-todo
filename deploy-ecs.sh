#!/bin/bash
# deploy-ecs.sh - Build and push Docker image to ECR

set -e

# Configuration
ECR_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="cloud-todo-dev"
IMAGE_TAG="latest"

echo "=== Building and Pushing Docker Image to ECR ==="

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "AWS CLI not found. Please install AWS CLI v2."
    exit 1
fi

# Get ECR login token
echo "Logging in to ECR..."
aws ecr get-login-password --region $ECR_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY.dkr.ecr.$ECR_REGION.amazonaws.com

# Build Docker image
echo "Building Docker image..."
docker build -t cloud-todo:$IMAGE_TAG .

# Tag the image for ECR
echo "Tagging image for ECR..."
docker tag cloud-todo:$IMAGE_TAG $ECR_REPOSITORY.dkr.ecr.$ECR_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

# Push to ECR
echo "Pushing image to ECR..."
docker push $ECR_REPOSITORY.dkr.ecr.$ECR_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

echo "=== Docker Image Pushed Successfully ==="