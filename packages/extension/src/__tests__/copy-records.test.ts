/**
 * Tests for copy record storage.
 */

import type { CopyRecord } from '@manum/shared';
import {
  addCopyRecord,
  getCopyRecords,
  clearCopyRecords,
  COPY_RECORDS_KEY,
} from '../storage/copy-records.js';

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
      remove: jest.fn(async (key: string) => {
        delete store[key];
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
  ch.storage.local.remove.mockImplementation(async (key: string) => {
    delete store[key];
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('copy-records storage', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
    refreshMocks();
  });

  function makeRecord(): Omit<CopyRecord, 'id'> {
    return { selectedText: 'hello world', sourceMessageId: 'msg-1', timestamp: Date.now() };
  }

  it('starts with empty records', async () => {
    expect(await getCopyRecords()).toEqual([]);
  });

  it('adds a copy record with a generated id', async () => {
    await addCopyRecord(makeRecord());
    const records = await getCopyRecords();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBeDefined();
    expect(records[0].selectedText).toBe('hello world');
  });

  it('stores under the correct key', async () => {
    await addCopyRecord(makeRecord());
    const ch = (
      global as unknown as Record<string, { storage: { local: Record<string, jest.Mock> } }>
    ).chrome;
    expect(ch.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ [COPY_RECORDS_KEY]: expect.any(Array) }),
    );
  });

  it('multiple copies from same message create separate records', async () => {
    await addCopyRecord(makeRecord());
    await addCopyRecord(makeRecord());
    const records = await getCopyRecords();
    expect(records).toHaveLength(2);
    // IDs should be unique
    expect(records[0].id).not.toBe(records[1].id);
  });

  it('records have all required CopyRecord fields', async () => {
    await addCopyRecord(makeRecord());
    const record = (await getCopyRecords())[0];
    expect(record).toHaveProperty('id');
    expect(record).toHaveProperty('selectedText');
    expect(record).toHaveProperty('sourceMessageId');
    expect(record).toHaveProperty('timestamp');
  });

  it('clearCopyRecords removes all records', async () => {
    await addCopyRecord(makeRecord());
    await clearCopyRecords();
    expect(await getCopyRecords()).toEqual([]);
  });
});
