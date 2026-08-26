# CloudTodo

A production-style Todo application built as an end-to-end AWS/DevOps learning project.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TypeScript |
| API | Next.js Route Handlers |
| ORM | Prisma |
| Database | PostgreSQL (local Docker / AWS RDS) |
| Auth | JWT (access + refresh tokens, HttpOnly cookies) |
| Password hashing | bcrypt |
| File storage | Amazon S3 (presigned URLs) |
| Containerization | Docker (multi-stage) |
| Container registry | Amazon ECR |
| IaC | Terraform |
| CI | GitHub Actions |
| CD | GitHub Actions → EC2 or ECS Fargate |
| Monitoring | CloudWatch |
| Secrets | AWS Secrets Manager / SSM Parameter Store |

---

## Learning path

The project is designed to be built in 10 stages — don't skip ahead:

1. **Next.js + TypeScript** — local app, no cloud
2. **PostgreSQL + Prisma** — schema, migrations, seed data
3. **JWT authentication** — register, login, refresh, logout
4. **Docker + Docker Compose** — containerise the app locally
5. **S3 file uploads** — presigned URLs, browser-direct upload
6. **Terraform** — VPC, RDS, S3, ECR, IAM
7. **Deploy to EC2** — manual Docker deployment, learn networking
8. **GitHub Actions CI/CD + ECR** — automated image builds
9. **ECS Fargate** — replace EC2 with managed containers
10. **CloudWatch + hardening** — logs, alarms, production security

---

## Quick start (local)

### Prerequisites

- Node.js 22+
- Docker Desktop
- `npm`

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database and LocalStack S3

```bash
docker compose up -d db localstack
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — the defaults work out of the box with Docker Compose.

### 4. Push the schema and seed

```bash
npm run db:push
npm run db:seed
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Demo account: `demo@example.com` / `password123`

### Run everything in Docker

```bash
docker compose up --build
```

The app runs on port 3000. On first boot, run migrations:

```bash
docker compose exec app npx prisma migrate deploy
```

---

## API reference

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/logout` | Clear cookies |
| GET | `/api/auth/me` | Current user |

### Todos

| Method | Path | Description |
|---|---|---|
| GET | `/api/todos` | List todos (`?completed=true/false`) |
| POST | `/api/todos` | Create todo |
| GET | `/api/todos/:id` | Get todo |
| PATCH | `/api/todos/:id` | Update todo |
| DELETE | `/api/todos/:id` | Delete todo |

### Attachments

| Method | Path | Description |
|---|---|---|
| POST | `/api/todos/:id/attachments` | Get presigned upload URL + create record |
| GET | `/api/todos/:id/attachments` | List with presigned download URLs |
| DELETE | `/api/todos/:id/attachments/:attachmentId` | Delete attachment |

**Upload flow:**

```
Browser → POST /api/todos/:id/attachments → presigned URL
Browser → PUT <presigned URL> → S3 (direct, no app server in the path)
```

---

## Tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Tests live in `tests/`. Unit tests cover auth helpers and S3 key generation without hitting real AWS or a real database.

---

## Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

terraform init
terraform validate
terraform plan
terraform apply
```

Key outputs after `apply`:

| Output | Use |
|---|---|
| `ecr_repository_url` | Set as `ECR_REPOSITORY` in GitHub vars |
| `github_deploy_role_arn` | Set as `AWS_DEPLOY_ROLE_ARN` in GitHub secrets |
| `rds_endpoint` | Build your `DATABASE_URL` |
| `s3_bucket_name` | Set as `S3_BUCKET` env var |

**To tear down and avoid charges:**

```bash
terraform destroy
```

---

## GitHub Actions

Three workflows:

| File | Trigger | What it does |
|---|---|---|
| `ci.yml` | push / PR | lint, typecheck, test, build |
| `deploy-ec2.yml` | CI passes on `main` | build image → ECR → SSH deploy to EC2 |
| `deploy-ecs.yml` | CI passes on `main` | build image → ECR → update ECS task + service |

### Required GitHub secrets / variables

| Name | Type | Description |
|---|---|---|
| `AWS_DEPLOY_ROLE_ARN` | Secret | IAM role ARN (from `github_deploy_role_arn` output) |
| `EC2_SSH_PRIVATE_KEY` | Secret | PEM key for EC2 SSH (EC2 workflow only) |
| `AWS_REGION` | Variable | e.g. `us-east-1` |
| `ECR_REPOSITORY` | Variable | Repository name from Terraform output |
| `EC2_HOST` | Variable | Public IP/DNS of EC2 instance |
| `ECS_CLUSTER` | Variable | ECS cluster name |
| `ECS_SERVICE` | Variable | ECS service name |
| `ECS_TASK_DEFINITION` | Variable | Task definition family name |

Authentication uses **OIDC** — no long-lived AWS keys stored in GitHub.

---

## S3 bucket layout

```
cloud-todo-{env}-attachments/
└── todo-attachments/
    └── {userId}/
        └── {todoId}/
            └── {timestamp}-{random}.{ext}
```

The bucket is fully private. All access goes through presigned URLs generated server-side.

---

## Security notes

- Passwords hashed with bcrypt (cost factor 12)
- Access tokens expire in 15 minutes; refresh tokens in 7 days
- Auth cookies: `HttpOnly`, `Secure`, `SameSite=Lax`
- File uploads validated for MIME type and size (10 MB max) before a presigned URL is issued
- RDS is in a private subnet with no public access
- S3 bucket blocks all public access; CORS restricted to your domain in production
- IAM roles follow least-privilege; GitHub Actions uses OIDC (no static credentials)
- Secrets stored in AWS Secrets Manager / SSM, never in environment variables committed to source

---

## Project structure

```
cloud-todo/
├── app/
│   ├── api/
│   │   ├── auth/          # register, login, refresh, logout, me
│   │   └── todos/         # CRUD + attachment routes
│   ├── login/
│   ├── register/
│   ├── todos/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts            # JWT, bcrypt helpers
│   ├── prisma.ts          # Prisma client singleton
│   └── s3.ts              # Presigned URL helpers
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── setup.ts
│   ├── auth.test.ts
│   └── s3.test.ts
├── terraform/
│   ├── providers.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── networking.tf      # VPC, subnets, security groups
│   ├── iam.tf             # Roles for GitHub OIDC, ECS, EC2
│   ├── ecr.tf
│   ├── s3.tf
│   ├── rds.tf
│   ├── ec2.tf
│   ├── ecs.tf
│   └── cloudwatch.tf
├── .github/workflows/
│   ├── ci.yml
│   ├── deploy-ec2.yml
│   └── deploy-ecs.yml
├── scripts/
│   └── localstack-init.sh
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```
