import type { Editor } from '@tiptap/core';

/**
 * T120: Timestamp Tracker
 *
 * Applies a `createdAt` timestamp to newly inserted text that doesn't
 * already have an attribution mark. The timestamp is set once and never
 * updated — it represents the first-write time of that span.
 */

const DEBOUNCE_MS = 300;

export function applyTimestamps(editor: Editor): void {
  const { state } = editor;
  const attributionType = state.schema.marks['attribution'];
  if (!attributionType) return;

  const tr = state.tr;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const hasAttribution = node.marks.some((m) => m.type.name === 'attribution');
    const hasCreatedAt = node.marks.some(
      (m) => m.type.name === 'attribution' && m.attrs['createdAt'] !== null,
    );

    if (!hasAttribution) {
      // New text without any attribution mark — apply green with createdAt
      tr.addMark(
        pos,
        pos + node.nodeSize,
        attributionType.create({
          color: 'green',
          createdAt: Date.now(),
        }),
      );
      changed = true;
    } else if (!hasCreatedAt) {
      // Has an attribution mark but no createdAt — backfill the timestamp
      const attrMark = node.marks.find((m) => m.type.name === 'attribution')!;
      tr.addMark(
        pos,
        pos + node.nodeSize,
        attributionType.create({
          ...attrMark.attrs,
          createdAt: Date.now(),
        }),
      );
      changed = true;
    }
  });

  if (changed) {
    editor.view.dispatch(tr);
  }
}

export function createTimestampTracker(editor: Editor): () => void {
  let timerRef: ReturnType<typeof setTimeout> | null = null;

  const handleTransaction = () => {
    if (timerRef) clearTimeout(timerRef);
    timerRef = setTimeout(() => {
      applyTimestamps(editor);
    }, DEBOUNCE_MS);
  };

  editor.on('transaction', handleTransaction);

  return () => {
    editor.off('transaction', handleTransaction);
    if (timerRef) clearTimeout(timerRef);
  };
}
