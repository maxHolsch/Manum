import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

export interface AttributionStats {
  totalChars: number;
  redChars: number;
  yellowChars: number;
  greenChars: number;
  redPct: number;
  yellowPct: number;
  greenPct: number;
}

export function computeAttributionStats(editor: Editor | null): AttributionStats {
  const stats = { totalChars: 0, redChars: 0, yellowChars: 0, greenChars: 0 };

  if (editor) {
    editor.state.doc.descendants((node) => {
      if (!node.isText || !node.text) return;
      const len = node.text.length;
      const attrMark = node.marks.find((m) => m.type.name === 'attribution');
      if (!attrMark) {
        stats.totalChars += len;
        return;
      }
      const color = attrMark.attrs['color'] as string;
      stats.totalChars += len;
      if (color === 'red') stats.redChars += len;
      else if (color === 'yellow') stats.yellowChars += len;
      else stats.greenChars += len;
    });
  }

  const total = stats.totalChars || 1; // avoid div-by-zero
  return {
    ...stats,
    redPct: Math.round((stats.redChars / total) * 100),
    yellowPct: Math.round((stats.yellowChars / total) * 100),
    greenPct: Math.round((stats.greenChars / total) * 100),
  };
}

export function useAttributionOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);

  const toggleOverlay = useCallback(() => {
    setShowOverlay((prev) => !prev);
  }, []);

  return { showOverlay, toggleOverlay };
}
