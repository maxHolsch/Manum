import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  initSessionTracker,
  getCurrentSession,
  resetSessionTracker,
  getSessionsForDocument,
} from '../analytics/session';
import { emit, resetEventBus } from '../analytics/event-bus';
import { resetDB } from '../storage/db';

describe('session aggregation', () => {
  beforeEach(() => {
    resetEventBus();
    resetSessionTracker();
    resetDB(`test-sessions-${Math.random()}`);
  });

  it('initializes a new session on first call', () => {
    const cleanup = initSessionTracker('doc-1');
    const session = getCurrentSession();
    expect(session).not.toBeNull();
    expect(session?.documentId).toBe('doc-1');
    expect(session?.editCount).toBe(0);
    cleanup();
  });

  it('increments editCount on edit events', () => {
    const cleanup = initSessionTracker('doc-1');
    emit('edit');
    emit('edit');
    emit('edit');
    const session = getCurrentSession();
    expect(session?.editCount).toBe(3);
    cleanup();
  });

  it('increments pasteCount on paste events', () => {
    const cleanup = initSessionTracker('doc-1');
    emit('paste');
    emit('paste');
    const session = getCurrentSession();
    expect(session?.pasteCount).toBe(2);
    cleanup();
  });

  it('increments deleteCount on delete events', () => {
    const cleanup = initSessionTracker('doc-1');
    emit('delete');
    const session = getCurrentSession();
    expect(session?.deleteCount).toBe(1);
    cleanup();
  });

  it('increments tabSwitches on tab_switch events', () => {
    const cleanup = initSessionTracker('doc-1');
    emit('tab_switch');
    emit('tab_switch');
    const session = getCurrentSession();
    expect(session?.tabSwitches).toBe(2);
    cleanup();
  });

  it('increments branchCreations on branch_create events', () => {
    const cleanup = initSessionTracker('doc-1');
    emit('branch_create');
    const session = getCurrentSession();
    expect(session?.branchCreations).toBe(1);
    cleanup();
  });

  it('tracks session document ID', () => {
    const cleanup = initSessionTracker('my-document');
    const session = getCurrentSession();
    expect(session?.documentId).toBe('my-document');
    cleanup();
  });

  it('returns empty array for document with no sessions', async () => {
    const sessions = await getSessionsForDocument('nonexistent');
    expect(sessions).toEqual([]);
  });

  it('cleanup stops event handling', () => {
    const cleanup = initSessionTracker('doc-1');
    cleanup();
    resetSessionTracker();
    const cleanup2 = initSessionTracker('doc-2');
    emit('edit');
    const session = getCurrentSession();
    expect(session?.documentId).toBe('doc-2');
    cleanup2();
  });
});
