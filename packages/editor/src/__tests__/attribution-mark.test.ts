import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import { coreExtensions } from '../editor/schema';
import { AttributionMark } from '../editor/marks/attribution';

function createEditor(content = 'Hello world') {
  return new Editor({
    extensions: [...coreExtensions, AttributionMark],
    content: `<p>${content}</p>`,
  });
}

describe('Attribution mark', () => {
  it('registers the attribution mark', () => {
    const editor = createEditor();
    expect(editor.schema.marks.attribution).toBeDefined();
    editor.destroy();
  });

  it('applies attribution mark with default attributes', () => {
    const editor = createEditor('Hello world');
    editor.commands.selectAll();
    editor.commands.setMark('attribution', { color: 'green' });

    const json = editor.getJSON() as JSONContent;
    const marks = json.content![0].content![0].marks;
    expect(marks).toBeDefined();
    expect(marks![0].type).toBe('attribution');
    expect(marks![0].attrs!['color']).toBe('green');
    editor.destroy();
  });

  it('preserves all attributes in JSON round-trip', () => {
    const editor = createEditor('Test text');
    const attrs = {
      color: 'red' as const,
      confidence: 0.85,
      scoringMode: 'edit-distance' as const,
      pasteEventId: 'paste_123',
      originalPasteContent: 'original content',
      editDistance: 0.15,
      createdAt: 1700000000000,
    };

    editor.commands.selectAll();
    editor.commands.setMark('attribution', attrs);

    const json = editor.getJSON() as JSONContent;
    const savedAttrs = json.content![0].content![0].marks![0].attrs!;

    expect(savedAttrs['color']).toBe('red');
    expect(savedAttrs['confidence']).toBe(0.85);
    expect(savedAttrs['scoringMode']).toBe('edit-distance');
    expect(savedAttrs['pasteEventId']).toBe('paste_123');
    expect(savedAttrs['editDistance']).toBe(0.15);
    expect(savedAttrs['createdAt']).toBe(1700000000000);

    // Round-trip
    editor.commands.setContent(json);
    const json2 = editor.getJSON() as JSONContent;
    expect(json2.content![0].content![0].marks![0].attrs!['color']).toBe('red');

    editor.destroy();
  });

  it('supports multiple attribution colors', () => {
    const editor = createEditor();
    editor.commands.selectAll();

    for (const color of ['green', 'yellow', 'red'] as const) {
      editor.commands.setMark('attribution', { color });
      const json = editor.getJSON() as JSONContent;
      const markAttrs = json.content![0].content![0].marks?.find(
        (m: { type: string }) => m.type === 'attribution',
      )?.attrs;
      expect(markAttrs?.['color']).toBe(color);
    }

    editor.destroy();
  });
});
