import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Constant-time response to avoid user enumeration
      await new Promise((r) => setTimeout(r, 200));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const payload = { userId: user.id, email: user.email, name: user.name };
    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken(payload),
      createRefreshToken(payload),
    ]);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
