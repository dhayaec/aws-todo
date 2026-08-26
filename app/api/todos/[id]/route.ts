import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Attachment } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { deleteObject } from '@/lib/s3';

const updateTodoSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  completed: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

async function getTodoForUser(id: string, userId: string) {
  return prisma.todo.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const todo = await prisma.todo.findFirst({
      where: { id, userId: session.userId },
      include: {
        attachments: {
          select: { id: true, filename: true, mimeType: true, size: true, createdAt: true },
        },
      },
    });

    if (!todo) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('[GET /api/todos/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await getTodoForUser(id, session.userId);
    if (!existing) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

    const body = await req.json();
    const parsed = updateTodoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: parsed.data,
      include: {
        attachments: {
          select: { id: true, filename: true, mimeType: true, size: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({ todo });
  } catch (error) {
    console.error('[PATCH /api/todos/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.todo.findFirst({
      where: { id, userId: session.userId },
      include: { attachments: true },
    });
    if (!existing) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

    // Delete S3 objects for all attachments
    await Promise.allSettled(
      existing.attachments.map((att: Attachment) => deleteObject(att.s3Key))
    );

    await prisma.todo.delete({ where: { id } });

    return NextResponse.json({ message: 'Todo deleted' });
  } catch (error) {
    console.error('[DELETE /api/todos/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
