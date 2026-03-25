import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  generateFallbackMetadata,
  generateCommitMetadata,
  storeCommitMetadata,
  getCommitMetadata,
} from '../git/commit-metadata';
import { resetDB } from '../storage/db';

vi.mock('../attribution/llm-judge/api-client', () => ({
  getApiKey: vi.fn(),
}));

describe('commit metadata fallback', () => {
  it('generates title for positive word count delta', () => {
    const result = generateFallbackMetadata(10, Date.now());
    expect(result.title).toBe('Added 10 words');
    expect(result.summary).toContain('Added 10 words');
    expect(result.conceptual).toBeNull();
  });

  it('generates title for negative word count delta', () => {
    const result = generateFallbackMetadata(-5, Date.now());
    expect(result.title).toBe('Removed 5 words');
    expect(result.summary).toContain('Removed 5 words');
  });

  it('handles zero delta', () => {
    const result = generateFallbackMetadata(0, Date.now());
    expect(result.title).toBe('Added 0 words');
  });

  it('includes timestamp in summary', () => {
    const ts = new Date('2026-01-15T10:30:00').getTime();
    const result = generateFallbackMetadata(3, ts);
    expect(result.summary).toMatch(/10:30/);
  });
});

describe('commit metadata generation', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { getApiKey } = await import('../attribution/llm-judge/api-client');
    vi.mocked(getApiKey).mockReturnValue(null);
  });

  it('returns fallback when no API key', async () => {
    const result = await generateCommitMetadata('some diff', 5, Date.now());
    expect(result.title).toBe('Added 5 words');
  });

  it('returns fallback when API call fails', async () => {
    const { getApiKey } = await import('../attribution/llm-judge/api-client');
    vi.mocked(getApiKey).mockReturnValue('sk-test');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await generateCommitMetadata('diff text', -3, Date.now());
    expect(result.title).toBe('Removed 3 words');
    vi.unstubAllGlobals();
  });

  it('parses valid API response', async () => {
    const { getApiKey } = await import('../attribution/llm-judge/api-client');
    vi.mocked(getApiKey).mockReturnValue('sk-test');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: '{ "title": "Added introduction paragraph", "summary": "Added opening section.", "conceptual": "Sets the stage for the argument." }',
            },
          ],
        }),
      }),
    );
    const result = await generateCommitMetadata('+ intro text', 15, Date.now());
    expect(result.title).toBe('Added introduction paragraph');
    expect(result.summary).toBe('Added opening section.');
    vi.unstubAllGlobals();
  });
});

describe('commit metadata storage', () => {
  beforeEach(() => {
    resetDB(`test-cm-${Math.random()}`);
  });

  it('stores and retrieves metadata', async () => {
    const metadata = { title: 'Test title', summary: 'Test summary', conceptual: null };
    await storeCommitMetadata('abc123', metadata);
    const retrieved = await getCommitMetadata('abc123');
    expect(retrieved?.title).toBe('Test title');
    expect(retrieved?.summary).toBe('Test summary');
    expect(retrieved?.oid).toBe('abc123');
  });

  it('returns null for unknown OID', async () => {
    const result = await getCommitMetadata('unknown-oid');
    expect(result).toBeNull();
  });
});
