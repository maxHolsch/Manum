import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { resetDB, getDB } from '../storage/db';
import { matchPaste } from '../attribution/paste-attribution';
import type { CopyRecord, AIPoolEntry } from '@manum/shared';

let seq = 0;
beforeEach(() => {
  seq++;
  resetDB(`manum_test_paste_${seq}`);
});
afterEach(() => {
  resetDB();
});

async function addCopyRecord(record: CopyRecord) {
  const db = await getDB();
  await db.add('copy_records', record);
}

async function addAIPool(entry: AIPoolEntry) {
  const db = await getDB();
  await db.add('ai_pool', entry);
}

describe('matchPaste', () => {
  it('returns none for empty text', async () => {
    const result = await matchPaste('');
    expect(result.type).toBe('none');
  });

  it('matches exact copy record', async () => {
    await addCopyRecord({
      id: 'cr1',
      selectedText: 'hello world',
      sourceMessageId: 'msg1',
      timestamp: 1000,
    });
    const result = await matchPaste('hello world');
    expect(result.type).toBe('copy-record');
    if (result.type === 'copy-record') {
      expect(result.match.record.id).toBe('cr1');
      expect(result.match.confidence).toBe(1.0);
    }
  });

  it('picks most recent on multiple exact matches', async () => {
    await addCopyRecord({
      id: 'cr1',
      selectedText: 'text',
      sourceMessageId: 'm1',
      timestamp: 1000,
    });
    await addCopyRecord({
      id: 'cr2',
      selectedText: 'text',
      sourceMessageId: 'm2',
      timestamp: 2000,
    });
    const result = await matchPaste('text');
    expect(result.type).toBe('copy-record');
    if (result.type === 'copy-record') {
      expect(result.match.record.id).toBe('cr2');
    }
  });

  it('matches substring copy record', async () => {
    await addCopyRecord({
      id: 'cr1',
      selectedText: 'the quick brown fox',
      sourceMessageId: 'm1',
      timestamp: 1000,
    });
    const result = await matchPaste('quick brown');
    expect(result.type).toBe('copy-record');
  });

  it('matches AI pool entry with high overlap', async () => {
    await addAIPool({
      messageId: 'ai1',
      text: 'The quick brown fox jumps over the lazy dog',
      timestamp: 1000,
      conversationId: 'conv1',
    });
    // pasted text is full substring of AI text
    const result = await matchPaste('quick brown fox');
    expect(result.type).toBe('ai-pool');
    if (result.type === 'ai-pool') {
      expect(result.match.confidence).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('returns none when no match found', async () => {
    const result = await matchPaste('completely unrelated text');
    expect(result.type).toBe('none');
  });

  it('prefers copy record over AI pool match', async () => {
    await addCopyRecord({
      id: 'cr1',
      selectedText: 'hello world',
      sourceMessageId: 'm1',
      timestamp: 1000,
    });
    await addAIPool({
      messageId: 'ai1',
      text: 'hello world extra content',
      timestamp: 1000,
      conversationId: 'conv1',
    });
    const result = await matchPaste('hello world');
    expect(result.type).toBe('copy-record');
  });
});
