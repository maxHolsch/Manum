import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { Editor } from '@tiptap/react';
import { matchPaste } from '../attribution/paste-attribution';

function generatePasteId(): string {
  return `paste_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function usePasteHandler(editorRef: RefObject<Editor | null>) {
  const handlePaste = useCallback(
    (view: import('@tiptap/pm/view').EditorView, event: ClipboardEvent): boolean => {
      const editor = editorRef.current;
      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (!text || !editor) return false;

      const { state } = view;
      const { from, to } = state.selection;

      // Insert plain text (replace selection)
      const tr = state.tr.insertText(text, from, to);
      view.dispatch(tr);

      const insertedFrom = from;
      const insertedTo = from + text.length;
      const pasteEventId = generatePasteId();

      // Async: match against copy records / AI pool, then apply RED mark
      matchPaste(text)
        .then((match) => {
          if (match.type === 'none') return;

          const confidence = match.type === 'copy-record' ? 1.0 : match.match.confidence;
          const { state: currentState } = editor.view;

          // Clamp range to current doc size
          const docSize = currentState.doc.content.size;
          const safeFrom = Math.min(insertedFrom, docSize - 1);
          const safeTo = Math.min(insertedTo, docSize);

          if (safeFrom >= safeTo) return;

          const markTr = currentState.tr.addMark(
            safeFrom,
            safeTo,
            currentState.schema.marks['attribution'].create({
              color: 'red',
              confidence,
              scoringMode: 'edit-distance',
              pasteEventId,
              originalPasteContent: text,
              editDistance: 0,
              createdAt: Date.now(),
            }),
          );
          editor.view.dispatch(markTr);
        })
        .catch(() => {
          // non-fatal
        });

      return true; // prevent default paste
    },
    [editorRef],
  );

  return { handlePaste };
}
