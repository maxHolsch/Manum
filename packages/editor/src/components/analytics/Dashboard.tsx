/**
 * T169-T173: Analytics dashboard container
 */

import { useEffect, useState } from 'react';
import { AttributionBar } from './AttributionBar';
import { SessionTimeline } from './SessionTimeline';
import { EditingCharts, BranchStats } from './EditingCharts';
import { ProjectComparison } from './ProjectComparison';
import { TrendChart } from './TrendChart';
import { getAllSessions } from '../../analytics/session';
import type { SessionSummary } from '../../storage/db';

interface DashboardProps {
  currentAttribution?: { green: number; yellow: number; red: number };
  docId?: string;
}

type DashTab = 'overview' | 'sessions' | 'projects' | 'trends';

export function Dashboard({ currentAttribution }: DashboardProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeTab, setActiveTab] = useState<DashTab>('overview');

  useEffect(() => {
    void getAllSessions().then(setSessions);
  }, []);

  // Build trend data from sessions (group by day)
  const trendData = (() => {
    const byDay = new Map<string, { green: number[]; yellow: number[]; red: number[] }>();
    // Use current attribution as one data point if available
    if (currentAttribution) {
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay.set(today, {
        green: [currentAttribution.green],
        yellow: [currentAttribution.yellow],
        red: [currentAttribution.red],
      });
    }
    return Array.from(byDay.entries()).map(([date, vals]) => ({
      date,
      green: Math.round(vals.green.reduce((a, b) => a + b, 0) / vals.green.length),
      yellow: Math.round(vals.yellow.reduce((a, b) => a + b, 0) / vals.yellow.length),
      red: Math.round(vals.red.reduce((a, b) => a + b, 0) / vals.red.length),
    }));
  })();

  const tabs: { id: DashTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'projects', label: 'Projects' },
    { id: 'trends', label: 'Trends' },
  ];

  return (
    <div data-testid="analytics-dashboard" style={{ padding: '1rem' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '0.5rem',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-meta)',
              fontSize: '0.8rem',
              color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-gray)',
              borderBottom:
                activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              padding: '0.2rem 0.5rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {currentAttribution && (
            <section>
              <h4
                style={{
                  fontFamily: 'var(--font-meta)',
                  fontSize: '0.75rem',
                  color: 'var(--color-gray)',
                  margin: '0 0 0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Attribution Breakdown
              </h4>
              <AttributionBar
                green={currentAttribution.green}
                yellow={currentAttribution.yellow}
                red={currentAttribution.red}
              />
            </section>
          )}
          <section>
            <h4
              style={{
                fontFamily: 'var(--font-meta)',
                fontSize: '0.75rem',
                color: 'var(--color-gray)',
                margin: '0 0 0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Branch Activity
            </h4>
            <BranchStats sessions={sessions} />
          </section>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section>
            <h4
              style={{
                fontFamily: 'var(--font-meta)',
                fontSize: '0.75rem',
                color: 'var(--color-gray)',
                margin: '0 0 0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Session Timeline
            </h4>
            <SessionTimeline sessions={sessions} />
          </section>
          <section>
            <h4
              style={{
                fontFamily: 'var(--font-meta)',
                fontSize: '0.75rem',
                color: 'var(--color-gray)',
                margin: '0 0 0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Editing Patterns
            </h4>
            <EditingCharts sessions={sessions} />
          </section>
        </div>
      )}

      {activeTab === 'projects' && (
        <section>
          <h4
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.75rem',
              color: 'var(--color-gray)',
              margin: '0 0 0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            All Documents
          </h4>
          <ProjectComparison />
        </section>
      )}

      {activeTab === 'trends' && (
        <section>
          <h4
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.75rem',
              color: 'var(--color-gray)',
              margin: '0 0 0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            AI Dependency Over Time
          </h4>
          <TrendChart data={trendData} />
        </section>
      )}
    </div>
  );
}
