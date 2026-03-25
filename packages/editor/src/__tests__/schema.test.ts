import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import { coreExtensions } from '../editor/schema';

describe('Document schema', () => {
  it('creates editor with core extensions', () => {
    const editor = new Editor({
      extensions: coreExtensions,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
      },
    });
    expect(editor).toBeDefined();
    editor.destroy();
  });

  it('serializes and deserializes document content', () => {
    const initialContent = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph' }] },
      ],
    };

    const editor = new Editor({
      extensions: coreExtensions,
      content: initialContent,
    });

    const json = editor.getJSON() as JSONContent;
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(2);
    expect(json.content![0].content![0].text).toBe('Hello world');

    // Round-trip: set content from JSON and re-serialize
    editor.commands.setContent(json);
    const json2 = editor.getJSON() as JSONContent;
    expect(json2).toEqual(json);

    editor.destroy();
  });

  it('uses paragraph as primary content block', () => {
    const editor = new Editor({
      extensions: coreExtensions,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });
    const json = editor.getJSON() as JSONContent;
    expect(json.content![0].type).toBe('paragraph');
    editor.destroy();
  });
});
