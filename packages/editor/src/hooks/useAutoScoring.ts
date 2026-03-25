/**
 * T126: React hook for YELLOW scoring lifecycle
 */

import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { createAutoScorer, scoreDocument } from '../attribution/auto-scorer';

export function useAutoScoring(editor: Editor | null): void {
  const scorerRef = useRef<ReturnType<typeof createAutoScorer> | null>(null);

  useEffect(() => {
    if (!editor) return;

    const scorer = createAutoScorer(editor);
    scorerRef.current = scorer;

    // Score on initial load
    void scoreDocument(editor);

    return () => {
      scorer.destroy();
      scorerRef.current = null;
    };
  }, [editor]);
}
