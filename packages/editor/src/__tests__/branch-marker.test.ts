import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import { coreExtensions } from '../editor/schema';
import { BranchMarkerNode } from '../editor/nodes/branch-marker';

describe('Branch marker node', () => {
  it('registers the branchMarker node', () => {
    const editor = new Editor({
      extensions: [...coreExtensions, BranchMarkerNode],
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });
    expect(editor.schema.nodes.branchMarker).toBeDefined();
    editor.destroy();
  });

  it('inserts and serializes branch marker node', () => {
    const editor = new Editor({
      extensions: [...coreExtensions, BranchMarkerNode],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Before ' },
              {
                type: 'branchMarker',
                attrs: { branchId: 'branch_1', branchName: 'draft-a', position: 'start' },
              },
              { type: 'text', text: ' after' },
            ],
          },
        ],
      },
    });

    const json = editor.getJSON() as JSONContent;
    const para = json.content![0];
    const marker = para.content!.find((n: JSONContent) => n.type === 'branchMarker');
    expect(marker).toBeDefined();
    expect(marker!.attrs!['branchId']).toBe('branch_1');
    expect(marker!.attrs!['branchName']).toBe('draft-a');
    expect(marker!.attrs!['position']).toBe('start');

    editor.destroy();
  });

  it('persists node in round-trip serialization', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'branchMarker',
              attrs: { branchId: 'b1', branchName: 'test', position: 'end' },
            },
          ],
        },
      ],
    };

    const editor = new Editor({
      extensions: [...coreExtensions, BranchMarkerNode],
      content,
    });

    const json = editor.getJSON() as JSONContent;
    editor.commands.setContent(json);
    const json2 = editor.getJSON() as JSONContent;
    const marker = json2.content![0].content!.find((n: JSONContent) => n.type === 'branchMarker');
    expect(marker!.attrs!['branchId']).toBe('b1');

    editor.destroy();
  });
});
