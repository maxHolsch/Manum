/**
 * T132: Commit metadata computation
 */

import type { JSONContent } from '@tiptap/core';

export interface AttributionSnapshot {
  green: number;
  yellow: number;
  red: number;
}

export interface CommitMetadata {
  wordCount: number;
  wordCountDelta: number;
  attribution: AttributionSnapshot;
}

function countWords(content: JSONContent): number {
  let count = 0;

  function traverse(node: JSONContent): void {
    if (node.type === 'text' && node.text) {
      count += node.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if (node.content) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  }

  traverse(content);
  return count;
}

function computeAttributionSnapshot(content: JSONContent): AttributionSnapshot {
  let green = 0;
  let yellow = 0;
  let red = 0;
  let total = 0;

  function traverse(node: JSONContent): void {
    if (node.type === 'text' && node.text) {
      const len = node.text.length;
      total += len;

      const attrMark = node.marks?.find((m) => m.type === 'attribution');
      if (!attrMark) {
        green += len;
      } else {
        const color = attrMark.attrs?.['color'] as string | undefined;
        if (color === 'red') red += len;
        else if (color === 'yellow') yellow += len;
        else green += len;
      }
    }
    if (node.content) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  }

  traverse(content);

  if (total === 0) return { green: 100, yellow: 0, red: 0 };

  return {
    green: Math.round((green / total) * 100),
    yellow: Math.round((yellow / total) * 100),
    red: Math.round((red / total) * 100),
  };
}

export function buildCommitMessage(
  content: JSONContent,
  previousWordCount: number,
): { message: string; metadata: CommitMetadata } {
  const wordCount = countWords(content);
  const wordCountDelta = wordCount - previousWordCount;
  const attribution = computeAttributionSnapshot(content);

  const metadata: CommitMetadata = { wordCount, wordCountDelta, attribution };

  const timestamp = new Date().toISOString();
  const message = `Auto-save: ${timestamp}\n\n${JSON.stringify(metadata)}`;

  return { message, metadata };
}

export function parseCommitMetadata(commitMessage: string): CommitMetadata | null {
  const lines = commitMessage.split('\n');
  const jsonLine = lines.slice(2).join('\n').trim();
  if (!jsonLine) return null;

  try {
    return JSON.parse(jsonLine) as CommitMetadata;
  } catch {
    return null;
  }
}

export { countWords, computeAttributionSnapshot };
