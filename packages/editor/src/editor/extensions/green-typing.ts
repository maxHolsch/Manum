/**
 * GreenTypingMark extension
 *
 * Automatically applies `color: 'green'` attribution marks to any text node
 * that has no existing attribution. This means text typed by the user shows
 * green in the attribution overlay.
 *
 * The paste handler (usePasteHandler) overwrites these with red marks after
 * matching against the AI pool, so the flow is:
 *   type text → green    (human-written)
 *   paste AI text → green briefly → red once match resolves
 *   paste unmatched text → stays green (treated as human-written)
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const greenTypingKey = new PluginKey('greenTyping');

export const GreenTypingMark = Extension.create({
  name: 'greenTypingMark',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: greenTypingKey,

        appendTransaction(transactions, _oldState, newState) {
          // Guard: skip our own green-marking transactions to avoid loops
          if (transactions.some((tr) => tr.getMeta(greenTypingKey))) return null;

          // Only act when the document actually changed
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const attributionType = newState.schema.marks['attribution'];
          if (!attributionType) return null;

          let markTr = newState.tr;
          let changed = false;

          newState.doc.descendants((node, pos) => {
            if (!node.isText || !node.text) return;
            const hasAttribution = node.marks.some((m) => m.type.name === 'attribution');
            if (!hasAttribution) {
              markTr = markTr.addMark(
                pos,
                pos + node.nodeSize,
                attributionType.create({
                  color: 'green',
                  confidence: 1.0,
                  scoringMode: 'edit-distance',
                  pasteEventId: null,
                  originalPasteContent: null,
                  editDistance: null,
                  // null so adjacent green nodes share identical mark attrs and merge
                  createdAt: null,
                  matchedAiEntries: null,
                  ideaOverlapScore: null,
                }),
              );
              changed = true;
            }
          });

          if (!changed) return null;

          // addToHistory: false — don't pollute undo stack with mark bookkeeping
          return markTr.setMeta(greenTypingKey, true).setMeta('addToHistory', false);
        },
      }),
    ];
  },
});
