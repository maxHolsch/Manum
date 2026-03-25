import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, ...opts });
  document.dispatchEvent(event);
}

describe('keyboard shortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Ctrl+Shift+A toggles attribution', () => {
    const toggleAttribution = vi.fn();
    renderHook(() => useKeyboardShortcuts({ toggleAttribution }));
    fireKey('A', { ctrlKey: true, shiftKey: true });
    expect(toggleAttribution).toHaveBeenCalledOnce();
  });

  it('Ctrl+Shift+B creates branch', () => {
    const createBranch = vi.fn();
    renderHook(() => useKeyboardShortcuts({ createBranch }));
    fireKey('B', { ctrlKey: true, shiftKey: true });
    expect(createBranch).toHaveBeenCalledOnce();
  });

  it('Ctrl+Shift+D toggles drawer', () => {
    const toggleDrawer = vi.fn();
    renderHook(() => useKeyboardShortcuts({ toggleDrawer }));
    fireKey('D', { ctrlKey: true, shiftKey: true });
    expect(toggleDrawer).toHaveBeenCalledOnce();
  });

  it('Ctrl+S triggers save', () => {
    const save = vi.fn();
    renderHook(() => useKeyboardShortcuts({ save }));
    fireKey('s', { ctrlKey: true });
    expect(save).toHaveBeenCalledOnce();
  });

  it('Ctrl+1 switches to write mode', () => {
    const switchMode = vi.fn();
    renderHook(() => useKeyboardShortcuts({ switchMode }));
    fireKey('1', { ctrlKey: true });
    expect(switchMode).toHaveBeenCalledWith('write');
  });

  it('Ctrl+2 switches to branch mode', () => {
    const switchMode = vi.fn();
    renderHook(() => useKeyboardShortcuts({ switchMode }));
    fireKey('2', { ctrlKey: true });
    expect(switchMode).toHaveBeenCalledWith('branch');
  });

  it('Ctrl+3 switches to insights mode', () => {
    const switchMode = vi.fn();
    renderHook(() => useKeyboardShortcuts({ switchMode }));
    fireKey('3', { ctrlKey: true });
    expect(switchMode).toHaveBeenCalledWith('insights');
  });

  it('does not trigger without modifier', () => {
    const save = vi.fn();
    renderHook(() => useKeyboardShortcuts({ save }));
    fireKey('s'); // no ctrl
    expect(save).not.toHaveBeenCalled();
  });

  it('cleans up listeners on unmount', () => {
    const save = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ save }));
    unmount();
    fireKey('s', { ctrlKey: true });
    expect(save).not.toHaveBeenCalled();
  });
});
