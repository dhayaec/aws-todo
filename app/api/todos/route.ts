import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const completed = searchParams.get('completed');

    const todos = await prisma.todo.findMany({
      where: {
        userId: session.userId,
        ...(completed !== null && { completed: completed === 'true' }),
      },
      include: {
        attachments: {
          select: { id: true, filename: true, mimeType: true, size: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ todos });
  } catch (error) {
    console.error('[GET /api/todos]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createTodoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        userId: session.userId,
      },
      include: { attachments: true },
    });

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/todos]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
