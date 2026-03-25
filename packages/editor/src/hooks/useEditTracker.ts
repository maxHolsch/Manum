import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { normalizedEditDistance } from '../attribution/levenshtein';
import { getColorFromDistance } from '../attribution/transitions';
import { isIdeaOverlapYellow } from '../attribution/yellow-scorer';
import type { AttributionColor } from '../editor/marks/attribution';

const DEBOUNCE_MS = 500;

interface SpanInfo {
  text: string;
  originalPasteContent: string;
  color: AttributionColor;
  scoringMode: string;
}

export function useEditTracker(editor: Editor | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;

    const rescoreSpans = () => {
      const { state } = editor;
      const spansByPasteId = new Map<string, SpanInfo>();

      state.doc.descendants((node) => {
        if (!node.isText) return;
        const attrMark = node.marks.find((m) => m.type.name === 'attribution');
        if (!attrMark) return;
        const attrs = attrMark.attrs as Record<string, unknown>;
        const pasteEventId = attrs['pasteEventId'] as string | null;
        const originalPasteContent = attrs['originalPasteContent'] as string | null;
        const color = attrs['color'] as AttributionColor;
        const scoringMode = attrs['scoringMode'] as string;

        if (!pasteEventId || !originalPasteContent) return;
        if (color !== 'red' && color !== 'yellow') return;

        const existing = spansByPasteId.get(pasteEventId);
        if (existing) {
          existing.text += node.text ?? '';
        } else {
          spansByPasteId.set(pasteEventId, {
            text: node.text ?? '',
            originalPasteContent,
            color,
            scoringMode,
          });
        }
      });

      if (spansByPasteId.size === 0) return;

      const tr = state.tr;
      let changed = false;

      state.doc.descendants((node, pos) => {
        if (!node.isText) return;
        const attrMark = node.marks.find((m) => m.type.name === 'attribution');
        if (!attrMark) return;
        const attrs = attrMark.attrs as Record<string, unknown>;
        const pasteEventId = attrs['pasteEventId'] as string | null;
        if (!pasteEventId) return;

        const span = spansByPasteId.get(pasteEventId);
        if (!span) return;

        const dist = normalizedEditDistance(span.originalPasteContent, span.text);
        let newColor = getColorFromDistance(dist);

        // YELLOW from idea overlap must NEVER transition to GREEN
        if (
          isIdeaOverlapYellow(attrMark.attrs as Record<string, unknown>) &&
          newColor === 'green'
        ) {
          newColor = 'yellow';
        }

        if (newColor !== span.color) {
          tr.addMark(
            pos,
            pos + node.nodeSize,
            state.schema.marks['attribution'].create({
              ...attrMark.attrs,
              color: newColor,
              editDistance: dist,
            }),
          );
          changed = true;
        }
      });

      if (changed) {
        editor.view.dispatch(tr);
      }
    };

    const handleTransaction = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(rescoreSpans, DEBOUNCE_MS);
    };

    editor.on('transaction', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [editor]);
}
