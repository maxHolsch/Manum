/**
 * Tests for AI pool storage operations.
 * Uses an in-memory mock for chrome.storage.local.
 */

import type { AIPoolEntry } from '@manum/shared';
import { addAIPoolEntry, getAIPool, clearAIPool, AI_POOL_KEY } from '../storage/ai-pool.js';

// ---------------------------------------------------------------------------
// chrome.storage.local mock
// ---------------------------------------------------------------------------
const store: Record<string, unknown> = {};

const chromeMock = {
  storage: {
    local: {
      get: jest.fn(async (key: string) => {
        return { [key]: store[key] };
      }),
      set: jest.fn(async (obj: Record<string, unknown>) => {
        Object.assign(store, obj);
      }),
      remove: jest.fn(async (key: string) => {
        delete store[key];
      }),
    },
  },
};

(global as unknown as Record<string, unknown>).chrome = chromeMock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(messageId: string, text = 'AI response text'): AIPoolEntry {
  return {
    messageId,
    text,
    timestamp: Date.now(),
    conversationId: 'conv-1',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ai-pool storage', () => {
  beforeEach(async () => {
    // Reset store and mocks
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
    // Re-bind mock functions (clearAllMocks clears call counts but not impls)
    chromeMock.storage.local.get.mockImplementation(async (key: string) => ({
      [key]: store[key],
    }));
    chromeMock.storage.local.set.mockImplementation(async (obj: Record<string, unknown>) => {
      Object.assign(store, obj);
    });
    chromeMock.storage.local.remove.mockImplementation(async (key: string) => {
      delete store[key];
    });
  });

  it('starts with an empty pool', async () => {
    const pool = await getAIPool();
    expect(pool).toEqual([]);
  });

  it('adds an entry to the pool', async () => {
    const entry = makeEntry('msg-001');
    await addAIPoolEntry(entry);

    const pool = await getAIPool();
    expect(pool).toHaveLength(1);
    expect(pool[0]).toEqual(entry);
  });

  it('stores entry under the correct key', async () => {
    await addAIPoolEntry(makeEntry('msg-002'));
    expect(chromeMock.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ [AI_POOL_KEY]: expect.any(Array) }),
    );
  });

  it('ignores duplicate messageIds (idempotent)', async () => {
    const entry = makeEntry('msg-003');
    await addAIPoolEntry(entry);
    await addAIPoolEntry(entry); // duplicate

    const pool = await getAIPool();
    expect(pool).toHaveLength(1);
  });

  it('stores multiple entries from different messages', async () => {
    await addAIPoolEntry(makeEntry('msg-004', 'First response'));
    await addAIPoolEntry(makeEntry('msg-005', 'Second response'));

    const pool = await getAIPool();
    expect(pool).toHaveLength(2);
    expect(pool.map((e) => e.messageId)).toEqual(['msg-004', 'msg-005']);
  });

  it('entries have all required AIPoolEntry fields', async () => {
    const entry = makeEntry('msg-006');
    await addAIPoolEntry(entry);

    const pool = await getAIPool();
    const stored = pool[0];
    expect(stored).toHaveProperty('messageId');
    expect(stored).toHaveProperty('text');
    expect(stored).toHaveProperty('timestamp');
    expect(stored).toHaveProperty('conversationId');
  });

  it('clearAIPool removes all entries', async () => {
    await addAIPoolEntry(makeEntry('msg-007'));
    await clearAIPool();

    const pool = await getAIPool();
    expect(pool).toEqual([]);
  });
});
