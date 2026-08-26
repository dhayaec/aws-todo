Yes. This would make an excellent end-to-end cloud/devops learning project. I’d design it so you learn the same application deployed in progressively more advanced ways rather than trying to use EC2 and Fargate simultaneously in production.

One important 2026 caveat: “$0” on AWS is not guaranteed indefinitely. New AWS accounts created after July 15, 2025 use the newer Free Tier/credit model. AWS currently advertises up to $200 in credits, and RDS PostgreSQL is included in the Free Tier options. You should also set billing alerts/budgets before experimenting.

Project: CloudTodo

Build a production-style Todo application:

                         GitHub
                           │
                           │ push / PR
                           ▼
                    GitHub Actions
                    ┌──────────────┐
                    │ lint         │
                    │ typecheck    │
                    │ test         │
                    │ build        │
                    │ Docker build │
                    └──────┬───────┘
                           │
                           ▼
                     Container Image
                           │
                           ▼
                    Amazon ECR
                           │
             ┌─────────────┴─────────────┐
             │                           │
          EC2 deployment          ECS Fargate deployment
             │                           │
             ▼                           ▼
        Next.js Docker             Next.js Docker
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
                     PostgreSQL
                       (RDS)
                           │
                           │
                           ▼
                       Amazon S3
                    user attachments
Application stack
Layer	Technology
Frontend	Next.js + TypeScript
API	Next.js Route Handlers
ORM	Prisma
Database	PostgreSQL / Amazon RDS
Authentication	JWT
Password hashing	bcrypt/Argon2
File storage	Amazon S3
Containerization	Docker
Container registry	Amazon ECR
Compute #1	EC2
Compute #2	ECS Fargate
IaC	Terraform
CI	GitHub Actions
CD	GitHub Actions
Monitoring	CloudWatch
Secrets	AWS Secrets Manager / SSM
DNS	Route 53 — optional
HTTPS	ACM + ALB — optional
Local development	Docker Compose
1. Application features

Don't make the application too complicated.

Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me

Use:

User
 ├── id
 ├── email
 ├── passwordHash
 ├── name
 ├── createdAt
 └── updatedAt
Todos
GET    /api/todos
POST   /api/todos
GET    /api/todos/:id
PATCH  /api/todos/:id
DELETE /api/todos/:id

Schema:

Todo
 ├── id
 ├── title
 ├── description
 ├── completed
 ├── userId
 ├── createdAt
 └── updatedAt
S3 attachments

Allow users to attach files to a todo.

Browser
   │
   │ request upload URL
   ▼
Next.js API
   │
   │ generate presigned URL
   ▼
S3
   ▲
   │
   │ direct upload
   │
Browser

This teaches you an important AWS pattern: don't send every file through your application server.

2. Start completely locally

Before touching AWS:

Next.js
   │
   ▼
Docker Compose
   │
   ├── Next.js
   │
   └── PostgreSQL

Repository:

cloud-todo/
│
├── app/
├── components/
├── lib/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── tests/
│
├── public/
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
│
├── terraform/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-ec2.yml
│       └── deploy-ecs.yml
│
└── README.md
3. Dockerize Next.js

Your first deployment artifact should be:

Next.js source
      │
      ▼
     Docker
      │
      ▼
cloud-todo:latest

Use a multi-stage Docker build:

Stage 1
dependencies


Stage 2
builder


Stage 3
runner

The final image should contain only what is necessary to run Next.js.

4. Terraform

This is where the project becomes really valuable for learning.

Create:

terraform/
│
├── providers.tf
├── variables.tf
├── outputs.tf
├── versions.tf
│
├── networking.tf
├── iam.tf
├── s3.tf
├── rds.tf
├── ecr.tf
├── ec2.tf
├── ecs.tf
└── cloudwatch.tf

Eventually Terraform should be capable of creating:

VPC
├── Subnets
├── Route tables
├── Internet Gateway
│
├── EC2
│
├── ECS
│   ├── Cluster
│   ├── Task Definition
│   └── Service
│
├── RDS PostgreSQL
│
├── S3
│
├── ECR
│
├── IAM
│
└── CloudWatch
5. Learn EC2 first

Don't start with Fargate.

Deploy your Docker container manually to EC2 first.

Architecture:

Internet
    │
    ▼
EC2
 ┌────────────────────┐
 │ Docker             │
 │                    │
 │ Next.js container  │
 │ :3000              │
 └─────────┬──────────┘
           │
           ▼
      RDS PostgreSQL
           │
           ▼
           S3

You'll learn:

VPC
security groups
SSH
IAM
EC2
Linux
Docker
environment variables
PostgreSQL networking
S3 IAM permissions

This is much more educational than immediately hiding everything behind ECS.

6. Then introduce ECR

Instead of building the Docker image on EC2:

GitHub Actions
      │
      ▼
docker build
      │
      ▼
