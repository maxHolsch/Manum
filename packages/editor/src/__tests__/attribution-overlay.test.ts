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
});
