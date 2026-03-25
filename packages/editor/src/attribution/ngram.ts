/**
 * T123: N-Gram Extraction and Overlap Scoring
 */

import { STOPWORDS } from './stopwords';

/**
 * Extract n-grams of a specific size from text.
 * Stopwords are filtered out first to reduce false positives.
 */
export function extractNgrams(text: string, n: number): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w));

  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Compute n-gram overlap score between user text and AI entry text.
 * Returns a value 0-1 representing what fraction of user n-grams appear in AI text.
 *
 * Uses weighted average across n=3, n=4, n=5 (higher n = stronger signal).
 */
export function computeNgramOverlap(userText: string, aiText: string): number {
  const weights = [
    { n: 3, weight: 0.3 },
    { n: 4, weight: 0.35 },
    { n: 5, weight: 0.35 },
  ];

  let totalWeight = 0;
  let weightedScore = 0;

  for (const { n, weight } of weights) {
    const userNgrams = extractNgrams(userText, n);
    if (userNgrams.size === 0) continue;

    const aiNgrams = extractNgrams(aiText, n);
    let intersection = 0;
    for (const ngram of userNgrams) {
      if (aiNgrams.has(ngram)) intersection++;
    }

    const score = intersection / userNgrams.size;
    weightedScore += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * Compute overlap between user text and multiple AI entries.
 * Returns the best (max) combined score and the matching entry.
 */
export function computeBestNgramOverlap(
  userText: string,
  aiEntries: Array<{ messageId: string; text: string; timestamp: number }>,
): { score: number; matchedEntry: { messageId: string; text: string; timestamp: number } | null } {
  let bestScore = 0;
  let bestEntry = null;

  for (const entry of aiEntries) {
    const score = computeNgramOverlap(userText, entry.text);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return { score: bestScore, matchedEntry: bestEntry };
}
