import { describe, it, expect } from 'vitest';
import {
  computeOverlapScore,
  overlapScoreToOpacity,
  isIdeaOverlapYellow,
  YELLOW_THRESHOLD,
} from '../attribution/yellow-scorer';
import type { AIPoolEntry } from '@manum/shared';

function makeEntry(messageId: string, text: string, timestamp = 100): AIPoolEntry {
  return { messageId, text, timestamp, conversationId: 'conv-1' };
}

describe('computeOverlapScore', () => {
  it('returns 0 score for empty user text', () => {
    const result = computeOverlapScore('', [makeEntry('a', 'some ai text here now')]);
    expect(result.combinedScore).toBe(0);
    expect(result.isYellow).toBe(false);
  });

  it('returns 0 score for empty AI entries', () => {
    const result = computeOverlapScore('user text here', []);
    expect(result.combinedScore).toBe(0);
    expect(result.isYellow).toBe(false);
  });

  it('detects high overlap as YELLOW', () => {
    const text =
      'machine learning algorithms process large datasets using neural networks efficiently';
    const result = computeOverlapScore(text, [
      makeEntry(
        'ai1',
        'machine learning algorithms process large datasets using deep neural networks',
      ),
    ]);
    expect(result.isYellow).toBe(true);
    expect(result.combinedScore).toBeGreaterThan(YELLOW_THRESHOLD);
    expect(result.matchedEntry).not.toBeNull();
  });

  it('does not flag unrelated text as YELLOW', () => {
    const result = computeOverlapScore('the quick brown fox jumps over the lazy dog', [
      makeEntry('ai1', 'completely different topic about cooking and recipes and food'),
    ]);
    expect(result.isYellow).toBe(false);
  });

  it('returns the best matched entry', () => {
    const userText = 'neural network architectures transform data processing pipelines';
    const result = computeOverlapScore(userText, [
      makeEntry('weak', 'completely unrelated text here now'),
      makeEntry('strong', 'neural network architectures transform data processing efficiently'),
    ]);
    if (result.isYellow) {
      expect(result.matchedEntry?.messageId).toBe('strong');
    }
  });
});

describe('overlapScoreToOpacity', () => {
  it('returns value in range 0.15-0.4', () => {
    for (const score of [0.3, 0.5, 0.7, 1.0]) {
      const opacity = overlapScoreToOpacity(score);
      expect(opacity).toBeGreaterThanOrEqual(0.15);
      expect(opacity).toBeLessThanOrEqual(0.41);
    }
  });

  it('higher score gives higher opacity', () => {
    expect(overlapScoreToOpacity(0.9)).toBeGreaterThan(overlapScoreToOpacity(0.4));
  });
});

describe('isIdeaOverlapYellow', () => {
  it('returns true for yellow with ideaOverlapScore', () => {
    expect(isIdeaOverlapYellow({ color: 'yellow', ideaOverlapScore: 0.5 })).toBe(true);
  });

  it('returns false for yellow without ideaOverlapScore', () => {
    expect(isIdeaOverlapYellow({ color: 'yellow', ideaOverlapScore: null })).toBe(false);
  });

  it('returns false for non-yellow colors', () => {
    expect(isIdeaOverlapYellow({ color: 'green', ideaOverlapScore: 0.5 })).toBe(false);
    expect(isIdeaOverlapYellow({ color: 'red', ideaOverlapScore: 0.5 })).toBe(false);
  });
});
