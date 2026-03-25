/**
 * T140: Merge conflict resolution UI
 */

import { useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import type { MergeConflict } from '../git/merge';
import { resolveConflicts } from '../git/merge';

interface MergeConflictUIProps {
  docId: string;
  mergedContent: JSONContent;
  conflicts: MergeConflict[];
  incomingBranch: string;
  onResolved: (finalContent: JSONContent, commitOid: string) => void;
  onCancel: () => void;
}

function paragraphToText(para: JSONContent): string {
  const parts: string[] = [];
  function traverse(node: JSONContent): void {
    if (node.type === 'text' && node.text) parts.push(node.text);
    if (node.content) for (const child of node.content) traverse(child);
  }
  traverse(para);
  return parts.join('');
}

export function MergeConflictUI({
  docId,
  mergedContent,
  conflicts,
  incomingBranch,
  onResolved,
  onCancel,
}: MergeConflictUIProps) {
  const [resolutions, setResolutions] = useState<Map<number, 'current' | 'incoming'>>(
    new Map(conflicts.map((c) => [c.paragraphIndex, 'current'])),
  );
  const [loading, setLoading] = useState(false);

  const handleSetResolution = (paragraphIndex: number, choice: 'current' | 'incoming') => {
    setResolutions((prev) => new Map(prev).set(paragraphIndex, choice));
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      const commitOid = await resolveConflicts(
        docId,
        mergedContent,
        resolutions,
        conflicts,
        incomingBranch,
      );

      // Build final content with resolutions applied
      const paragraphs = [...(mergedContent.content ?? [])];
      for (const conflict of conflicts) {
        const resolution = resolutions.get(conflict.paragraphIndex) ?? 'current';
        paragraphs[conflict.paragraphIndex] =
          resolution === 'incoming' ? conflict.incomingContent : conflict.currentContent;
      }
      const finalContent: JSONContent = { type: 'doc', content: paragraphs };

      onResolved(finalContent, commitOid);
    } catch (e) {
      console.error('Failed to resolve conflicts:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="merge-conflict-ui"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--color-paper, #F5F0E8)',
          border: '1px solid var(--color-border, #D4C9A8)',
          borderRadius: '2px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 4px 16px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-border, #D4C9A8)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-display, Special Elite)',
              margin: 0,
              color: 'var(--color-ink, #2C2C2C)',
            }}
          >
            Merge Conflicts
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.8rem',
              color: 'var(--color-gray, #8C8C7C)',
              margin: '0.25rem 0 0',
            }}
          >
            Merging from <strong>{incomingBranch}</strong> — {conflicts.length} conflict
            {conflicts.length !== 1 ? 's' : ''} detected
          </p>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          {conflicts.map((conflict) => (
            <ConflictCard
              key={conflict.paragraphIndex}
              conflict={conflict}
              resolution={resolutions.get(conflict.paragraphIndex) ?? 'current'}
              onSetResolution={(choice) => handleSetResolution(conflict.paragraphIndex, choice)}
            />
          ))}
        </div>

        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--color-border, #D4C9A8)',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.4rem 0.8rem',
              background: 'transparent',
              border: '1px solid var(--color-border, #D4C9A8)',
              borderRadius: '2px',
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              color: 'var(--color-ink, #2C2C2C)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleResolve()}
            disabled={loading}
            data-testid="resolve-conflicts-button"
            style={{
              padding: '0.4rem 0.8rem',
              background: 'var(--color-accent, #4A5E8A)',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.85rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Resolving…' : 'Resolve Conflicts'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConflictCardProps {
  conflict: MergeConflict;
  resolution: 'current' | 'incoming';
  onSetResolution: (choice: 'current' | 'incoming') => void;
}

function ConflictCard({ conflict, resolution, onSetResolution }: ConflictCardProps) {
  const currentText = paragraphToText(conflict.currentContent);
  const incomingText = paragraphToText(conflict.incomingContent);

  return (
    <div
      data-testid={`conflict-card-${conflict.paragraphIndex}`}
      style={{
        marginBottom: '1rem',
        border: '1px solid var(--color-border, #D4C9A8)',
        borderRadius: '2px',
      }}
    >
      <div
        style={{
          padding: '0.4rem 0.75rem',
          background: 'rgba(0,0,0,0.04)',
          borderBottom: '1px solid var(--color-border, #D4C9A8)',
          fontFamily: 'var(--font-meta, Courier Prime)',
          fontSize: '0.75rem',
          color: 'var(--color-gray, #8C8C7C)',
        }}
      >
        Conflict in paragraph {conflict.paragraphIndex + 1}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        {/* Current version */}
        <div
          style={{
            padding: '0.75rem',
            borderRight: '1px solid var(--color-border, #D4C9A8)',
            background: resolution === 'current' ? 'rgba(74, 94, 138, 0.08)' : 'transparent',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.7rem',
              color: 'var(--color-gray, #8C8C7C)',
              marginBottom: '0.4rem',
            }}
          >
            CURRENT
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body, Courier Prime)',
              fontSize: '0.85rem',
              color: 'var(--color-ink, #2C2C2C)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {currentText || <em>(empty)</em>}
          </p>
          <button
            onClick={() => onSetResolution('current')}
            data-testid={`accept-current-${conflict.paragraphIndex}`}
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              background: resolution === 'current' ? 'var(--color-accent, #4A5E8A)' : 'transparent',
              color: resolution === 'current' ? '#fff' : 'var(--color-accent, #4A5E8A)',
              border: '1px solid var(--color-accent, #4A5E8A)',
              borderRadius: '2px',
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Accept Current
          </button>
        </div>

        {/* Incoming version */}
        <div
          style={{
            padding: '0.75rem',
            background: resolution === 'incoming' ? 'rgba(218, 140, 40, 0.08)' : 'transparent',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.7rem',
              color: 'var(--color-gray, #8C8C7C)',
              marginBottom: '0.4rem',
            }}
          >
            INCOMING
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body, Courier Prime)',
              fontSize: '0.85rem',
              color: 'var(--color-ink, #2C2C2C)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {incomingText || <em>(empty)</em>}
          </p>
          <button
            onClick={() => onSetResolution('incoming')}
            data-testid={`accept-incoming-${conflict.paragraphIndex}`}
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              background: resolution === 'incoming' ? '#DA8C28' : 'transparent',
              color: resolution === 'incoming' ? '#fff' : '#DA8C28',
              border: '1px solid #DA8C28',
              borderRadius: '2px',
              fontFamily: 'var(--font-meta, Courier Prime)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Accept Incoming
          </button>
        </div>
      </div>
    </div>
  );
}
