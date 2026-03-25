import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  emit,
  subscribe,
  flushBuffer,
  getBufferedEvents,
  resetEventBus,
} from '../analytics/event-bus';

describe('analytics event bus', () => {
  beforeEach(() => {
    resetEventBus();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits events to subscribers', () => {
    const handler = vi.fn();
    subscribe('edit', handler);

    emit('edit', { chars: 5 });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: 'edit',
      payload: { chars: 5 },
    });
    expect(typeof handler.mock.calls[0][0].timestamp).toBe('number');
  });

  it('only notifies matching event type subscribers', () => {
    const editHandler = vi.fn();
    const pasteHandler = vi.fn();
    subscribe('edit', editHandler);
    subscribe('paste', pasteHandler);

    emit('edit');

    expect(editHandler).toHaveBeenCalledOnce();
    expect(pasteHandler).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers per event type', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    subscribe('paste', h1);
    subscribe('paste', h2);

    emit('paste');

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('returns unsubscribe function', () => {
    const handler = vi.fn();
    const unsubscribe = subscribe('delete', handler);

    emit('delete');
    expect(handler).toHaveBeenCalledOnce();

    unsubscribe();
    emit('delete');
    expect(handler).toHaveBeenCalledOnce(); // not called again
  });

  it('buffers events', () => {
    emit('edit');
    emit('paste');
    emit('scroll');

    expect(getBufferedEvents()).toHaveLength(3);
  });

  it('flushBuffer returns and clears buffered events', () => {
    emit('edit');
    emit('paste');

    const flushed = flushBuffer();
    expect(flushed).toHaveLength(2);
    expect(getBufferedEvents()).toHaveLength(0);
  });

  it('includes timestamps on all events', () => {
    const now = Date.now();
    emit('edit');
    const events = getBufferedEvents();
    expect(events[0].timestamp).toBeGreaterThanOrEqual(now);
  });

  it('all event types can be emitted', () => {
    const types = [
      'edit',
      'paste',
      'delete',
      'scroll',
      'active_time',
      'tab_switch',
      'ai_usage',
      'branch_create',
      'branch_resize',
    ] as const;
    for (const type of types) {
      expect(() => emit(type)).not.toThrow();
    }
    expect(getBufferedEvents()).toHaveLength(types.length);
  });
});
