/**
 * T126: Automatic YELLOW Scoring on Sync
 *
 * Triggers YELLOW scoring when new AI pool entries are synced and on
 * document load. Debounced to batch multiple sync events.
 */

import type { Editor } from '@tiptap/core';
import type { AIPoolEntry } from '@manum/shared';
import { getDB } from '../storage/db';
import { queryAIPoolBeforeTimestamp } from './temporal-gate';
import { segmentText } from './segmenter';
import { computeOverlapScore } from './yellow-scorer';

const AUTO_SCORE_DEBOUNCE_MS = 5000;

export type ScoringMode = 'edit-distance' | 'llm-judge';

export interface AutoScorerOptions {
  getScoringMode?: () => ScoringMode;
}

/**
 * Score all document text chunks against the AI pool.
 * Applies YELLOW marks to chunks that exceed the overlap threshold.
 */
export async function scoreDocument(editor: Editor): Promise<void> {
  const { state } = editor;
  const attributionType = state.schema.marks['attribution'];
  if (!attributionType) return;

  const tr = state.tr;
  let changed = false;

  // Collect all text nodes with their positions and attribution info
  const textSpans: Array<{
    pos: number;
    endPos: number;
    text: string;
    createdAt: number;
    attrs: Record<string, unknown>;
  }> = [];

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const attrMark = node.marks.find((m) => m.type.name === 'attribution');
    if (!attrMark) return;

    const attrs = attrMark.attrs as Record<string, unknown>;
    const color = attrs['color'] as string;
    const ideaOverlapScore = attrs['ideaOverlapScore'];
    const createdAt = attrs['createdAt'] as number | null;

    // Only score green text (don't re-score already attributed text from paste)
    // Also re-score if it already has an ideaOverlapScore (re-run on new pool entries)
    if ((color === 'green' || ideaOverlapScore !== null) && createdAt !== null) {
      textSpans.push({
        pos,
        endPos: pos + node.nodeSize,
        text: node.text,
        createdAt,
        attrs,
      });
    }
  });

  if (textSpans.length === 0) return;

  // Group spans into chunks by paragraph, segment and score
  for (const span of textSpans) {
    const chunks = segmentText(span.text);
    const sentenceOrFull =
      chunks.length > 0
        ? chunks
        : [{ text: span.text, startOffset: 0, endOffset: span.text.length }];

    for (const chunk of sentenceOrFull) {
      if (!chunk.text.trim() || chunk.text.split(/\s+/).length < 3) continue;

      // Get temporally-gated AI entries
      const aiEntries = await queryAIPoolBeforeTimestamp(span.createdAt);
      if (aiEntries.length === 0) continue;

      const result = computeOverlapScore(chunk.text, aiEntries);

      if (result.isYellow && result.matchedEntry) {
        const matchedEntry = result.matchedEntry as AIPoolEntry;
        tr.addMark(
          span.pos,
          span.endPos,
          attributionType.create({
            ...span.attrs,
            color: 'yellow',
            ideaOverlapScore: result.combinedScore,
            matchedAiEntries: [
              {
                aiMessageId: matchedEntry.messageId,
                overlapScore: result.combinedScore,
                method: 'edit-distance',
                aiTimestamp: matchedEntry.timestamp,
              },
            ],
          }),
        );
        changed = true;
      }
    }
  }

  if (changed) {
    editor.view.dispatch(tr);
  }
}

/**
 * Create an auto-scorer that listens for new AI pool entries (via
 * a callback) and re-scores the document with debouncing.
 */
export function createAutoScorer(
  editor: Editor,
  _options?: AutoScorerOptions,
): {
  onNewAIPoolEntries: () => void;
  scoreNow: () => Promise<void>;
  destroy: () => void;
} {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const scoreNow = async (): Promise<void> => {
    await scoreDocument(editor);
  };

  const onNewAIPoolEntries = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void scoreNow();
    }, AUTO_SCORE_DEBOUNCE_MS);
  };

  const destroy = (): void => {
    if (debounceTimer) clearTimeout(debounceTimer);
  };

  return { onNewAIPoolEntries, scoreNow, destroy };
}

/**
 * Get all AI pool entries (for initial scoring on document open).
 */
export async function getAllAIPoolEntries(): Promise<AIPoolEntry[]> {
  const db = await getDB();
  return db.getAll('ai_pool');
}
