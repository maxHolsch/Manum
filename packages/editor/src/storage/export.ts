/**
 * T176: Data export logic
 */

import { getDB } from './db';

export interface ExportData {
  exportedAt: string;
  version: number;
  documents: unknown[];
  analytics_sessions: unknown[];
  commit_metadata: unknown[];
  settings: unknown[];
}

export async function exportAllData(): Promise<ExportData> {
  const db = await getDB();
  const [documents, sessions, commitMeta, settings] = await Promise.all([
    db.getAll('documents'),
    db.getAll('analytics_sessions'),
    db.getAll('commit_metadata'),
    db.getAll('settings'),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    documents,
    analytics_sessions: sessions,
    commit_metadata: commitMeta,
    settings: settings.map((s) => ({
      key: s.key,
      // Mask API key
      value: s.key === 'apiKey' ? '***' : s.value,
    })),
  };
}

export function downloadAsJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function estimateStorageSize(): Promise<number> {
  try {
    const db = await getDB();
    const stores = ['documents', 'analytics_sessions', 'commit_metadata', 'settings'] as const;
    let totalSize = 0;
    for (const store of stores) {
      const items = await db.getAll(store);
      totalSize += JSON.stringify(items).length;
    }
    return totalSize;
  } catch {
    return 0;
  }
}

export async function cleanupOldData(): Promise<void> {
  try {
    const db = await getDB();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const sessions = await db.getAll('analytics_sessions');
    const oldSessions = sessions.filter((s) => s.endTime < thirtyDaysAgo);
    const tx = db.transaction('analytics_sessions', 'readwrite');
    await Promise.all([...oldSessions.map((s) => tx.store.delete(s.id)), tx.done]);
  } catch {
    // Non-fatal
  }
}
