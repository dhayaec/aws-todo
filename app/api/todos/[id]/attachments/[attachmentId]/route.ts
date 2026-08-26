import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { deleteObject } from '@/lib/s3';

type RouteParams = { params: Promise<{ id: string; attachmentId: string }> };

// DELETE /api/todos/:id/attachments/:attachmentId
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, attachmentId } = await params;

    // Verify the todo belongs to this user
    const todo = await prisma.todo.findFirst({ where: { id, userId: session.userId } });
    if (!todo) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, todoId: id },
    });
    if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });

    await deleteObject(attachment.s3Key);
    await prisma.attachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('[DELETE /api/todos/:id/attachments/:attachmentId]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
