import { useState, useCallback, useEffect } from 'react';
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
      stats.totalChars += len;
      if (!attrMark) {
        // No mark = user typed it = green
        stats.greenChars += len;
        return;
      }
      const color = attrMark.attrs['color'] as string;
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

/**
 * Hook that provides overlay toggle state AND a transaction counter
 * that increments on every editor update, forcing stat recomputation.
 */
export function useAttributionOverlay(editor?: Editor | null) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [, setTxCount] = useState(0);

  const toggleOverlay = useCallback(() => {
    setShowOverlay((prev) => !prev);
  }, []);

  // Subscribe to editor transactions to trigger re-renders for live stats
  useEffect(() => {
    if (!editor) return;
    const handler = () => setTxCount((c) => c + 1);
    editor.on('transaction', handler);
    return () => {
      editor.off('transaction', handler);
    };
  }, [editor]);

  return { showOverlay, toggleOverlay };
}
