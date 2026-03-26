import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { computeAttributionStats, useAttributionOverlay } from '../hooks/useAttributionOverlay';
import { Editor } from '@tiptap/core';
import { coreExtensions } from '../editor/schema';
import { AttributionMark } from '../editor/marks/attribution';

function createEditor(html: string) {
  return new Editor({
    extensions: [...coreExtensions, AttributionMark],
    content: html,
  });
}

describe('useAttributionOverlay', () => {
  it('starts with overlay hidden', () => {
    const { result } = renderHook(() => useAttributionOverlay());
    expect(result.current.showOverlay).toBe(false);
  });

  it('toggles overlay on/off', () => {
    const { result } = renderHook(() => useAttributionOverlay());
    act(() => result.current.toggleOverlay());
    expect(result.current.showOverlay).toBe(true);
    act(() => result.current.toggleOverlay());
    expect(result.current.showOverlay).toBe(false);
  });
});

describe('computeAttributionStats', () => {
  it('returns zeros for null editor', () => {
    const stats = computeAttributionStats(null);
    expect(stats.totalChars).toBe(0);
    expect(stats.redChars).toBe(0);
  });

  it('counts attributed chars', () => {
    const editor = createEditor('<p>Hello world</p>');
    editor.commands.selectAll();
    editor.commands.setMark('attribution', { color: 'red' });

    const stats = computeAttributionStats(editor);
    expect(stats.redChars).toBeGreaterThan(0);
    expect(stats.redPct).toBe(100);
    editor.destroy();
  });

  it('computes mixed attribution percentages', () => {
    // Create editor with mixed attribution - set all text red first, then some green
    const editor = createEditor('<p>Hello world</p>');
    // Apply red to everything
    editor.commands.selectAll();
    editor.commands.setMark('attribution', { color: 'red' });

    const stats = computeAttributionStats(editor);
    expect(stats.redPct + stats.yellowPct + stats.greenPct).toBeLessThanOrEqual(100);
    editor.destroy();
  });

  it('treats unmarked (typed) text as green', () => {
    // Plain typed text has no attribution mark — should count as green
    const editor = createEditor('<p>Hello world</p>');
    const stats = computeAttributionStats(editor);
    expect(stats.totalChars).toBe(11); // "Hello world"
    expect(stats.greenChars).toBe(11);
    expect(stats.greenPct).toBe(100);
    expect(stats.redChars).toBe(0);
    expect(stats.yellowChars).toBe(0);
    editor.destroy();
  });

  it('mixed: typed text is green, pasted text retains its mark', () => {
    const editor = createEditor('<p>Hello world</p>');
    // Mark first 5 chars as red (simulating a paste)
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.commands.setMark('attribution', { color: 'red' });

    const stats = computeAttributionStats(editor);
    expect(stats.redChars).toBe(5);
    expect(stats.greenChars).toBe(6); // " world" = unmarked = green
    expect(stats.totalChars).toBe(11);
    editor.destroy();
  });
});
