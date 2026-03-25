import { describe, it, expect, vi } from 'vitest';

vi.mock('isomorphic-git', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    resolveRef: vi.fn().mockResolvedValue('commit-sha-1'),
    currentBranch: vi.fn().mockResolvedValue('main'),
    log: vi.fn().mockResolvedValue([
      {
        oid: 'sha1',
        commit: {
          message:
            'Auto-save: 2026-01-01T00:00:00Z\n\n{"wordCount":50,"wordCountDelta":50,"attribution":{"green":80,"yellow":10,"red":10}}',
          author: { name: 'Manum', timestamp: 1735689600, timezoneOffset: 0, email: '' },
          committer: { name: 'Manum', timestamp: 1735689600, timezoneOffset: 0, email: '' },
          tree: 'tree-sha',
          parent: [],
          gpgsig: undefined,
        },
        payload: '',
      },
      {
        oid: 'sha2',
        commit: {
          message:
            'Auto-save: 2026-01-02T00:00:00Z\n\n{"wordCount":75,"wordCountDelta":25,"attribution":{"green":70,"yellow":20,"red":10}}',
          author: { name: 'Manum', timestamp: 1735776000, timezoneOffset: 0, email: '' },
          committer: { name: 'Manum', timestamp: 1735776000, timezoneOffset: 0, email: '' },
          tree: 'tree-sha-2',
          parent: ['sha1'],
          gpgsig: undefined,
        },
        payload: '',
      },
    ]),
    readBlob: vi.fn().mockResolvedValue({
      oid: 'blob-sha',
      blob: new TextEncoder().encode(
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"line one"}]}]}',
      ),
    }),
  },
}));

vi.mock('../git/fs', () => {
  const mockFs = {
    promises: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('{}'),
    },
  };
  return {
    getFS: vi.fn().mockReturnValue(mockFs),
    resetFS: vi.fn(),
    GIT_DIR: '/documents',
  };
});

import { getCommitLog } from '../git/log';
import { getCommitDiff } from '../git/diff';

describe('getCommitLog', () => {
  it('returns commits in log order', async () => {
    const log = await getCommitLog('doc123');
    expect(log).toHaveLength(2);
    expect(log[0].oid).toBe('sha1');
    expect(log[1].oid).toBe('sha2');
  });

  it('parses metadata from commit messages', async () => {
    const log = await getCommitLog('doc123');
    expect(log[0].metadata).not.toBeNull();
    expect(log[0].metadata!.wordCount).toBe(50);
    expect(log[0].metadata!.attribution.green).toBe(80);
  });

  it('includes timestamp', async () => {
    const log = await getCommitLog('doc123');
    expect(log[0].timestamp).toBeGreaterThan(0);
  });
});

describe('getCommitDiff', () => {
  it('returns diff with additions and deletions', async () => {
    const diff = await getCommitDiff('doc123', 'sha1', 'sha2');
    expect(diff).toBeDefined();
    expect(typeof diff.additions).toBe('number');
    expect(typeof diff.deletions).toBe('number');
    expect(Array.isArray(diff.lines)).toBe(true);
  });

  it('handles missing file gracefully', async () => {
    const git = (await import('isomorphic-git')).default;
    vi.mocked(git.readBlob).mockRejectedValue(new Error('not found'));

    const diff = await getCommitDiff('doc123', 'sha1', 'sha2');
    expect(diff).toBeDefined();
    expect(diff.additions).toBeGreaterThanOrEqual(0);
  });
});
