import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('isomorphic-git', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    resolveRef: vi.fn().mockResolvedValue('abc123'),
    currentBranch: vi.fn().mockResolvedValue('main'),
    log: vi.fn().mockResolvedValue([]),
    commit: vi.fn().mockResolvedValue('new-sha'),
    add: vi.fn().mockResolvedValue(undefined),
    branch: vi.fn().mockResolvedValue(undefined),
    listBranches: vi.fn().mockResolvedValue(['main']),
    checkout: vi.fn().mockResolvedValue(undefined),
    deleteBranch: vi.fn().mockResolvedValue(undefined),
    readBlob: vi.fn().mockRejectedValue(new Error('Not found')),
  },
}));

vi.mock('../git/fs', () => {
  const mockFs = {
    promises: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockRejectedValue(new Error('Not found')),
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

import { createBranch, listBranches } from '../git/branches';

describe('branch operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a branch with auto-generated name', async () => {
    const git = (await import('isomorphic-git')).default;
    vi.mocked(git.listBranches).mockResolvedValue(['main']);

    const name = await createBranch();
    expect(name).toBe('branch-1');
    expect(git.branch).toHaveBeenCalledWith(expect.objectContaining({ ref: 'branch-1' }));
  });

  it('increments branch counter when branches already exist', async () => {
    const git = (await import('isomorphic-git')).default;
    vi.mocked(git.listBranches).mockResolvedValue(['main', 'branch-1', 'branch-2']);

    const name = await createBranch();
    expect(name).toBe('branch-3');
  });

  it('creates branch with specified name', async () => {
    const git = (await import('isomorphic-git')).default;
    const name = await createBranch('my-feature');
    expect(name).toBe('my-feature');
    expect(git.branch).toHaveBeenCalledWith(expect.objectContaining({ ref: 'my-feature' }));
  });

  it('lists branches with active flag', async () => {
    const git = (await import('isomorphic-git')).default;
    vi.mocked(git.listBranches).mockResolvedValue(['main', 'branch-1']);

    const branches = await listBranches();
    expect(branches).toHaveLength(2);
    const mainBranch = branches.find((b) => b.name === 'main');
    expect(mainBranch?.isActive).toBe(true);
    const featureBranch = branches.find((b) => b.name === 'branch-1');
    expect(featureBranch?.isActive).toBe(false);
  });

  it('branch appears in list after creation', async () => {
    const git = (await import('isomorphic-git')).default;
    // After creating, listBranches returns both branches
    vi.mocked(git.listBranches).mockResolvedValue(['main', 'new-branch']);

    await createBranch('new-branch');
    const branches = await listBranches();
    expect(branches.map((b) => b.name)).toContain('new-branch');
  });
});
