import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { coreExtensions } from '../editor/schema';
import { AttributionMark } from '../editor/marks/attribution';
import { BranchMarkerNode } from '../editor/nodes/branch-marker';
import { MarkTransition } from '../editor/extensions/mark-transition';
import { Toolbar } from './Toolbar';
import { ConnectionStatus } from './ConnectionStatus';
import { AttributionOverlay } from './AttributionOverlay';
import { BranchDrawer } from './BranchDrawer';
import { DiffScrubber } from './DiffScrubber';
import { DiffView } from './DiffView';
import { Settings } from './Settings';
import { useAutoSave } from '../hooks/useAutoSave';
import { useExtensionSync } from '../hooks/useExtensionSync';
import { usePasteHandler } from '../hooks/usePasteHandler';
import { useEditTracker } from '../hooks/useEditTracker';
import { useAttributionOverlay } from '../hooks/useAttributionOverlay';
import { useAutoScoring } from '../hooks/useAutoScoring';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getCommitLog, type CommitLogEntry } from '../git/log';
import { readDocumentAtCommit } from '../git/history';
import { getCommitDiff } from '../git/diff';
import { createBranch } from '../git/branches';
import { emit } from '../analytics/event-bus';
import type { DocumentRecord } from '../storage/documents';
import type { AppMode } from './BottomNav';
import type { JSONContent } from '@tiptap/core';
import '../styles/drawer.css';
import '../styles/highlights.css';

interface ManumEditorProps {
  document: DocumentRecord;
  onBack: () => void;
  mode?: AppMode;
  onModeChange?: (mode: AppMode) => void;
}

