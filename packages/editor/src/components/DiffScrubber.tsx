/**
 * T165: Diff scrubbing slider
 */

import type { CommitLogEntry } from '../git/log';

interface DiffScrubberProps {
  commits: CommitLogEntry[];
  currentIndex: number;
  onChange: (index: number) => void;
}

export function DiffScrubber({ commits, currentIndex, onChange }: DiffScrubberProps) {
  if (commits.length === 0) return null;

  const current = commits[currentIndex];

  return (
    <div
      data-testid="diff-scrubber"
      style={{
        padding: '0.5rem 1rem',
        background: 'var(--color-paper, #F5F0E8)',
        borderTop: '1px solid var(--color-border, #D4C9A8)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <button
        onClick={() => onChange(Math.min(commits.length - 1, currentIndex + 1))}
        disabled={currentIndex >= commits.length - 1}
        style={{
          background: 'none',
          border: '1px solid var(--color-border, #D4C9A8)',
          borderRadius: '2px',
          cursor: 'pointer',
          padding: '0.2rem 0.5rem',
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
        }}
        aria-label="Older commit"
      >
        ‹
      </button>

      <input
        type="range"
        min={0}
        max={commits.length - 1}
        value={currentIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1 }}
        aria-label="Scrub through commits"
        data-testid="scrub-slider"
      />

      <button
        onClick={() => onChange(Math.max(0, currentIndex - 1))}
        disabled={currentIndex <= 0}
        style={{
          background: 'none',
          border: '1px solid var(--color-border, #D4C9A8)',
          borderRadius: '2px',
          cursor: 'pointer',
          padding: '0.2rem 0.5rem',
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
        }}
        aria-label="Newer commit"
      >
        ›
      </button>

      <span
        style={{
          fontFamily: 'var(--font-meta, Courier Prime)',
          fontSize: '0.7rem',
          color: 'var(--color-gray)',
          whiteSpace: 'nowrap',
        }}
      >
        {currentIndex + 1} / {commits.length}
        {current && ` · ${new Date(current.timestamp).toLocaleDateString()}`}
      </span>
    </div>
  );
}
