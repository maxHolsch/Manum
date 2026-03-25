import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { resetDB } from '../storage/db';
import { createDocument } from '../storage/documents';
import { useAutoSave } from '../hooks/useAutoSave';
import type { Editor } from '@tiptap/react';

let testDbSeq = 0;

// Mock editor
function makeMockEditor(
  content = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
  },
) {
  return {
    getJSON: () => content,
  } as unknown as Editor;
}

beforeEach(() => {
  testDbSeq++;
  resetDB(`manum_test_autosave_${testDbSeq}`);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetDB();
});

describe('useAutoSave', () => {
  it('saves after debounce period (real timers + mock updateDocument)', async () => {
    // Use a mock to avoid idb interactions with fake timers
    const mod = await import('../storage/documents');
    const spy = vi.spyOn(mod, 'updateDocument').mockResolvedValue({
      id: 'doc_test',
      title: 'Test',
      content: { type: 'doc' },
      attributionSpans: [],
      createdAt: 1,
      updatedAt: 2,
    });

    vi.useFakeTimers();
    const { result } = renderHook(() => useAutoSave('doc_test', 500));
    const editor = makeMockEditor();

    act(() => {
      result.current.scheduleAutoSave(editor);
    });

    expect(result.current.saveStatus).toBe('idle');

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('resets timer on rapid edits (single save)', async () => {
    // Create doc with real timers first, then switch to fake
    const doc = await createDocument('Test');
    vi.useFakeTimers();

    const mod = await import('../storage/documents');
    const spy = vi.spyOn(mod, 'updateDocument').mockResolvedValue(undefined);

    const { result } = renderHook(() => useAutoSave(doc.id, 1000));
    const editor = makeMockEditor();

    act(() => {
      result.current.scheduleAutoSave(editor);
      vi.advanceTimersByTime(300);
      result.current.scheduleAutoSave(editor);
      vi.advanceTimersByTime(300);
      result.current.scheduleAutoSave(editor);
    });

    // Not yet saved (timer was reset each time)
    expect(spy).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1100);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Only one save should have been triggered
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does nothing when documentId is null', async () => {
    vi.useFakeTimers();
    const mod = await import('../storage/documents');
    const spy = vi.spyOn(mod, 'updateDocument');

    const { result } = renderHook(() => useAutoSave(null, 500));

    act(() => {
      result.current.scheduleAutoSave(makeMockEditor());
      vi.advanceTimersByTime(1000);
    });

    expect(spy).not.toHaveBeenCalled();
  });
});
