import { describe, it, expect } from 'vitest';

describe('Editor package smoke test', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should import shared types', async () => {
    const shared = await import('@manum/shared');
    expect(shared).toBeDefined();
  });
});