export function ManumEditor({ document, onBack, mode, onModeChange }: ManumEditorProps) {
  const [saveStatus, setSaveStatus] = useState<string>('');
  const { connectionState } = useExtensionSync();
  const { scheduleAutoSave, saveStatus: autoSaveStatus, saveNow } = useAutoSave(document.id);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Historical view state
  const [commits, setCommits] = useState<CommitLogEntry[]>([]);
  const [currentCommitOid, setCurrentCommitOid] = useState<string | null>(null);
  const [historicalContent, setHistoricalContent] = useState<JSONContent | null>(null);
  const [diffLines, setDiffLines] = useState<
    { type: 'added' | 'removed' | 'unchanged'; content: string }[]
  >([]);
  const [scrubIndex, setScrubIndex] = useState(0);
  const [showDiff, setShowDiff] = useState(false);

  // Use a ref for editor instance to break the initialization cycle
  const editorInstanceRef = useRef<Editor | null>(null);
  const { handlePaste } = usePasteHandler(editorInstanceRef);

  const editor = useEditor({
    extensions: [...coreExtensions, AttributionMark, BranchMarkerNode, MarkTransition],
    content: document.content,
    editable: historicalContent === null,
    editorProps: {
      handlePaste,
    },
    onUpdate: ({ editor: e }) => {
      scheduleAutoSave(e);
      emit('edit');
    },
  });

  // Keep ref updated with the latest editor instance
  useEffect(() => {
    editorInstanceRef.current = editor;
  }, [editor]);

  useEditTracker(editor);
  useAutoScoring(editor);
  const { showOverlay, toggleOverlay } = useAttributionOverlay(editor);

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

  // Open branch drawer when mode = 'branch'
  useEffect(() => {
    if (mode === 'branch') {
      setDrawerOpen(true);
    }
  }, [mode]);

  // Load commit log for timeline / scrubber
  useEffect(() => {
    void getCommitLog(document.id).then((log) => {
      setCommits(log);
      if (log.length > 0) setCurrentCommitOid(log[0].oid);
    });
  }, [document.id]);

  const navigateToCommit = useCallback(
    async (oid: string) => {
      const content = await readDocumentAtCommit(oid, document.id);
      if (!content) return;
      setCurrentCommitOid(oid);
      setHistoricalContent(content);
      editor?.setEditable(false);

      // Load diff vs previous commit
      const idx = commits.findIndex((c) => c.oid === oid);
      if (idx >= 0 && idx < commits.length - 1) {
        const prev = commits[idx + 1];
        const diff = await getCommitDiff(document.id, prev.oid, oid);
        setDiffLines(diff.lines);
      } else {
        setDiffLines([]);
      }
    },
    [document.id, commits, editor],
  );

  const returnToLatest = useCallback(() => {
    setHistoricalContent(null);
    setCurrentCommitOid(commits[0]?.oid ?? null);
    setDiffLines([]);
    editor?.setEditable(true);
    if (document.content) {
      editor?.commands.setContent(document.content as JSONContent);
    }
  }, [commits, editor, document.content]);

  const handleScrubChange = useCallback(
    (index: number) => {
      setScrubIndex(index);
      const commit = commits[index];
      if (commit) void navigateToCommit(commit.oid);
    },
    [commits, navigateToCommit],
  );

  const handleCreateBranch = useCallback(async () => {
    await createBranch();
    emit('branch_create');
  }, []);

  useKeyboardShortcuts({
    toggleAttribution: toggleOverlay,
    createBranch: () => void handleCreateBranch(),
    toggleDrawer: () => setDrawerOpen((o) => !o),
    save: () => void saveNow(editor),
    switchMode: onModeChange,
  });

  return (
    <div
      className={`manum-app paper-texture manum-editor-layout${drawerOpen ? ' drawer-open' : ''}`}
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
          ← Back
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
        <button
          onClick={() => setShowDiff((s) => !s)}
          title="Toggle diff view"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-meta)',
            fontSize: '0.75rem',
            color: 'var(--color-gray)',
          }}
          aria-label="Toggle diff"
        >
          ⊕
        </button>
        <button
          onClick={() => setShowSettings((s) => !s)}
          title="Settings"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-meta)',
            fontSize: '1rem',
            color: 'var(--color-gray)',
          }}
          aria-label="Open settings"
          data-testid="settings-button"
        >
          ⚙
        </button>
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          title="Toggle drawer"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-meta)',
            fontSize: '0.85rem',
            color: 'var(--color-gray)',
          }}
          aria-label="Toggle branch drawer"
          data-testid="drawer-toggle"
        >
          ≡
        </button>
      </header>

      {/* Historical view banner */}
      {historicalContent && (
        <div className="manum-history-banner">
          <span>
            Viewing version from{' '}
            {commits.find((c) => c.oid === currentCommitOid)
              ? new Date(
                  commits.find((c) => c.oid === currentCommitOid)!.timestamp,
                ).toLocaleString()
              : 'history'}
          </span>
          <button onClick={returnToLatest} data-testid="return-to-latest">
            Return to latest
          </button>
        </div>
      )}

      <Toolbar editor={editor} />
      <AttributionOverlay editor={editor} showOverlay={showOverlay} onToggle={toggleOverlay} />

      {/* Diff view or editor */}
      {showDiff && diffLines.length > 0 ? (
        <DiffView lines={diffLines} />
      ) : (
        <div className={`manum-editor-wrapper${showOverlay ? ' show-attribution' : ''}`}>
          {historicalContent ? (
            // Read-only historical content display
            <div
              style={{
                padding: '1.5rem',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                lineHeight: 1.7,
                color: 'var(--color-ink)',
                opacity: 0.85,
              }}
              data-testid="historical-content"
            >
              <EditorContent editor={editor} />
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>
      )}

      {/* Diff scrubber */}
      {commits.length > 0 && (
        <DiffScrubber commits={commits} currentIndex={scrubIndex} onChange={handleScrubChange} />
      )}

      {/* Branch drawer (slides in from right) */}
      <BranchDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          if (mode === 'branch' && onModeChange) onModeChange('write');
        }}
        editor={editor}
        docId={document.id}
        currentCommitOid={currentCommitOid}
        onNavigateToCommit={(oid) => void navigateToCommit(oid)}
      />

      {/* Settings panel */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
