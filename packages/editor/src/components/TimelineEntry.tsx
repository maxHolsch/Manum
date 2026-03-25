/**
 * T160: Individual timeline entry
 */

import type { CommitLogEntry } from '../git/log';
import type { CommitMetadataRecord } from '../storage/db';

interface TimelineEntryProps {
  entry: CommitLogEntry;
  llmMetadata: CommitMetadataRecord | null;
  isActive: boolean;
  onClick: (oid: string) => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

export function TimelineEntry({ entry, llmMetadata, isActive, onClick }: TimelineEntryProps) {
  const title =
    llmMetadata?.title ??
    (entry.metadata
      ? entry.metadata.wordCountDelta >= 0
        ? `Added ${entry.metadata.wordCountDelta} words`
        : `Removed ${Math.abs(entry.metadata.wordCountDelta)} words`
      : entry.message.split('\n')[0]);
  const attr = entry.metadata?.attribution;

  return (
    <div
      className={`manum-timeline-card${isActive ? ' active' : ''}`}
      onClick={() => onClick(entry.oid)}
      data-testid={`timeline-entry-${entry.oid.slice(0, 8)}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick(entry.oid);
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.5rem',
          marginBottom: '0.25rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display, Special Elite)',
            fontSize: '0.85rem',
            color: isActive ? 'var(--color-accent, #4A5E8A)' : 'var(--color-ink, #2C2C2C)',
            fontWeight: isActive ? 600 : 400,
            flex: 1,
            lineHeight: 1.3,
          }}
        >
          {title}
        </span>
        {isActive && (
          <span
            style={{
              fontSize: '0.6rem',
              background: 'var(--color-accent, #4A5E8A)',
              color: '#fff',
              padding: '0.1rem 0.3rem',
              borderRadius: '2px',
              flexShrink: 0,
            }}
          >
            HEAD
          </span>
        )}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-meta, Courier Prime)',
          fontSize: '0.7rem',
          color: 'var(--color-gray, #8C8C7C)',
          marginBottom: attr ? '0.3rem' : 0,
        }}
      >
        {formatTimestamp(entry.timestamp)}
        {entry.branch && (
          <span style={{ marginLeft: '0.4rem', color: 'var(--color-accent, #4A5E8A)' }}>
            [{entry.branch}]
          </span>
        )}
      </div>

      {attr && (
        <div
          style={{
            display: 'flex',
            height: '4px',
            borderRadius: '2px',
            overflow: 'hidden',
            gap: '1px',
          }}
        >
          <div style={{ flex: attr.green, background: 'var(--color-green, #52A552)' }} />
          <div style={{ flex: attr.yellow, background: 'var(--color-yellow, #D4A030)' }} />
          <div style={{ flex: attr.red, background: 'var(--color-red, #B05050)' }} />
        </div>
      )}
    </div>
  );
}
