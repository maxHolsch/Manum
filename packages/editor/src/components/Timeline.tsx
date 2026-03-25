/**
 * T160, T161, T162: Commit timeline with hand-drawn connectors and history navigation
 */

import { useCallback, useEffect, useState } from 'react';
import { getCommitLog, type CommitLogEntry } from '../git/log';
import { getCommitMetadata } from '../git/commit-metadata';
import { TimelineEntry } from './TimelineEntry';
import { TimelineConnector } from './TimelineConnector';
import type { CommitMetadataRecord } from '../storage/db';
import '../styles/cards.css';

interface TimelineProps {
  docId: string;
  currentOid: string | null;
  onSelectCommit: (oid: string) => void;
}

export function Timeline({ docId, currentOid, onSelectCommit }: TimelineProps) {
  const [commits, setCommits] = useState<CommitLogEntry[]>([]);
  const [metadataMap, setMetadataMap] = useState<Map<string, CommitMetadataRecord>>(new Map());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const log = await getCommitLog(docId);
      setCommits(log);

      // Load LLM metadata for each commit
      const entries = await Promise.all(
        log.map(async (c) => {
          const m = await getCommitMetadata(c.oid);
          return [c.oid, m] as [string, CommitMetadataRecord | null];
        }),
      );
      const map = new Map<string, CommitMetadataRecord>();
      for (const [oid, m] of entries) {
        if (m) map.set(oid, m);
      }
      setMetadataMap(map);
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div
        style={{
          padding: '1rem',
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
        }}
      >
        Loading history…
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div
        style={{
          padding: '1rem',
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
        }}
      >
        No commits yet. Start writing to create history.
      </div>
    );
  }

  const activeOid = currentOid ?? commits[0]?.oid;

  return (
    <div data-testid="timeline" style={{ padding: '0.5rem' }}>
      {commits.map((commit, idx) => (
        <div key={commit.oid}>
          <TimelineEntry
            entry={commit}
            llmMetadata={metadataMap.get(commit.oid) ?? null}
            isActive={commit.oid === activeOid}
            onClick={onSelectCommit}
          />
          {idx < commits.length - 1 && <TimelineConnector height={20} />}
        </div>
      ))}
    </div>
  );
}
