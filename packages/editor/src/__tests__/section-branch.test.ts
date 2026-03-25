import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSectionBranch,
  getSectionBranches,
  getBranchedParagraphIndices,
  clearSectionBranchMap,
} from '../git/section-branch';

vi.mock('../git/branches', () => ({
  createBranch: vi.fn().mockResolvedValue('section-branch-1'),
}));

describe('section-branch', () => {
  beforeEach(() => {
    clearSectionBranchMap();
    vi.clearAllMocks();
  });

  it('creates a branch with section metadata', async () => {
    const metadata = await createSectionBranch('doc123', 2);
    expect(metadata.branchName).toBe('section-branch-1');
    expect(metadata.paragraphIndex).toBe(2);
    expect(metadata.createdAt).toBeGreaterThan(0);
  });

  it('stores section branch in map', async () => {
    await createSectionBranch('doc123', 1);
    const branches = getSectionBranches('doc123');
    expect(branches).toHaveLength(1);
    expect(branches[0].paragraphIndex).toBe(1);
  });

  it('tracks multiple section branches per document', async () => {
    await createSectionBranch('doc123', 0);
    await createSectionBranch('doc123', 2);
    const branches = getSectionBranches('doc123');
    expect(branches).toHaveLength(2);
  });

  it('returns branched paragraph indices as a set', async () => {
    await createSectionBranch('doc123', 0);
    await createSectionBranch('doc123', 3);
    const indices = getBranchedParagraphIndices('doc123');
    expect(indices.has(0)).toBe(true);
    expect(indices.has(3)).toBe(true);
    expect(indices.has(1)).toBe(false);
  });

  it('handles custom branch name', async () => {
    const { createBranch } = await import('../git/branches');
    vi.mocked(createBranch).mockResolvedValue('my-custom-branch');

    const metadata = await createSectionBranch('doc123', 0, 'my-custom-branch');
    expect(metadata.branchName).toBe('my-custom-branch');
  });

  it('returns empty array for documents with no section branches', () => {
    const branches = getSectionBranches('unknown-doc');
    expect(branches).toHaveLength(0);
  });
});
