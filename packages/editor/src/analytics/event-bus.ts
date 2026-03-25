/**
 * T167: Behavioral analytics event bus
 */

export type AnalyticsEventType =
  | 'edit'
  | 'paste'
  | 'delete'
  | 'scroll'
  | 'active_time'
  | 'tab_switch'
  | 'ai_usage'
  | 'branch_create'
  | 'branch_resize';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  payload?: Record<string, unknown>;
}

type Handler = (event: AnalyticsEvent) => void;

const subscribers = new Map<AnalyticsEventType, Set<Handler>>();
const buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 30_000; // 30 seconds

export function subscribe(type: AnalyticsEventType, handler: Handler): () => void {
  if (!subscribers.has(type)) {
    subscribers.set(type, new Set());
  }
  subscribers.get(type)!.add(handler);
  return () => {
    subscribers.get(type)?.delete(handler);
  };
}

export function emit(type: AnalyticsEventType, payload?: Record<string, unknown>): void {
  const event: AnalyticsEvent = { type, timestamp: Date.now(), payload };
  buffer.push(event);

  // Notify subscribers
  const handlers = subscribers.get(type);
  if (handlers) {
    for (const handler of handlers) {
      try {
        handler(event);
      } catch {
        // Swallow subscriber errors
      }
    }
  }

  scheduleFlush();
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushBuffer();
  }, FLUSH_INTERVAL);
}

export function flushBuffer(): AnalyticsEvent[] {
  const events = buffer.splice(0);
  flushTimer = null;
  return events;
}

export function getBufferedEvents(): readonly AnalyticsEvent[] {
  return buffer;
}

/** Reset for testing */
export function resetEventBus(): void {
  buffer.splice(0);
  subscribers.clear();
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
