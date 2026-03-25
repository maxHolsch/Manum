import { useRef, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { updateDocument } from '../storage/documents';
import { commitDocument } from '../git/commit';
import { ensureRepoInitialized } from '../git/repo';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(documentId: string | null, debounceMs = 2000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const save = useCallback(
    async (editor: Editor) => {
      if (!documentId) return;
      setSaveStatus('saving');
      try {
        const content = editor.getJSON() as JSONContent;
        const title = extractTitle(content);
        await updateDocument(documentId, { content, title });

        // Also commit to git
        try {
          await ensureRepoInitialized();
          await commitDocument(documentId, content);
        } catch {
          // Git commit failure is non-fatal
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    },
    [documentId],
  );

  const scheduleAutoSave = useCallback(
    (editor: Editor) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        void save(editor);
      }, debounceMs);
    },
    [save, debounceMs],
  );

  return { scheduleAutoSave, saveStatus, saveNow: save };
}

function extractTitle(content: JSONContent): string {
  if (!content.content) return 'Untitled';
  for (const node of content.content) {
    if (node.content) {
      for (const inline of node.content) {
        if (inline.type === 'text' && inline.text?.trim()) {
          return inline.text.trim().slice(0, 80);
        }
      }
    }
  }
  return 'Untitled';
}
