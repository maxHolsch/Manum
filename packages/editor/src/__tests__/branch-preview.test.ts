import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSectionPreviews } from '../git/section-preview';
import type { JSONContent } from '@tiptap/core';

const mainBranchDoc: JSONContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Main branch paragraph one.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Main branch paragraph two.' }] },
  ],
};

const featureBranchDoc: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Feature branch paragraph one - modified.' }],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'Main branch paragraph two.' }] },
  ],
};

vi.mock('isomorphic-git', () => ({
  default: {
    resolveRef: vi.fn().mockImplementation(({ ref }) => {
      if (ref === 'main') return Promise.resolve('main-sha');
      if (ref === 'feature') return Promise.resolve('feature-sha');
      return Promise.reject(new Error('Unknown branch'));
    }),
    readBlob: vi.fn().mockImplementation(({ oid }) => {
      const doc = oid === 'main-sha' ? mainBranchDoc : featureBranchDoc;
      return Promise.resolve({
        oid,
        blob: new TextEncoder().encode(JSON.stringify(doc)),
      });
    }),
  },
}));

vi.mock('../git/fs', () => {
  return {
    getFS: vi.fn().mockReturnValue({}),
    resetFS: vi.fn(),
    GIT_DIR: '/documents',
  };
});

describe('getSectionPreviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns previews for all branches', async () => {
    const previews = await getSectionPreviews('doc123', 0, ['main', 'feature']);
    expect(previews).toHaveLength(2);
    expect(previews.map((p) => p.branchName)).toContain('main');
    expect(previews.map((p) => p.branchName)).toContain('feature');
  });

  it('returns correct paragraph text for each branch', async () => {
    const previews = await getSectionPreviews('doc123', 0, ['main', 'feature']);
    const mainPreview = previews.find((p) => p.branchName === 'main');
    const featurePreview = previews.find((p) => p.branchName === 'feature');

    expect(mainPreview?.paragraphText).toBe('Main branch paragraph one.');
    expect(featurePreview?.paragraphText).toBe('Feature branch paragraph one - modified.');
  });

  it('returns empty array for unknown branches', async () => {
    const git = (await import('isomorphic-git')).default;
    vi.mocked(git.resolveRef).mockRejectedValue(new Error('Unknown'));

    const previews = await getSectionPreviews('doc123', 0, ['unknown-branch']);
    expect(previews).toHaveLength(0);
  });

  it('returns empty for out-of-range paragraph index', async () => {
    const previews = await getSectionPreviews('doc123', 99, ['main']);
    expect(previews).toHaveLength(0);
  });
});
