/**
 * T166: Diff view with green additions and red deletions
 */

import type { DiffLine } from '../git/diff';
import '../styles/highlights.css';

interface DiffViewProps {
  lines: DiffLine[];
}

export function DiffView({ lines }: DiffViewProps) {
  if (lines.length === 0) {
    return (
      <div
        style={{
          padding: '1rem',
          fontFamily: 'var(--font-meta)',
          color: 'var(--color-gray)',
          fontSize: '0.85rem',
        }}
      >
        No changes
      </div>
    );
  }

  return (
    <div
      data-testid="diff-view"
      style={{
        fontFamily: 'var(--font-body, Courier Prime)',
        fontSize: '0.9rem',
        lineHeight: 1.6,
        padding: '1rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {lines.map((line, idx) => {
        if (line.type === 'added') {
          return (
            <span key={idx} className="manum-diff-added" style={{ display: 'block' }}>
              {line.content}
            </span>
          );
        }
        if (line.type === 'removed') {
          return (
            <span key={idx} className="manum-diff-removed" style={{ display: 'block' }}>
              {line.content}
            </span>
          );
        }
        return (
          <span key={idx} style={{ display: 'block', color: 'var(--color-ink, #2C2C2C)' }}>
            {line.content}
          </span>
        );
      })}
    </div>
  );
}
