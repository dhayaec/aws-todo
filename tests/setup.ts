// Global test setup — runs before each test file
import { vi } from 'vitest';

// Mock next/headers so tests don't need a Next.js runtime
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => undefined),
      set: vi.fn(),
      delete: vi.fn(),
    })
  ),
}));

// Mock next/server's NextResponse for route handler tests
// (the real one is available in Node 18+ but keep it explicit)
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-xxxxxxxxxxx';
process.env.REFRESH_SECRET = 'test-refresh-secret-min-32-chars-xxxxxxx';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/cloudtodo_test';
process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET = 'cloud-todo-test';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';
