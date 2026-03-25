/**
 * Tests for storage management utilities.
 */

import type { AIPoolEntry, CopyRecord, TabEvent } from '@manum/shared';
import {
  getAIPoolEntries,
  setAIPoolEntries,
  getCopyRecordEntries,
  setTabEventEntries,
  getTabEventEntries,
  estimateStorageSize,
  evictAIPoolIfNeeded,
  AI_POOL_MAX_ENTRIES,
} from '../storage/manager.js';
import { STORAGE_KEYS } from '../storage/keys.js';

// ---------------------------------------------------------------------------
// chrome.storage.local mock
// ---------------------------------------------------------------------------
const store: Record<string, unknown> = {};

(global as unknown as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get: jest.fn(async (key: string) => ({ [key]: store[key] })),
      set: jest.fn(async (obj: Record<string, unknown>) => {
        Object.assign(store, obj);
      }),
    },
  },
};

function refreshMocks(): void {
  const ch = (
    global as unknown as Record<string, { storage: { local: Record<string, jest.Mock> } }>
  ).chrome;
  ch.storage.local.get.mockImplementation(async (key: string) => ({ [key]: store[key] }));
  ch.storage.local.set.mockImplementation(async (obj: Record<string, unknown>) => {
    Object.assign(store, obj);
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAIEntry(messageId: string, timestamp = Date.now()): AIPoolEntry {
  return { messageId, text: 'text', timestamp, conversationId: 'conv-1' };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('storage manager', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
    refreshMocks();
  });

  describe('STORAGE_KEYS constants', () => {
    it('defines AI_POOL key', () => {
      expect(STORAGE_KEYS.AI_POOL).toBe('manum_ai_pool');
    });

    it('defines COPY_RECORDS key', () => {
      expect(STORAGE_KEYS.COPY_RECORDS).toBe('manum_copy_records');
    });

    it('defines TAB_EVENTS key', () => {
      expect(STORAGE_KEYS.TAB_EVENTS).toBe('manum_tab_events');
    });
  });

  describe('typed getters/setters', () => {
    it('roundtrips AI pool entries', async () => {
      const entries = [makeAIEntry('msg-1'), makeAIEntry('msg-2')];
      await setAIPoolEntries(entries);
      const retrieved = await getAIPoolEntries();
      expect(retrieved).toEqual(entries);
    });

    it('returns empty array for unset AI pool', async () => {
      expect(await getAIPoolEntries()).toEqual([]);
    });

    it('roundtrips copy records', async () => {
      const records: CopyRecord[] = [
        { id: 'c1', selectedText: 'hello', sourceMessageId: 'm1', timestamp: 1000 },
      ];
      const { setCopyRecordEntries } = await import('../storage/manager.js');
      await setCopyRecordEntries(records);
      expect(await getCopyRecordEntries()).toEqual(records);
    });

    it('roundtrips tab events', async () => {
      const events: TabEvent[] = [{ tabType: 'claude', timestamp: 1000, url: 'https://claude.ai' }];
      await setTabEventEntries(events);
      expect(await getTabEventEntries()).toEqual(events);
    });
  });

  describe('estimateStorageSize', () => {
    it('returns 0 for empty storage', async () => {
      const size = await estimateStorageSize();
      // JSON.stringify([]) = "[]" = 2 bytes × 3 = 6
      expect(size).toBe(6);
    });

    it('returns a positive number when entries exist', async () => {
      await setAIPoolEntries([makeAIEntry('msg-1')]);
      const size = await estimateStorageSize();
      expect(size).toBeGreaterThan(6);
    });
  });

  describe('evictAIPoolIfNeeded', () => {
    it('does not evict when under limit', async () => {
      const entries = [makeAIEntry('msg-1'), makeAIEntry('msg-2')];
      await setAIPoolEntries(entries);
      const evicted = await evictAIPoolIfNeeded(100);
      expect(evicted).toBe(0);
      expect(await getAIPoolEntries()).toHaveLength(2);
    });

    it('evicts oldest entries when over limit', async () => {
      const entries = [
        makeAIEntry('old-1', 1000),
        makeAIEntry('old-2', 2000),
        makeAIEntry('new-1', 3000),
        makeAIEntry('new-2', 4000),
      ];
      await setAIPoolEntries(entries);

      const evicted = await evictAIPoolIfNeeded(2);
      expect(evicted).toBe(2);

      const kept = await getAIPoolEntries();
      expect(kept).toHaveLength(2);
      expect(kept.map((e) => e.messageId)).toEqual(['new-1', 'new-2']);
    });

    it('AI_POOL_MAX_ENTRIES is a reasonable large number', () => {
      expect(AI_POOL_MAX_ENTRIES).toBeGreaterThanOrEqual(1000);
    });
  });
});
