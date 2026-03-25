/**
 * T125: Combined Score to Yellow Intensity Mapping
 *
 * Combines n-gram and keyword overlap scores to produce a final idea overlap
 * score. Applies YELLOW attribution to text chunks that exceed the threshold.
 */

import type { AIPoolEntry } from '@manum/shared';
import { computeNgramOverlap } from './ngram';
import { computeKeywordOverlap } from './keywords';

export const YELLOW_THRESHOLD = 0.3;
const NGRAM_WEIGHT = 0.7;
const KEYWORD_WEIGHT = 0.3;

export interface OverlapResult {
  combinedScore: number;
  ngramScore: number;
  keywordScore: number;
  isYellow: boolean;
  matchedEntry: AIPoolEntry | null;
}

/**
 * Compute the combined overlap score between a user text chunk and a set of
 * temporally-gated AI pool entries. Returns the best (max) score across all
 * AI entries.
 */
export function computeOverlapScore(userText: string, aiEntries: AIPoolEntry[]): OverlapResult {
  if (!userText.trim() || aiEntries.length === 0) {
    return {
      combinedScore: 0,
      ngramScore: 0,
      keywordScore: 0,
      isYellow: false,
      matchedEntry: null,
    };
  }

  let bestCombined = 0;
  let bestNgram = 0;
  let bestKeyword = 0;
  let bestEntry: AIPoolEntry | null = null;

  for (const entry of aiEntries) {
    const ngramScore = computeNgramOverlap(userText, entry.text);
    const keywordScore = computeKeywordOverlap(userText, entry.text);
    const combinedScore = ngramScore * NGRAM_WEIGHT + keywordScore * KEYWORD_WEIGHT;

    if (combinedScore > bestCombined) {
      bestCombined = combinedScore;
      bestNgram = ngramScore;
      bestKeyword = keywordScore;
      bestEntry = entry;
    }
  }

  return {
    combinedScore: bestCombined,
    ngramScore: bestNgram,
    keywordScore: bestKeyword,
    isYellow: bestCombined > YELLOW_THRESHOLD,
    matchedEntry: bestEntry,
  };
}

/**
 * Map an overlap score (0-1) to a yellow opacity value.
 * Higher overlap = more opaque (more yellow).
 * Score 0.3 → opacity 0.15, score 1.0 → opacity 0.4
 */
export function overlapScoreToOpacity(score: number): number {
  const clamped = Math.max(YELLOW_THRESHOLD, Math.min(1.0, score));
  const range = 1.0 - YELLOW_THRESHOLD;
  return 0.15 + ((clamped - YELLOW_THRESHOLD) / range) * 0.25;
}

/**
 * Check if a yellow attribution span was created from idea overlap.
 * YELLOW spans from idea overlap must NOT transition to GREEN.
 */
export function isIdeaOverlapYellow(attrs: Record<string, unknown>): boolean {
  return (
    attrs['color'] === 'yellow' &&
    attrs['ideaOverlapScore'] !== null &&
    attrs['ideaOverlapScore'] !== undefined
  );
}
