terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  # Uncomment after creating the S3 backend bucket
  # backend "s3" {
  #   bucket = "cloud-todo-tfstate"
  #   key    = "envs/dev/terraform.tfstate"
  #   region = "us-east-1"
  #   encrypt = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "cloud-todo"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
