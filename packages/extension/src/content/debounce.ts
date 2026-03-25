// Streaming debounce for AI message capture.
//
// Claude.ai streams tokens into the DOM incrementally. This module tracks
// each assistant message element's text length and fires a callback only
// after the text has stopped changing for DEBOUNCE_MS milliseconds.

export type CaptureCallback = (element: Element) => void;

/** How long (ms) text must be stable before capture fires. */
export const DEBOUNCE_MS = 1000;

// Map from message element → pending timer ID
const pendingTimers = new Map<Element, ReturnType<typeof setTimeout>>();

// Map from message element → last observed text length (for change detection)
const lastLengths = new Map<Element, number>();

/**
 * Called on every DOM mutation that touches a streaming assistant message.
 * Resets the debounce timer for that element.
 * When the timer fires, `onCapture` is called with the element.
 */
export function scheduleCapture(element: Element, onCapture: CaptureCallback): void {
  const currentLength = (element.textContent ?? '').length;

  // Cancel any existing timer for this element
  const existing = pendingTimers.get(element);
  if (existing !== undefined) {
    clearTimeout(existing);
  }

  lastLengths.set(element, currentLength);

  const timerId = setTimeout(() => {
    pendingTimers.delete(element);
    lastLengths.delete(element);
    onCapture(element);
  }, DEBOUNCE_MS);

  pendingTimers.set(element, timerId);
}

/**
 * Cancels all pending capture timers (e.g., on observer disconnect).
 */
export function cancelAll(): void {
  for (const timerId of pendingTimers.values()) {
    clearTimeout(timerId);
  }
  pendingTimers.clear();
  lastLengths.clear();
}

/**
 * Returns the number of pending timers (useful for testing).
 */
export function pendingCount(): number {
  return pendingTimers.size;
}
