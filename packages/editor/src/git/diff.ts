/**
 * T133: Git diff operations
 */

import git from 'isomorphic-git';
import { getFS, GIT_DIR } from './fs';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

export interface CommitDiff {
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

async function readFileAtCommit(oid: string, filePath: string): Promise<string | null> {
  const fs = getFS();
  try {
    const { blob } = await git.readBlob({
      fs,
      dir: GIT_DIR,
      oid,
      filepath: filePath,
    });
    return new TextDecoder().decode(blob);
  } catch {
    return null;
  }
}

/**
 * Simple line-by-line diff algorithm (Myers diff lite)
 */
function computeLineDiff(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const lcs = computeLCS(aLines, bLines);

  let ai = 0;
  let bi = 0;
  let li = 0;

  while (ai < aLines.length || bi < bLines.length) {
    if (li < lcs.length && ai < aLines.length && aLines[ai] === lcs[li]) {
      // Line is in LCS — it's unchanged (from a's perspective)
      if (bi < bLines.length && bLines[bi] === lcs[li]) {
        result.push({ type: 'unchanged', content: lcs[li] });
        ai++;
        bi++;
        li++;
      } else {
        result.push({ type: 'added', content: bLines[bi] });
        bi++;
      }
    } else if (bi < bLines.length && bLines[bi] === (lcs[li] ?? null)) {
      result.push({ type: 'removed', content: aLines[ai] });
      ai++;
    } else {
      // Lines diverge
      if (ai < aLines.length && (li >= lcs.length || aLines[ai] !== lcs[li])) {
        result.push({ type: 'removed', content: aLines[ai] });
        ai++;
      }
      if (bi < bLines.length && (li >= lcs.length || bLines[bi] !== lcs[li])) {
        result.push({ type: 'added', content: bLines[bi] });
        bi++;
      }
    }
  }

  return result;
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

export async function getCommitDiff(
  docId: string,
  commitA: string,
  commitB: string,
): Promise<CommitDiff> {
  const filePath = `${docId}.json`;

  const [contentA, contentB] = await Promise.all([
    readFileAtCommit(commitA, filePath),
    readFileAtCommit(commitB, filePath),
  ]);

  const textA = contentA ?? '';
  const textB = contentB ?? '';

  const lines = computeLineDiff(textA, textB);
  const additions = lines.filter((l) => l.type === 'added').length;
  const deletions = lines.filter((l) => l.type === 'removed').length;

  return { additions, deletions, lines };
}
