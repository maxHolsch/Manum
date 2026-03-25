import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { coreExtensions } from '../editor/schema';
import { AttributionMark } from '../editor/marks/attribution';
import { BranchMarkerNode } from '../editor/nodes/branch-marker';
import { Toolbar } from './Toolbar';
import { ConnectionStatus } from './ConnectionStatus';
import { useAutoSave } from '../hooks/useAutoSave';
import { useExtensionSync } from '../hooks/useExtensionSync';
import type { DocumentRecord } from '../storage/documents';

interface ManumEditorProps {
  document: DocumentRecord;
  onBack: () => void;
}

export function ManumEditor({ document, onBack }: ManumEditorProps) {
  const [saveStatus, setSaveStatus] = useState<string>('');
  const { connectionState } = useExtensionSync();
  const { scheduleAutoSave, saveStatus: autoSaveStatus } = useAutoSave(document.id);

  const editor = useEditor({
    extensions: [...coreExtensions, AttributionMark, BranchMarkerNode],
    content: document.content,
    onUpdate: ({ editor: e }) => {
      scheduleAutoSave(e);
    },
  });

  useEffect(() => {
    if (autoSaveStatus === 'saved') {
      setSaveStatus('Saved');
      const t = setTimeout(() => setSaveStatus(''), 2000);
      return () => clearTimeout(t);
    } else if (autoSaveStatus === 'saving') {
      setSaveStatus('Saving\u2026');
    }
    return undefined;
  }, [autoSaveStatus]);

  return (
    <div
      className="manum-app paper-texture"
      style={{ minHeight: '100vh', backgroundColor: 'var(--color-parchment)' }}
    >
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-paper)',
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem 1rem',
          gap: '1rem',
        }}
      >
        <button
          onClick={onBack}
          style={{
            fontFamily: 'var(--font-meta)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-accent)',
          }}
        >
          \u2190 Back
        </button>
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-body)',
            color: 'var(--color-ink)',
            fontWeight: 600,
          }}
        >
          {document.title}
        </span>
        {saveStatus && (
          <span
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.8rem',
              color: 'var(--color-gray)',
            }}
          >
            {saveStatus}
          </span>
        )}
        <ConnectionStatus state={connectionState} />
      </header>

      <Toolbar editor={editor} />

      <div className="manum-editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
