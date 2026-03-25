import type { Editor } from '@tiptap/react';
import { computeAttributionStats } from '../hooks/useAttributionOverlay';

interface AttributionOverlayProps {
  editor: Editor | null;
  showOverlay: boolean;
  onToggle: () => void;
}

export function AttributionOverlay({ editor, showOverlay, onToggle }: AttributionOverlayProps) {
  const stats = computeAttributionStats(editor);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.4rem 1rem',
        background: 'var(--color-paper)',
        borderBottom: '1px solid var(--color-border)',
        fontFamily: 'var(--font-meta)',
        fontSize: '0.8rem',
      }}
    >
      <button
        onClick={onToggle}
        aria-pressed={showOverlay}
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          background: showOverlay ? 'var(--color-accent)' : 'none',
          color: showOverlay ? '#fff' : 'var(--color-ink)',
          border: '1px solid var(--color-border)',
          borderRadius: '3px',
          padding: '0.2rem 0.6rem',
          cursor: 'pointer',
        }}
      >
        {showOverlay ? 'Hide Attribution' : 'Show Attribution'}
      </button>

      {showOverlay && (
        <div
          style={{ display: 'flex', gap: '1rem', color: 'var(--color-gray)' }}
          aria-label="attribution summary"
        >
          <span style={{ color: '#c0392b' }}>RED {stats.redPct}%</span>
          <span style={{ color: '#d4ac0d' }}>YELLOW {stats.yellowPct}%</span>
          <span style={{ color: '#27ae60' }}>GREEN {stats.greenPct}%</span>
          <span>({stats.totalChars} chars)</span>
        </div>
      )}
    </div>
  );
}
