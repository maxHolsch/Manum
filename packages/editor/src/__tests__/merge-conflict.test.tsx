import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MergeConflictUI } from '../components/MergeConflict';
import type { JSONContent } from '@tiptap/core';

vi.mock('../git/merge', () => ({
  resolveConflicts: vi.fn().mockResolvedValue('resolved-commit-sha'),
}));

const mergedContent: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Some text' }] }],
};

const conflicts = [
  {
    paragraphIndex: 0,
    currentContent: {
      type: 'paragraph' as const,
      content: [{ type: 'text', text: 'Current version text' }],
    },
    incomingContent: {
      type: 'paragraph' as const,
      content: [{ type: 'text', text: 'Incoming version text' }],
    },
    ancestorContent: null,
  },
];

describe('MergeConflictUI', () => {
  it('renders conflict cards', () => {
    const onResolved = vi.fn();
    const onCancel = vi.fn();

    render(
      <MergeConflictUI
        docId="doc123"
        mergedContent={mergedContent}
        conflicts={conflicts}
        incomingBranch="feature"
        onResolved={onResolved}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByTestId('merge-conflict-ui')).toBeDefined();
    expect(screen.getByTestId('conflict-card-0')).toBeDefined();
  });

  it('shows current and incoming versions', () => {
    const onResolved = vi.fn();
    const onCancel = vi.fn();

    render(
      <MergeConflictUI
        docId="doc123"
        mergedContent={mergedContent}
        conflicts={conflicts}
        incomingBranch="feature"
        onResolved={onResolved}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText('Current version text')).toBeDefined();
    expect(screen.getByText('Incoming version text')).toBeDefined();
  });

  it('shows incoming branch name', () => {
    render(
      <MergeConflictUI
        docId="doc123"
        mergedContent={mergedContent}
        conflicts={conflicts}
        incomingBranch="my-feature-branch"
        onResolved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('my-feature-branch')).toBeDefined();
  });

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = vi.fn();
    render(
      <MergeConflictUI
        docId="doc123"
        mergedContent={mergedContent}
        conflicts={conflicts}
        incomingBranch="feature"
        onResolved={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('has accept current and accept incoming buttons', () => {
    render(
      <MergeConflictUI
        docId="doc123"
        mergedContent={mergedContent}
        conflicts={conflicts}
        incomingBranch="feature"
        onResolved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByTestId('accept-current-0')).toBeDefined();
    expect(screen.getByTestId('accept-incoming-0')).toBeDefined();
  });
});
