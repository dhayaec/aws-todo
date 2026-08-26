# ── ECS cluster ───────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.app_name}-${var.environment}" }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ── Task definition ────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.app_name}-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.fargate_cpu
  memory                   = var.fargate_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "cloudtodo"
      image     = "${aws_ecr_repository.app.repository_url}:latest"
      essential = true

      portMappings = [{ containerPort = 3000, protocol = "tcp" }]

      environment = [
        { name = "PORT",        value = "3000" },
        { name = "NODE_ENV",    value = "production" },
        { name = "AWS_REGION",  value = var.aws_region },
        { name = "S3_BUCKET",   value = aws_s3_bucket.attachments.id }
      ]

      # Secrets injected from Secrets Manager at task start
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_db_instance.postgres.master_user_secret[0].secret_arn}:DATABASE_URL::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        },
        {
          name      = "REFRESH_SECRET"
          valueFrom = aws_ssm_parameter.refresh_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/auth/me || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = { Name = "${var.app_name}-${var.environment}" }
}

# ── SSM parameters for JWT secrets ────────────────────────────────────────────
resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.app_name}/${var.environment}/JWT_SECRET"
  type  = "SecureString"
  value = "REPLACE_ME_WITH_STRONG_SECRET_MIN_32_CHARS"

  lifecycle {
    ignore_changes = [value] # Managed outside Terraform after first apply
  }
}

resource "aws_ssm_parameter" "refresh_secret" {
  name  = "/${var.app_name}/${var.environment}/REFRESH_SECRET"
  type  = "SecureString"
  value = "REPLACE_ME_WITH_STRONG_REFRESH_SECRET_MIN_32_CHARS"

  lifecycle {
    ignore_changes = [value]
  }
}

# ── ECS service ───────────────────────────────────────────────────────────────
resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  # Rolling deployment — no downtime
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  # Uncomment when using an ALB
  # load_balancer {
  #   target_group_arn = aws_lb_target_group.app.arn
  #   container_name   = "cloudtodo"
  #   container_port   = 3000
  # }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  depends_on = [aws_iam_role_policy_attachment.ecs_execution_managed]

  tags = { Name = "${var.app_name}-${var.environment}" }
}
