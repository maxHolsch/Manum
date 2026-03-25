import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import { coreExtensions } from '../editor/schema';
import { AttributionMark } from '../editor/marks/attribution';
import { applyTimestamps } from '../attribution/timestamp-tracker';

function createEditor(content = '<p>Hello world</p>') {
  return new Editor({
    extensions: [...coreExtensions, AttributionMark],
    content,
  });
}

describe('timestamp-tracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  it('applies createdAt to text without attribution marks', () => {
    const editor = createEditor('<p>Hello world</p>');

    applyTimestamps(editor);

    const json = editor.getJSON();
    const marks = json.content![0].content![0].marks;
    expect(marks).toBeDefined();
    const attrMark = marks!.find((m: { type: string }) => m.type === 'attribution');
    expect(attrMark).toBeDefined();
    expect(attrMark!.attrs!['color']).toBe('green');
    expect(attrMark!.attrs!['createdAt']).toBe(new Date('2026-01-01T00:00:00Z').getTime());

    editor.destroy();
  });

  it('does not override existing createdAt on marked text', () => {
    const editor = createEditor('<p>Test</p>');

    // Apply initial marks
    editor.commands.selectAll();
    editor.commands.setMark('attribution', {
      color: 'green',
      createdAt: 1000000,
    });

    // Advance time and apply timestamps again
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    applyTimestamps(editor);

    const json = editor.getJSON();
    const marks = json.content![0].content![0].marks!;
    const attrMark = marks.find((m: { type: string }) => m.type === 'attribution')!;

    // createdAt should NOT have changed
    expect(attrMark.attrs!['createdAt']).toBe(1000000);

    editor.destroy();
  });

  it('backfills createdAt on attribution marks without timestamp', () => {
    const editor = createEditor('<p>Test</p>');

    // Apply attribution mark without createdAt
    editor.commands.selectAll();
    editor.commands.setMark('attribution', { color: 'red', createdAt: null });

    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    applyTimestamps(editor);

    const json = editor.getJSON();
    const marks = json.content![0].content![0].marks!;
    const attrMark = marks.find((m: { type: string }) => m.type === 'attribution')!;

    expect(attrMark.attrs!['createdAt']).toBe(new Date('2026-01-15T12:00:00Z').getTime());
    // Color should be preserved
    expect(attrMark.attrs!['color']).toBe('red');

    editor.destroy();
  });
});
