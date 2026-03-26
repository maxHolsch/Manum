/**
 * MarkTransition extension
 *
 * Degrades attribution marks when the user edits within them:
 *   - RED text edited >50% → transitions to YELLOW (idea overlap)
 *   - RED text edited >80% → transitions to GREEN (human-written)
 *   - YELLOW text edited >80% → transitions to GREEN
 *
 * "Edited" is measured by comparing the current text length against the
 * original paste content length, plus tracking character-level changes
 * via the editRatio stored on the mark.
 *
 * This works at the transaction level: when a docChanged transaction
 * touches a range that has a red/yellow mark with originalPasteContent,
 * we recompute the edit ratio and potentially re-mark.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const markTransitionKey = new PluginKey('markTransition');

/** Threshold: fraction of original content changed before transition */
const RED_TO_YELLOW_THRESHOLD = 0.5;
const TO_GREEN_THRESHOLD = 0.8;

export const MarkTransition = Extension.create({
  name: 'markTransition',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: markTransitionKey,

        appendTransaction(transactions, _oldState, newState) {
          // Skip our own transactions
          if (transactions.some((tr) => tr.getMeta(markTransitionKey))) return null;
          // Only act on user edits
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const attributionType = newState.schema.marks['attribution'];
          if (!attributionType) return null;

          // Collect changed ranges from all transactions
          const changedRanges: Array<{ from: number; to: number }> = [];
          for (const tr of transactions) {
            if (!tr.docChanged) continue;
            tr.steps.forEach((_step, i) => {
              const map = tr.mapping.maps[i];
              map.forEach((oldStart, oldEnd) => {
                const newStart = tr.mapping.slice(i).map(oldStart, -1);
                const newEnd = tr.mapping.slice(i).map(oldEnd, 1);
                changedRanges.push({ from: newStart, to: newEnd });
              });
            });
          }

          if (changedRanges.length === 0) return null;

          let markTr = newState.tr;
          let changed = false;

          // Check each text node that overlaps with changed ranges
          newState.doc.descendants((node, pos) => {
            if (!node.isText || !node.text) return;
            const nodeEnd = pos + node.nodeSize;

            // Does this node overlap any changed range?
            const overlaps = changedRanges.some((r) => r.from < nodeEnd && r.to > pos);
            if (!overlaps) return;

            const attrMark = node.marks.find((m) => m.type.name === 'attribution');
            if (!attrMark) return;

            const attrs = attrMark.attrs as Record<string, unknown>;
            const color = attrs['color'] as string;
            const originalPaste = attrs['originalPasteContent'] as string | null;

            // Only transition marks that came from paste (have originalPasteContent)
            if (!originalPaste) return;
            if (color !== 'red' && color !== 'yellow') return;

            // Compute edit ratio: how different is current text from original?
            const currentText = node.text;
            const editRatio = computeEditRatio(originalPaste, currentText);

            let newColor = color;
            if (color === 'red') {
              if (editRatio >= TO_GREEN_THRESHOLD) {
                newColor = 'green';
              } else if (editRatio >= RED_TO_YELLOW_THRESHOLD) {
                newColor = 'yellow';
              }
            } else if (color === 'yellow') {
              if (editRatio >= TO_GREEN_THRESHOLD) {
                newColor = 'green';
              }
            }

            if (newColor !== color) {
              const newAttrs: Record<string, unknown> = { ...attrs, color: newColor };
              if (newColor === 'green') {
                // Clear paste metadata on full transition to green
                newAttrs['originalPasteContent'] = null;
                newAttrs['pasteEventId'] = null;
                newAttrs['matchedAiEntries'] = null;
                newAttrs['ideaOverlapScore'] = null;
              }
              if (newColor === 'yellow' && color === 'red') {
                // Transitioning red→yellow: set idea overlap score from edit distance
                newAttrs['ideaOverlapScore'] = 1.0 - editRatio;
              }
              markTr = markTr.addMark(pos, nodeEnd, attributionType.create(newAttrs));
              changed = true;
            }
          });

          if (!changed) return null;
          return markTr.setMeta(markTransitionKey, true).setMeta('addToHistory', false);
        },
      }),
    ];
  },
});

/**
 * Compute how much the text has changed from its original.
 * Returns 0.0 (identical) to 1.0 (completely different).
 * Uses a fast token-level diff rather than char-level Levenshtein
 * to keep this responsive on every transaction.
 */
function computeEditRatio(original: string, current: string): number {
  if (original === current) return 0;
  if (!original || !current) return 1;

  const origTokens = original.toLowerCase().split(/\s+/).filter(Boolean);
  const currTokens = current.toLowerCase().split(/\s+/).filter(Boolean);

  if (origTokens.length === 0) return currTokens.length > 0 ? 1 : 0;

  // Count how many original tokens are missing from current text
  const currSet = new Set(currTokens);
  let retained = 0;
  for (const token of origTokens) {
    if (currSet.has(token)) retained++;
  }

  // Also factor in length change
  const lengthRatio = Math.abs(original.length - current.length) / Math.max(original.length, 1);
  const tokenChangeRatio = 1 - retained / origTokens.length;

  // Blend both signals
  return Math.min(1, tokenChangeRatio * 0.7 + lengthRatio * 0.3);
}
