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

  // AI pool fallback: substring overlap >= 80%
  const aiPool = await db.getAll('ai_pool');
  let bestMatch: AIPoolMatch | null = null;
  for (const entry of aiPool) {
    const overlap = computeOverlap(pastedText, entry.text);
    const confidence = pastedText.length > 0 ? overlap / pastedText.length : 0;
    if (confidence >= 0.8) {
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { entry, confidence };
      }
    }
  }
  if (bestMatch) return { type: 'ai-pool', match: bestMatch };

  return { type: 'none' };
}

function computeOverlap(pastedText: string, entryText: string): number {
  if (pastedText.length === 0 || entryText.length === 0) return 0;
  if (entryText.includes(pastedText)) return pastedText.length;
  if (pastedText.includes(entryText)) return entryText.length;
  return longestCommonSubstringLength(pastedText, entryText);
}

function longestCommonSubstringLength(a: string, b: string): number {
  let maxLen = 0;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > maxLen) maxLen = dp[i][j];
      }
    }
  }
  return maxLen;
}
