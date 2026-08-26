import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAttachmentKey } from '@/lib/s3';

// We don't call real AWS in unit tests — just test the pure helpers
describe('getAttachmentKey', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  it('builds a key with the correct prefix and user/todo path', () => {
    const key = getAttachmentKey('user-1', 'todo-2', 'report.pdf');
    expect(key).toMatch(/^todo-attachments\/user-1\/todo-2\//);
    expect(key).toMatch(/\.pdf$/);
  });

  it('handles filenames without an extension', () => {
    const key = getAttachmentKey('user-1', 'todo-2', 'README');
    // Extension part will be empty string but key still valid
    expect(key).toMatch(/^todo-attachments\/user-1\/todo-2\//);
  });
});
