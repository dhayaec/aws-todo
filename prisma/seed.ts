import { PrismaClient } from '../lib/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create demo todos
  const todos = await Promise.all([
    prisma.todo.upsert({
      where: { id: 'seed-todo-1' },
      update: {},
      create: {
        id: 'seed-todo-1',
        title: 'Set up AWS account',
        description: 'Create an AWS account and configure billing alerts',
        completed: true,
        userId: user.id,
      },
    }),
    prisma.todo.upsert({
      where: { id: 'seed-todo-2' },
      update: {},
      create: {
        id: 'seed-todo-2',
        title: 'Deploy to EC2',
        description: 'Deploy the Docker container to an EC2 instance',
        completed: false,
        userId: user.id,
      },
    }),
    prisma.todo.upsert({
      where: { id: 'seed-todo-3' },
      update: {},
      create: {
        id: 'seed-todo-3',
        title: 'Set up RDS PostgreSQL',
        description: 'Create a PostgreSQL RDS instance in a private subnet',
        completed: false,
        userId: user.id,
      },
    }),
  ]);

  console.log(`Created ${todos.length} todos`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
