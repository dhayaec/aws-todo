import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/auth';

const payload = { userId: 'user-1', email: 'test@example.com', name: 'Test User' };

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    await expect(verifyPassword('secret123', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('secret123');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});

describe('createAccessToken / verifyAccessToken', () => {
  it('creates a verifiable token with the correct payload', async () => {
    const token = await createAccessToken(payload);
    const decoded = await verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.name).toBe(payload.name);
  });

  it('returns null for a tampered token', async () => {
    const token = await createAccessToken(payload);
    const tampered = token.slice(0, -4) + 'XXXX';
    await expect(verifyAccessToken(tampered)).resolves.toBeNull();
  });

  it('returns null for a garbage string', async () => {
    await expect(verifyAccessToken('not.a.token')).resolves.toBeNull();
  });
});

describe('createRefreshToken / verifyRefreshToken', () => {
  it('creates a verifiable refresh token', async () => {
    const token = await createRefreshToken(payload);
    const decoded = await verifyRefreshToken(token);
    expect(decoded?.userId).toBe(payload.userId);
  });

  it('access token cannot be verified as refresh token', async () => {
    const accessToken = await createAccessToken(payload);
    // Different secret → should fail
    await expect(verifyRefreshToken(accessToken)).resolves.toBeNull();
  });
});
