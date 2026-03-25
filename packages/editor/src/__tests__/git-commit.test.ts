import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { JSONContent } from '@tiptap/core';

vi.mock('isomorphic-git', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    resolveRef: vi.fn().mockResolvedValue('abc123'),
    currentBranch: vi.fn().mockResolvedValue('main'),
    log: vi.fn().mockResolvedValue([]),
    commit: vi.fn().mockResolvedValue('new-commit-sha'),
    add: vi.fn().mockResolvedValue(undefined),
    readBlob: vi.fn().mockRejectedValue(new Error('Not found')),
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

vi.mock('../git/repo', () => ({
  ensureRepoInitialized: vi.fn().mockResolvedValue(undefined),
  getCurrentBranch: vi.fn().mockResolvedValue('main'),
  resetRepoState: vi.fn(),
}));

import { commitDocument } from '../git/commit';

describe('git commit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a commit for new document content', async () => {
    const git = (await import('isomorphic-git')).default;
    const { getFS } = await import('../git/fs');
    const mockFs = getFS();

    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world test content here.' }],
        },
      ],
    };

    const result = await commitDocument('doc123', content);

    // Should have written the file and added it to git
    expect(mockFs.promises.writeFile).toHaveBeenCalled();
    expect(git.add).toHaveBeenCalled();
    expect(git.commit).toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result?.oid).toBe('new-commit-sha');
  });

  it('returns null when content has not changed', async () => {
    const git = (await import('isomorphic-git')).default;

    // Mock that readBlob returns same content
    const content: JSONContent = { type: 'doc', content: [] };
    const contentStr = JSON.stringify(content, null, 2);
    vi.mocked(git.readBlob).mockResolvedValue({
      oid: 'abc',
      blob: new TextEncoder().encode(contentStr),
    });
    vi.mocked(git.log).mockResolvedValue([
      {
        oid: 'abc123',
        commit: {
          message:
            'Auto-save: 2026-01-01T00:00:00Z\n\n{"wordCount":0,"wordCountDelta":0,"attribution":{"green":100,"yellow":0,"red":0}}',
          author: { name: 'Manum', timestamp: 0, timezoneOffset: 0, email: '' },
          committer: { name: 'Manum', timestamp: 0, timezoneOffset: 0, email: '' },
          tree: 'tree-sha',
          parent: [],
          gpgsig: undefined,
        },
        payload: '',
      },
    ]);

    const result = await commitDocument('doc123', content);
    expect(result).toBeNull();
  });

  it('includes metadata in commit message', async () => {
    const git = (await import('isomorphic-git')).default;

    const content: JSONContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Five words here.' }] }],
    };

    await commitDocument('doc456', content);

    const commitCall = vi.mocked(git.commit).mock.calls[0][0];
    expect(commitCall.message).toContain('Auto-save:');
    expect(commitCall.message).toContain('wordCount');
  });
});
