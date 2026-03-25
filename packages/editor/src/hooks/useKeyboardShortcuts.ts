/**
 * T179: Keyboard shortcuts hook
 */

import { useEffect } from 'react';

export interface KeyboardShortcutActions {
  toggleAttribution?: () => void;
  createBranch?: () => void;
  toggleDrawer?: () => void;
  save?: () => void;
  switchMode?: (mode: 'write' | 'branch' | 'insights') => void;
}

export function useKeyboardShortcuts(actions: KeyboardShortcutActions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        actions.toggleAttribution?.();
        return;
      }

      if (ctrl && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        actions.createBranch?.();
        return;
      }

      if (ctrl && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        actions.toggleDrawer?.();
        return;
      }

      if (ctrl && e.key === 's') {
        e.preventDefault();
        actions.save?.();
        return;
      }

      if (ctrl && e.key === '1') {
        e.preventDefault();
        actions.switchMode?.('write');
        return;
      }
      if (ctrl && e.key === '2') {
        e.preventDefault();
        actions.switchMode?.('branch');
        return;
      }
      if (ctrl && e.key === '3') {
        e.preventDefault();
        actions.switchMode?.('insights');
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [actions]);
}