Amazon ECR
      │
      ▼
EC2
      │
      ▼
docker pull

Your image might be tagged:

cloud-todo:1.0.0
cloud-todo:abc1234
cloud-todo:latest

Prefer immutable commit/SHA tags for deployments.

7. Then learn ECS Fargate

Now replace EC2 deployment with:

                    ECR
                     │
                     ▼
              ECS Task Definition
                     │
                     ▼
               ECS Fargate
                     │
              ┌──────┴──────┐
              │             │
           Task 1         Task 2
              │             │
              └──────┬──────┘
                     │
                     ▼
                    RDS

You'll learn:

ECS cluster
task definitions
containers
task roles
execution roles
services
desired count
networking
security groups
health checks
rolling deployments
8. GitHub Actions CI

Your first workflow:

Pull Request
     │
     ▼
GitHub Actions
     │
     ├── npm/pnpm install
     ├── ESLint
     ├── TypeScript
     ├── Unit tests
     ├── Integration tests
     └── Next.js build

For example:

name: CI


on:
  pull_request:
  push:
    branches:
      - main


jobs:
  test:
    runs-on: ubuntu-latest


    steps:
      - uses: actions/checkout@v4


      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm


      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build

For a public GitHub repository, standard GitHub-hosted Actions are currently free; GitHub also provides included monthly minutes for Free accounts.

9. CD pipeline

After CI passes:

main
 │
 ▼
GitHub Actions
 │
 ├── Test
 │
 ├── Docker Build
 │
 ├── Push → ECR
 │
 └── Deploy
        │
        ├── EC2
        │
        └── ECS

I'd actually create two separate deployment workflows:

.github/workflows/


ci.yml


deploy-ec2.yml


deploy-ecs.yml

Then you can deliberately switch between deployment strategies.

10. GitHub → AWS authentication

Don't put this into GitHub:

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

Instead learn:

GitHub Actions
      │
      │ OIDC
      ▼
AWS IAM
      │
      ▼
Temporary credentials

This is an important real-world DevOps skill.

Your GitHub workflow assumes an AWS IAM role using OIDC.

11. Database architecture

Use:

Next.js
   │
   │ DATABASE_URL
   ▼
RDS PostgreSQL

Prisma:

Next.js
   │
   ▼
Prisma
   │
   ▼
PostgreSQL

Development:

localhost
    │
    ▼
Docker PostgreSQL

AWS:

ECS/EC2
    │
    ▼
RDS PostgreSQL

That gives you the same application with different environments.

12. S3 architecture

Create:

S3 bucket
│
├── avatars/
│
├── todo-attachments/
│
└── exports/

Don't make the bucket public just to make the demo easier.

Instead:

User
 │
 ▼
Next.js
 │
 │ Generate presigned URL
 ▼
S3

For downloading:

User
 │
 ▼
Next.js
 │
 │ presigned GET URL
 ▼
S3

This teaches IAM and object-storage security properly.

13. Terraform environments

I'd eventually structure it like:

terraform/
│
├── modules/
│   ├── networking/
│   ├── rds/
│   ├── s3/
│   ├── ecr/
│   ├── ec2/
│   └── ecs/
│
└── environments/
    │
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── terraform.tfvars
    │
    └── prod/
        ├── main.tf
        ├── variables.tf
        └── terraform.tfvars

Then:

terraform init
terraform validate
terraform plan
terraform apply

And eventually:

terraform destroy

That last command is particularly important for a learning project where you're trying to avoid unexpected AWS charges.

14. Monitoring

Add:

CloudWatch
   │
   ├── Application logs
   ├── EC2 logs
   ├── ECS logs
   ├── CPU metrics
   ├── Memory metrics
   └── Alarms

Your learning path becomes:

console.log()
      ↓
Docker logs
      ↓
CloudWatch Logs
      ↓
metrics
      ↓
alarms
15. Security

Add these progressively:

Application
input validation with Zod
rate limiting
secure password hashing
JWT expiration
refresh-token rotation
authorization
CORS where applicable
security headers
file-type/size validation
AWS
IAM least privilege
security groups
private RDS
no public database
S3 bucket blocking public access
Secrets Manager/SSM
GitHub OIDC
encryption
CloudWatch logging
16. The final learning architecture

Eventually:

                         GitHub
                           ▼
                    Next.js application
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
          RDS PostgreSQL             S3
                 │                   │
                 └─────────┬─────────┘
                           ▼
                       CloudWatch
Recommended learning sequence

Don't build everything at once. Do it in 10 stages:

Next.js + TypeScript Todo
PostgreSQL + Prisma
JWT authentication
Docker + Docker Compose
S3 file uploads
Terraform + VPC + IAM + RDS + S3
Deploy Docker to EC2
GitHub Actions CI/CD + ECR
Move deployment from EC2 → ECS Fargate
CloudWatch + security + production hardening