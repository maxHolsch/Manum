/**
 * Tests for streaming debounce logic.
 * Uses fake timers to simulate token-by-token streaming.
 * @jest-environment jsdom
 */

import { scheduleCapture, cancelAll, pendingCount, DEBOUNCE_MS } from '../content/debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    cancelAll();
  });

  afterEach(() => {
    cancelAll();
    jest.useRealTimers();
  });

  function makeElement(text = ''): Element {
    const el = document.createElement('div');
    el.setAttribute('data-message-author-role', 'assistant');
    el.textContent = text;
    return el;
  }

  it('fires capture callback after debounce period with no mutations', () => {
    const el = makeElement('Hello world');
    const callback = jest.fn();

    scheduleCapture(el, callback);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(DEBOUNCE_MS);
    expect(callback).toHaveBeenCalledWith(el);
  });

  it('resets timer on each call (debounces rapid mutations)', () => {
    const el = makeElement('Token 1');
    const callback = jest.fn();

    // Simulate token-by-token streaming
    scheduleCapture(el, callback);
    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    el.textContent = 'Token 1 Token 2';
    scheduleCapture(el, callback);
    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled(); // still within debounce window

    el.textContent = 'Token 1 Token 2 Token 3';
    scheduleCapture(el, callback);
    jest.advanceTimersByTime(DEBOUNCE_MS);

    // Should only fire once
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(el);
  });

  it('fires separately for multiple concurrent streaming messages', () => {
    const el1 = makeElement('Message A');
    const el2 = makeElement('Message B');
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    scheduleCapture(el1, callback1);
    scheduleCapture(el2, callback2);

    jest.advanceTimersByTime(DEBOUNCE_MS);

    expect(callback1).toHaveBeenCalledWith(el1);
    expect(callback2).toHaveBeenCalledWith(el2);
  });

  it('cancelAll stops pending timers', () => {
    const el = makeElement('Partial message');
    const callback = jest.fn();

    scheduleCapture(el, callback);
    expect(pendingCount()).toBe(1);

    cancelAll();
    jest.advanceTimersByTime(DEBOUNCE_MS * 2);

    expect(callback).not.toHaveBeenCalled();
    expect(pendingCount()).toBe(0);
  });

  it('capture fires within 2s of completion', () => {
    const el = makeElement('Final message');
    const callback = jest.fn();

    scheduleCapture(el, callback);
    // Advance exactly DEBOUNCE_MS — should have fired
    jest.advanceTimersByTime(DEBOUNCE_MS);
    expect(callback).toHaveBeenCalled();
    // DEBOUNCE_MS (1000ms) is well within the 2s window
  });
});
