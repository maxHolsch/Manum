import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('isomorphic-git', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    resolveRef: vi.fn().mockResolvedValue('abc123'),
    currentBranch: vi.fn().mockResolvedValue('main'),
    checkout: vi.fn().mockResolvedValue(undefined),
    listBranches: vi.fn().mockResolvedValue(['main', 'feature-1']),
    branch: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../git/fs', () => {
  const mockFs = {
    promises: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi
        .fn()
        .mockResolvedValue(
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Feature branch content"}]}]}',
        ),
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

import { checkoutBranch } from '../git/branches';

describe('branch switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks out the branch and returns document content', async () => {
    const git = (await import('isomorphic-git')).default;
    const content = await checkoutBranch('feature-1', 'doc123');

    expect(git.checkout).toHaveBeenCalledWith(expect.objectContaining({ ref: 'feature-1' }));
    expect(content).not.toBeNull();
    expect(content?.type).toBe('doc');
  });

  it('returns null when document file does not exist', async () => {
    const { getFS } = await import('../git/fs');
    const mockFs = getFS();
    vi.mocked(mockFs.promises.readFile).mockRejectedValue(new Error('File not found'));

    const content = await checkoutBranch('empty-branch', 'doc123');
    expect(content).toBeNull();
  });
});
