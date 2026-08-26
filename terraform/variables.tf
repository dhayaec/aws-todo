variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev | prod)"
  type        = string
  default     = "dev"
}

variable "app_name" {
  description = "Application name prefix used in resource names"
  type        = string
  default     = "cloud-todo"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "cloudtodo"
}

variable "db_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "cloudtodo"
  sensitive   = true
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ec2_ami_id" {
  description = "AMI ID for the EC2 instance (Amazon Linux 2023)"
  type        = string
  # Override in terraform.tfvars
  default     = ""
}

variable "ec2_key_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
  default     = ""
}

variable "fargate_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 256
}

variable "fargate_memory" {
  description = "ECS task memory (MiB)"
  type        = number
  default     = 512
}

variable "app_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "github_oidc_repo" {
  description = "GitHub repo allowed to assume the deploy role (org/repo)"
  type        = string
  # e.g. "myorg/cloud-todo"
  default     = "dhayaec/aws-todo"

  validation {
    condition = can(split("/", var.github_oidc_repo)) == true && length(split("/", var.github_oidc_repo)) == 2
    error_message = "github_oidc_repo must be in format 'org/repo' (e.g., 'myorg/cloud-todo')"
  }
}
