import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock isomorphic-git and lightning-fs since they need real IndexedDB
vi.mock('isomorphic-git', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    resolveRef: vi.fn().mockResolvedValue('abc123'),
    currentBranch: vi.fn().mockResolvedValue('main'),
    log: vi.fn().mockResolvedValue([]),
    commit: vi.fn().mockResolvedValue('commit-sha'),
    add: vi.fn().mockResolvedValue(undefined),
    branch: vi.fn().mockResolvedValue(undefined),
    listBranches: vi.fn().mockResolvedValue(['main']),
    checkout: vi.fn().mockResolvedValue(undefined),
    deleteBranch: vi.fn().mockResolvedValue(undefined),
    readBlob: vi.fn().mockRejectedValue(new Error('Not found')),
    findMergeBase: vi.fn().mockResolvedValue(['ancestor-sha']),
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

import { ensureRepoInitialized, getCurrentBranch, resetRepoState } from '../git/repo';

describe('git repo', () => {
  beforeEach(() => {
    resetRepoState();
    vi.clearAllMocks();
  });

  it('initializes repository', async () => {
    const git = (await import('isomorphic-git')).default;
    // resolveRef throws on first call (repo doesn't exist), then succeeds
    vi.mocked(git.resolveRef)
      .mockRejectedValueOnce(new Error('Not found'))
      .mockResolvedValue('abc123');

    await ensureRepoInitialized();
    expect(git.init).toHaveBeenCalled();
  });

  it('does not re-initialize if repo already exists', async () => {
    const git = (await import('isomorphic-git')).default;
    vi.mocked(git.resolveRef).mockResolvedValue('abc123');

    await ensureRepoInitialized();
    await ensureRepoInitialized(); // second call

    expect(git.init).not.toHaveBeenCalled();
  });

  it('returns current branch name', async () => {
    const branch = await getCurrentBranch();
    expect(branch).toBe('main');
  });
});
