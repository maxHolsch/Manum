import { describe, it, expect } from 'vitest';
import { filterByTimestamp } from '../attribution/temporal-gate';
import type { AIPoolEntry } from '@manum/shared';

function makeEntry(messageId: string, timestamp: number): AIPoolEntry {
  return {
    messageId,
    text: `AI response at t=${timestamp}`,
    timestamp,
    conversationId: 'conv-1',
  };
}

describe('temporal-gate', () => {
  describe('filterByTimestamp', () => {
    it('returns entries with timestamp < beforeTimestamp', () => {
      const entries = [makeEntry('a', 50), makeEntry('b', 100), makeEntry('c', 150)];

      const result = filterByTimestamp(entries, 100);
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe('a');
    });

    it('excludes entries at exact timestamp (strict less-than)', () => {
      const entries = [makeEntry('a', 100)];
      expect(filterByTimestamp(entries, 100)).toHaveLength(0);
    });

    it('returns all entries when all predate the timestamp', () => {
      const entries = [makeEntry('a', 10), makeEntry('b', 20), makeEntry('c', 30)];
      expect(filterByTimestamp(entries, 1000)).toHaveLength(3);
    });

    it('returns empty array when no entries predate the timestamp', () => {
      const entries = [makeEntry('a', 200), makeEntry('b', 300)];
      expect(filterByTimestamp(entries, 100)).toHaveLength(0);
    });

    it('user text before AI — AI entry at T=100, user at T=50 → no match', () => {
      // User wrote at T=50; AI entry at T=100 → T=100 is NOT < T=50 → filtered out
      const entries = [makeEntry('ai1', 100)];
      const userCreatedAt = 50;
      const result = filterByTimestamp(entries, userCreatedAt);
      expect(result).toHaveLength(0);
    });

    it('AI entry at T=50, user text at T=100 → match (AI was first)', () => {
      const entries = [makeEntry('ai1', 50)];
      const userCreatedAt = 100;
      const result = filterByTimestamp(entries, userCreatedAt);
      expect(result).toHaveLength(1);
    });

    it('handles empty entries array', () => {
      expect(filterByTimestamp([], 100)).toHaveLength(0);
    });
  });
});
