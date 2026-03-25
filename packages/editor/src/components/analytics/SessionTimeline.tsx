/**
 * T170: Session timeline chart showing writing/AI/idle periods
 */

import type { SessionSummary } from '../../storage/db';

interface SessionTimelineProps {
  sessions: SessionSummary[];
}

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function SessionTimeline({ sessions }: SessionTimelineProps) {
  if (sessions.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
          padding: '0.5rem 0',
        }}
      >
        No sessions recorded yet.
      </div>
    );
  }

  return (
    <div data-testid="session-timeline">
      {sessions.slice(-10).map((session) => {
        const totalMs = session.endTime - session.startTime;
        const activeMs = Math.min(session.activeTime, totalMs);
        const aiMs = session.tabSwitches * 60_000; // estimate: 1 min per tab switch
        const idleMs = Math.max(0, totalMs - activeMs - aiMs);

        const activeRatio = totalMs > 0 ? activeMs / totalMs : 0;
        const aiRatio = totalMs > 0 ? Math.min(aiMs / totalMs, 1 - activeRatio) : 0;
        const idleRatio = 1 - activeRatio - aiRatio;

        return (
          <div
            key={session.id}
            style={{ marginBottom: '0.75rem' }}
            data-testid={`session-${session.id}`}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-meta)',
                  fontSize: '0.72rem',
                  color: 'var(--color-gray)',
                }}
              >
                {new Date(session.startTime).toLocaleDateString()}{' '}
                {new Date(session.startTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-meta)',
                  fontSize: '0.72rem',
                  color: 'var(--color-gray)',
                }}
              >
                {formatDuration(totalMs)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                height: '12px',
                borderRadius: '2px',
                overflow: 'hidden',
                gap: '1px',
                background: 'var(--color-border)',
              }}
            >
              {activeRatio > 0 && (
                <div
                  style={{ flex: activeRatio, background: '#5B82C5', opacity: 0.8 }}
                  title={`Writing: ${formatDuration(activeMs)}`}
                />
              )}
              {aiRatio > 0 && (
                <div
                  style={{ flex: aiRatio, background: '#D4884A', opacity: 0.8 }}
                  title={`AI consultation: ${formatDuration(aiMs)}`}
                />
              )}
              {idleRatio > 0 && (
                <div
                  style={{ flex: idleRatio, background: '#C0BAA8', opacity: 0.6 }}
                  title={`Idle: ${formatDuration(idleMs)}`}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
              <span
                style={{ fontFamily: 'var(--font-meta)', fontSize: '0.65rem', color: '#5B82C5' }}
              >
                ■ Writing
              </span>
              <span
                style={{ fontFamily: 'var(--font-meta)', fontSize: '0.65rem', color: '#D4884A' }}
              >
                ■ AI
              </span>
              <span
                style={{ fontFamily: 'var(--font-meta)', fontSize: '0.65rem', color: '#C0BAA8' }}
              >
                ■ Idle
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
