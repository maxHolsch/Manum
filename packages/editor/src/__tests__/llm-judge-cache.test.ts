import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeContentHash,
  clearMemoryCache,
  getCachedResult,
  setCachedResult,
} from '../attribution/llm-judge/cache';

// Mock IndexedDB operations to avoid complexity
vi.mock('../storage/db', () => ({
  getDB: vi.fn().mockRejectedValue(new Error('No DB in test')),
}));

describe('computeContentHash', () => {
  it('returns a non-empty string', async () => {
    const hash = await computeContentHash('user text', 'ai text');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('returns different hashes for different inputs', async () => {
    const hash1 = await computeContentHash('text A', 'ai text');
    const hash2 = await computeContentHash('text B', 'ai text');
    expect(hash1).not.toBe(hash2);
  });

  it('returns same hash for same inputs', async () => {
    const hash1 = await computeContentHash('same user text', 'same ai text');
    const hash2 = await computeContentHash('same user text', 'same ai text');
    expect(hash1).toBe(hash2);
  });
});

describe('memory cache', () => {
  beforeEach(() => {
    clearMemoryCache();
  });

  it('returns null for cache miss', async () => {
    const result = await getCachedResult('nonexistent-hash');
    expect(result).toBeNull();
  });

  it('returns cached result after setting', async () => {
    const mockResult = { score: 0.7, classification: 'yellow' as const, reasoning: 'test' };
    await setCachedResult('test-hash-123', mockResult);
    const result = await getCachedResult('test-hash-123');
    expect(result).toEqual(mockResult);
  });

  it('prevents duplicate API calls for same pair', async () => {
    const pair = { userText: 'hello world', aiText: 'ai response' };
    const hash = await computeContentHash(pair.userText, pair.aiText);
    const mockResult = { score: 0.5, classification: 'yellow' as const, reasoning: 'test' };

    // First set
    await setCachedResult(hash, mockResult);

    // Second lookup should use cache
    let apiCallCount = 0;
    const mockApiCall = async () => {
      apiCallCount++;
      return mockResult;
    };

    const cached = await getCachedResult(hash);
    if (cached) {
      // Use cached result directly
    } else {
      await mockApiCall();
    }

    expect(apiCallCount).toBe(0);
    expect(cached).toEqual(mockResult);
  });
});
