import { Node, mergeAttributes } from '@tiptap/core';

export interface BranchMarkerAttributes {
  branchId: string | null;
  branchName: string | null;
  position: 'start' | 'end' | null;
}

export const BranchMarkerNode = Node.create({
  name: 'branchMarker',

  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      branchId: { default: null },
      branchName: { default: null },
      position: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-branch-marker]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            branchId: el.getAttribute('data-branch-id'),
            branchName: el.getAttribute('data-branch-name'),
            position: el.getAttribute('data-branch-position') as 'start' | 'end' | null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-branch-marker': 'true',
        'data-branch-id': HTMLAttributes['branchId'],
        'data-branch-name': HTMLAttributes['branchName'],
        'data-branch-position': HTMLAttributes['position'],
        contenteditable: 'false',
        style: 'display:inline-block;width:0;height:0;',
      }),
    ];
  },
});
