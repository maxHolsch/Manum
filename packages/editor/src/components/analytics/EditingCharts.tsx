/**
 * T171: Editing pattern charts and branch statistics
 */

import type { SessionSummary } from '../../storage/db';

interface EditingChartsProps {
  sessions: SessionSummary[];
}

export function EditingCharts({ sessions }: EditingChartsProps) {
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
        No session data yet.
      </div>
    );
  }

  const recent = sessions.slice(-7);
  const maxEdits = Math.max(...recent.map((s) => s.editCount), 1);
  const maxPastes = Math.max(...recent.map((s) => s.pasteCount), 1);

  return (
    <div data-testid="editing-charts">
      <p
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.75rem',
          color: 'var(--color-gray)',
          margin: '0 0 0.4rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Edits per session
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          height: '60px',
          marginBottom: '1rem',
        }}
      >
        {recent.map((session) => (
          <div
            key={session.id}
            title={`Edits: ${session.editCount}`}
            data-testid={`edit-bar-${session.id}`}
            style={{
              flex: 1,
              height: `${(session.editCount / maxEdits) * 100}%`,
              background: 'rgba(91, 130, 197, 0.7)',
              borderRadius: '2px 2px 0 0',
              minHeight: '2px',
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.75rem',
          color: 'var(--color-gray)',
          margin: '0 0 0.4rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Pastes per session
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px' }}>
        {recent.map((session) => (
          <div
            key={session.id}
            title={`Pastes: ${session.pasteCount}`}
            style={{
              flex: 1,
              height: `${(session.pasteCount / maxPastes) * 100}%`,
              background: 'rgba(176, 80, 80, 0.6)',
              borderRadius: '2px 2px 0 0',
              minHeight: '2px',
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface BranchStatsProps {
  sessions: SessionSummary[];
}

export function BranchStats({ sessions }: BranchStatsProps) {
  const totalBranches = sessions.reduce((sum, s) => sum + s.branchCreations, 0);
  const totalSessions = sessions.length;

  return (
    <div data-testid="branch-stats" style={{ display: 'flex', gap: '1rem' }}>
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          padding: '0.75rem',
          border: '1px solid var(--color-border)',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--color-accent)',
          }}
        >
          {totalBranches}
        </div>
        <div
          style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', color: 'var(--color-gray)' }}
        >
          Branches Created
        </div>
      </div>
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          padding: '0.75rem',
          border: '1px solid var(--color-border)',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--color-accent)',
          }}
        >
          {totalSessions > 0 ? (totalBranches / totalSessions).toFixed(1) : '0'}
        </div>
        <div
          style={{ fontFamily: 'var(--font-meta)', fontSize: '0.7rem', color: 'var(--color-gray)' }}
        >
          Avg per Session
        </div>
      </div>
    </div>
  );
}
