import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { resetDB, getDB } from '../storage/db';

// Mock chrome.storage before importing extension-sync
const mockStorage: { aiPool: unknown[]; copyRecords: unknown[] } = {
  aiPool: [],
  copyRecords: [],
};

const mockChrome = {
  storage: {
    local: {
      get: vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          result[key] = mockStorage[key as keyof typeof mockStorage] ?? [];
        }
        callback(result);
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null,
  },
};

let testDbSeq = 0;

beforeEach(() => {
  testDbSeq++;
  resetDB(`manum_test_sync_${testDbSeq}`);
  mockStorage.aiPool = [];
  mockStorage.copyRecords = [];
  // Set global chrome
  (globalThis as Record<string, unknown>).chrome = mockChrome;
});

afterEach(() => {
  resetDB();
  delete (globalThis as Record<string, unknown>).chrome;
  vi.clearAllMocks();
});

describe('extension-sync', () => {
  it('detects extension availability', async () => {
    const { isExtensionAvailable } = await import('../sync/extension-sync');
    expect(isExtensionAvailable()).toBe(true);
  });

  it('returns false when chrome is unavailable', async () => {
    delete (globalThis as Record<string, unknown>).chrome;
    const { isExtensionAvailable } = await import('../sync/extension-sync');
    expect(isExtensionAvailable()).toBe(false);
    (globalThis as Record<string, unknown>).chrome = mockChrome;
  });

  it('syncs AI pool entries from chrome.storage to IndexedDB', async () => {
    mockStorage.aiPool = [
      { messageId: 'msg_1', text: 'Hello AI', timestamp: 1000, conversationId: 'conv_1' },
      { messageId: 'msg_2', text: 'Response', timestamp: 2000, conversationId: 'conv_1' },
    ];

    const { syncFromExtension } = await import('../sync/extension-sync');
    await syncFromExtension();

    const db = await getDB();
    const entries = await db.getAll('ai_pool');
    expect(entries).toHaveLength(2);
    expect(entries.find((e) => e.messageId === 'msg_1')?.text).toBe('Hello AI');
  });

  it('syncs copy records from chrome.storage to IndexedDB', async () => {
    mockStorage.copyRecords = [
      { id: 'copy_1', selectedText: 'test', sourceMessageId: 'msg_1', timestamp: 1000 },
    ];

    const { syncFromExtension } = await import('../sync/extension-sync');
    await syncFromExtension();

    const db = await getDB();
    const records = await db.getAll('copy_records');
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('copy_1');
  });

  it('is idempotent (no duplicates on repeated sync)', async () => {
    mockStorage.aiPool = [
      { messageId: 'msg_1', text: 'Hello', timestamp: 1000, conversationId: 'c1' },
    ];

    const { syncFromExtension } = await import('../sync/extension-sync');
    await syncFromExtension();
    await syncFromExtension();
    await syncFromExtension();

    const db = await getDB();
    const entries = await db.getAll('ai_pool');
    expect(entries).toHaveLength(1);
  });

  it('does not throw when chrome storage is unavailable', async () => {
    delete (globalThis as Record<string, unknown>).chrome;

    const { syncFromExtension } = await import('../sync/extension-sync');
    await expect(syncFromExtension()).resolves.toBeUndefined();

    (globalThis as Record<string, unknown>).chrome = mockChrome;
  });
});
