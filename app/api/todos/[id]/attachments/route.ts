import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Attachment } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generatePresignedUploadUrl, generatePresignedDownloadUrl, getAttachmentKey } from '@/lib/s3';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().refine((v) => ALLOWED_MIME_TYPES.includes(v), {
    message: 'File type not allowed',
  }),
  size: z.number().int().positive().max(MAX_FILE_SIZE, 'File exceeds 10 MB limit'),
});

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/todos/:id/attachments — generate presigned upload URL
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const todo = await prisma.todo.findFirst({ where: { id, userId: session.userId } });
    if (!todo) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

    const body = await req.json();
    const parsed = uploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { filename, contentType, size } = parsed.data;
    const s3Key = getAttachmentKey(session.userId, id, filename);
    const uploadUrl = await generatePresignedUploadUrl(s3Key, contentType);

    // Create attachment record (pending — client will confirm after upload)
    const attachment = await prisma.attachment.create({
      data: { todoId: id, filename, s3Key, mimeType: contentType, size },
    });

    return NextResponse.json({ uploadUrl, attachment }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/todos/:id/attachments]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/todos/:id/attachments — list with presigned download URLs
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const todo = await prisma.todo.findFirst({ where: { id, userId: session.userId } });
    if (!todo) return NextResponse.json({ error: 'Todo not found' }, { status: 404 });

    const attachments = await prisma.attachment.findMany({ where: { todoId: id } });

    const withUrls = await Promise.all(
      attachments.map(async (att: Attachment) => ({
        ...att,
        downloadUrl: await generatePresignedDownloadUrl(att.s3Key),
      }))
    );

    return NextResponse.json({ attachments: withUrls });
  } catch (error) {
    console.error('[GET /api/todos/:id/attachments]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
