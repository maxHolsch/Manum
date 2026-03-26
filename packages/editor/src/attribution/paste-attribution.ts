import type { CopyRecord, AIPoolEntry } from '@manum/shared';
import { getDB } from '../storage/db';

export interface CopyRecordMatch {
  record: CopyRecord;
  confidence: 1.0;
}

export interface AIPoolMatch {
  entry: AIPoolEntry;
  confidence: number;
}

export type PasteMatch =
  | { type: 'copy-record'; match: CopyRecordMatch }
  | { type: 'ai-pool'; match: AIPoolMatch }
  | { type: 'none' };

export async function matchPaste(pastedText: string): Promise<PasteMatch> {
  if (!pastedText.trim()) return { type: 'none' };
  const db = await getDB();
  const copyRecords = await db.getAll('copy_records');

  // Exact match first
  const exactMatches = copyRecords.filter((r) => r.selectedText === pastedText);
  if (exactMatches.length > 0) {
    const record = exactMatches.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
    return { type: 'copy-record', match: { record, confidence: 1.0 } };
  }

  // Substring match
  const substringMatches = copyRecords.filter(
    (r) => r.selectedText.includes(pastedText) || pastedText.includes(r.selectedText),
  );
  if (substringMatches.length > 0) {
    const record = substringMatches.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
    return { type: 'copy-record', match: { record, confidence: 1.0 } };
  }

  // AI pool fallback: coverage-based matching (handles partial pastes/subsets)
  // Uses normalized text comparison + token coverage for ≥50% match
  const aiPool = await db.getAll('ai_pool');
  let bestMatch: AIPoolMatch | null = null;
  for (const entry of aiPool) {
    const confidence = computeCoverage(pastedText, entry.text);
    if (confidence >= 0.5) {
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { entry, confidence };
      }
    }
  }
  if (bestMatch) return { type: 'ai-pool', match: bestMatch };

  return { type: 'none' };
}

/**
 * Compute what fraction of the pasted text's tokens appear in the AI entry.
 * Uses word-level token coverage which handles:
 * - Subset pastes (user copied only part of an AI response)
 * - Reordered pastes (user rearranged sentences)
 * - Minor edits during paste (clipboard modifications)
 *
 * Falls back to character-level LCS for very short texts.
 */
function computeCoverage(pastedText: string, entryText: string): number {
  if (pastedText.length === 0 || entryText.length === 0) return 0;

  // Fast path: exact substring containment
  const normPaste = pastedText.toLowerCase().trim();
  const normEntry = entryText.toLowerCase().trim();
  if (normEntry.includes(normPaste)) return 1.0;
  if (normPaste.includes(normEntry)) return normEntry.length / normPaste.length;

  // Token-level coverage: what % of pasted words appear in the AI text?
  const pasteTokens = normPaste.split(/\s+/).filter((t) => t.length > 2);
  if (pasteTokens.length < 3) {
    // For very short pastes, fall back to character LCS
    const lcsLen = longestCommonSubstringLength(normPaste, normEntry);
    return normPaste.length > 0 ? lcsLen / normPaste.length : 0;
  }

  const entryTokenSet = new Set(normEntry.split(/\s+/));
  let matched = 0;
  for (const token of pasteTokens) {
    if (entryTokenSet.has(token)) matched++;
  }
  const tokenCoverage = matched / pasteTokens.length;

  // Also compute LCS ratio for sequence similarity
  const lcsLen = longestCommonSubstringLength(normPaste, normEntry);
  const lcsRatio = normPaste.length > 0 ? lcsLen / normPaste.length : 0;

  // Take the higher of the two signals
  return Math.max(tokenCoverage, lcsRatio);
}

function longestCommonSubstringLength(a: string, b: string): number {
  // Optimize: only use rolling row to avoid O(m*n) memory for large texts
  const m = a.length;
  const n = b.length;
  // Cap to prevent excessive computation on very large texts
  if (m * n > 5_000_000) {
    // For large texts, sample-based approach
    const sampleLen = Math.min(m, 2000);
    const sampleA = a.slice(0, sampleLen);
    return lcsRolling(sampleA, b);
  }
  return lcsRolling(a, b);
}

function lcsRolling(a: string, b: string): number {
  let maxLen = 0;
  const m = a.length;
  const n = b.length;
  const prev = new Array<number>(n + 1).fill(0);
  const curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
        if (curr[j] > maxLen) maxLen = curr[j];
      } else {
        curr[j] = 0;
      }
    }
    // Swap rows
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j];
      curr[j] = 0;
    }
  }
  return maxLen;
}
