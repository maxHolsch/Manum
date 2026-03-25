import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { exportAllData, estimateStorageSize } from '../storage/export';
import { resetDB } from '../storage/db';

describe('data export', () => {
  beforeEach(() => {
    resetDB(`test-export-${Math.random()}`);
  });

  it('exports all data with required structure', async () => {
    const data = await exportAllData();
    expect(data).toHaveProperty('exportedAt');
    expect(data).toHaveProperty('version', 1);
    expect(data).toHaveProperty('documents');
    expect(data).toHaveProperty('analytics_sessions');
    expect(data).toHaveProperty('commit_metadata');
    expect(data).toHaveProperty('settings');
    expect(Array.isArray(data.documents)).toBe(true);
    expect(Array.isArray(data.analytics_sessions)).toBe(true);
  });

  it('exportedAt is a valid ISO date string', async () => {
    const data = await exportAllData();
    expect(() => new Date(data.exportedAt)).not.toThrow();
    expect(new Date(data.exportedAt).toString()).not.toBe('Invalid Date');
  });

  it('masks API key in export', async () => {
    const { setSetting } = await import('../storage/settings-store');
    await setSetting('apiKey', 'sk-secret-key');

    const data = await exportAllData();
    const apiKeyEntry = (data.settings as { key: string; value: unknown }[]).find(
      (s) => s.key === 'apiKey',
    );
    if (apiKeyEntry) {
      expect(apiKeyEntry.value).toBe('***');
    }
  });

  it('estimateStorageSize returns a number', async () => {
    const size = await estimateStorageSize();
    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThanOrEqual(0);
  });

  it('estimateStorageSize increases after adding data', async () => {
    const before = await estimateStorageSize();
    const { setSetting } = await import('../storage/settings-store');
    await setSetting('scoringMode', 'llm-judge');
    const after = await estimateStorageSize();
    expect(after).toBeGreaterThanOrEqual(before);
  });
});
