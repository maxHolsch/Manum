import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { JSONContent } from '@tiptap/core';

const ancestorDoc: JSONContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph one original.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph two original.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph three original.' }] },
  ],
};

// Current branch changed paragraph 1
const currentDoc: JSONContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph one modified on main.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph two original.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph three original.' }] },
  ],
};

// Incoming branch changed paragraph 2
const incomingNonConflictDoc: JSONContent = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph one original.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph two modified on feature.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph three original.' }] },
  ],
};

// Incoming branch also changed paragraph 1 (conflict)
const incomingConflictDoc: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Paragraph one modified on feature - DIFFERENT.' }],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph two original.' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph three original.' }] },
  ],
};

let currentDocForTest: JSONContent = currentDoc;
let incomingDocForTest: JSONContent = incomingNonConflictDoc;

vi.mock('isomorphic-git', () => ({
  default: {
    init: vi.fn().mockResolvedValue(undefined),
    resolveRef: vi.fn().mockImplementation(({ ref }) => {
      if (ref === 'main') return Promise.resolve('current-sha');
      if (ref === 'feature') return Promise.resolve('incoming-sha');
      if (ref === 'conflict-feature') return Promise.resolve('conflict-sha');
      return Promise.reject(new Error('Unknown ref'));
    }),
    currentBranch: vi.fn().mockResolvedValue('main'),
    findMergeBase: vi.fn().mockResolvedValue(['ancestor-sha']),
    readBlob: vi.fn().mockImplementation(({ oid }) => {
      let doc: JSONContent;
      if (oid === 'current-sha') doc = currentDocForTest;
      else if (oid === 'incoming-sha') doc = incomingDocForTest;
      else if (oid === 'conflict-sha') doc = incomingConflictDoc;
      else doc = ancestorDoc;
      return Promise.resolve({ oid, blob: new TextEncoder().encode(JSON.stringify(doc)) });
    }),
    add: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue('merge-commit-sha'),
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

import { threeWayMerge, resolveConflicts } from '../git/merge';

describe('threeWayMerge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentDocForTest = currentDoc;
    incomingDocForTest = incomingNonConflictDoc;
  });

  it('auto-merges non-conflicting changes', async () => {
    const result = await threeWayMerge('doc123', 'feature');
    expect(result.success).toBe(true);
    expect(result.conflicts).toHaveLength(0);
    expect(result.mergedContent).not.toBeNull();
    expect(result.commitOid).toBe('merge-commit-sha');

    // Merged content should have both changes
    const paragraphs = result.mergedContent!.content!;
    const texts = paragraphs.map((p) => {
      return p.content?.[0]?.text ?? '';
    });
    expect(texts[0]).toContain('modified on main');
    expect(texts[1]).toContain('modified on feature');
  });

  it('detects conflicting changes on same paragraph', async () => {
    const git = (await import('isomorphic-git')).default;
    vi.mocked(git.resolveRef).mockImplementation(({ ref }) => {
      if (ref === 'main') return Promise.resolve('current-sha');
      if (ref === 'conflict-feature') return Promise.resolve('conflict-sha');
      return Promise.reject(new Error('Unknown'));
    });

    const result = await threeWayMerge('doc123', 'conflict-feature');
    expect(result.success).toBe(false);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0].paragraphIndex).toBe(0);
  });

  it('includes both versions in conflict', async () => {
    const git = (await import('isomorphic-git')).default;
    vi.mocked(git.resolveRef).mockImplementation(({ ref }) => {
      if (ref === 'main') return Promise.resolve('current-sha');
      if (ref === 'conflict-feature') return Promise.resolve('conflict-sha');
      return Promise.reject(new Error('Unknown'));
    });

    const result = await threeWayMerge('doc123', 'conflict-feature');
    expect(result.conflicts[0].currentContent).toBeDefined();
    expect(result.conflicts[0].incomingContent).toBeDefined();
  });
});

describe('resolveConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves conflicts and creates merge commit', async () => {
    const mergedContent: JSONContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph one original.' }] },
      ],
    };

    const conflicts = [
      {
        paragraphIndex: 0,
        currentContent: { type: 'paragraph', content: [{ type: 'text', text: 'Current version' }] },
        incomingContent: {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Incoming version' }],
        },
        ancestorContent: null,
      },
    ];

    const resolutions = new Map([[0, 'incoming' as const]]);

    const oid = await resolveConflicts('doc123', mergedContent, resolutions, conflicts, 'feature');
    expect(oid).toBe('merge-commit-sha');
  });
});
