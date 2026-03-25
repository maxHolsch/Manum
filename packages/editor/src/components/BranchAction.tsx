/**
 * T136: Floating "Branch this section" button that appears on paragraph selection
 */

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { createSectionBranch } from '../git/section-branch';

interface BranchActionProps {
  editor: Editor | null;
  docId: string;
  onBranchCreated?: (branchName: string, paragraphIndex: number) => void;
}

interface ActionPosition {
  top: number;
  left: number;
}

function getSelectedParagraphIndex(editor: Editor): number | null {
  const { selection, doc } = editor.state;
  const { $from, $to } = selection;

  // Check if selection covers a complete (or partial) paragraph
  const fromNode = $from.parent;
  if (fromNode.type.name !== 'paragraph' && fromNode.type.name !== 'heading') {
    return null;
  }

  // Find the paragraph index in the document
  let paraIndex = 0;
  let found = false;

  doc.forEach((node, offset) => {
    if (found) return;
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      if (offset <= $from.pos && offset + node.nodeSize >= $to.pos) {
        found = true;
        return;
      }
      paraIndex++;
    }
  });

  return found ? paraIndex : null;
}

export function BranchAction({ editor, docId, onBranchCreated }: BranchActionProps) {
  const [position, setPosition] = useState<ActionPosition | null>(null);
  const [paragraphIndex, setParagraphIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { selection } = editor.state;
      const isEmpty = selection.empty;

      if (isEmpty) {
        setPosition(null);
        setParagraphIndex(null);
        return;
      }

      const idx = getSelectedParagraphIndex(editor);
      if (idx === null) {
        setPosition(null);
        setParagraphIndex(null);
        return;
      }

      // Get DOM position for the floating button
      const coords = editor.view.coordsAtPos(selection.$to.pos);
      setPosition({ top: coords.bottom + 8, left: coords.left });
      setParagraphIndex(idx);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  const handleBranchSection = async () => {
    if (paragraphIndex === null) return;
    setLoading(true);
    try {
      const metadata = await createSectionBranch(docId, paragraphIndex);
      onBranchCreated?.(metadata.branchName, paragraphIndex);
      setPosition(null);
    } catch (e) {
      console.error('Failed to create section branch:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!position || paragraphIndex === null) return null;

  return (
    <button
      onClick={() => void handleBranchSection()}
      disabled={loading}
      data-testid="branch-section-button"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 600,
        padding: '0.3rem 0.6rem',
        background: 'var(--color-paper, #F5F0E8)',
        border: '1px solid var(--color-accent, #4A5E8A)',
        borderRadius: '2px',
        fontFamily: 'var(--font-meta, Courier Prime)',
        fontSize: '0.75rem',
        color: 'var(--color-accent, #4A5E8A)',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '1px 1px 4px rgba(0,0,0,0.15)',
        opacity: loading ? 0.7 : 1,
      }}
    >
      ⎇ Branch this section
    </button>
  );
}
