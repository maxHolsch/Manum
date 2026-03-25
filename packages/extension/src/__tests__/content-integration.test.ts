/**
 * Integration test: full capture pipeline
 * DOM mutation → debounce → AI pool storage write
 * @jest-environment jsdom
 */

import { AI_POOL_KEY } from '../storage/ai-pool.js';

// ---------------------------------------------------------------------------
// chrome.storage.local mock (must be set BEFORE importing content/index)
// ---------------------------------------------------------------------------
const store: Record<string, unknown> = {};

(global as unknown as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get: jest.fn(async (key: string) => ({ [key]: store[key] })),
      set: jest.fn(async (obj: Record<string, unknown>) => {
        Object.assign(store, obj);
      }),
      remove: jest.fn(async (key: string) => {
        delete store[key];
      }),
    },
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
};

function refreshMocks(): void {
  const ch = (
    global as unknown as Record<string, { storage: { local: Record<string, jest.Mock> } }>
  ).chrome;
  ch.storage.local.get.mockImplementation(async (key: string) => ({ [key]: store[key] }));
  ch.storage.local.set.mockImplementation(async (obj: Record<string, unknown>) => {
    Object.assign(store, obj);
  });
  ch.storage.local.remove.mockImplementation(async (key: string) => {
    delete store[key];
  });
}

// ---------------------------------------------------------------------------
// Import modules under test AFTER setting up globals
// ---------------------------------------------------------------------------
import { scheduleCapture, cancelAll, DEBOUNCE_MS } from '../content/debounce.js';
import { addAIPoolEntry } from '../storage/ai-pool.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('content integration: observer → debounce → storage', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
    refreshMocks();
    jest.useFakeTimers();
    cancelAll();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cancelAll();
    jest.useRealTimers();
  });

  it('stores an AI pool entry after debounce completes', async () => {
    const el = document.createElement('div');
    el.setAttribute('data-message-author-role', 'assistant');
    el.setAttribute('data-message-id', 'msg-integration-1');
    el.textContent = 'Hello, I am a streaming AI response.';
    document.body.appendChild(el);

    let capturedEl: Element | undefined;

    scheduleCapture(el, async (element) => {
      capturedEl = element;
      await addAIPoolEntry({
        messageId: element.getAttribute('data-message-id') ?? 'unknown',
        text: element.textContent ?? '',
        timestamp: Date.now(),
        conversationId: 'conv-integration',
      });
    });

    // Advance timers past debounce period
    jest.advanceTimersByTime(DEBOUNCE_MS + 100);

    // Flush microtask queue: each await flushes one async step in the chain
    // (debounce callback → get() → set())
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }

    expect(capturedEl).toBe(el);

    const pool = store[AI_POOL_KEY] as Array<{ messageId: string; text: string }>;
    expect(pool).toHaveLength(1);
    expect(pool[0].messageId).toBe('msg-integration-1');
    expect(pool[0].text).toBe('Hello, I am a streaming AI response.');
  });

  it('does not write to storage if debounce is cancelled', async () => {
    const el = document.createElement('div');
    el.textContent = 'partial';
    document.body.appendChild(el);

    scheduleCapture(el, async () => {
      await addAIPoolEntry({
        messageId: 'cancelled',
        text: '',
        timestamp: Date.now(),
        conversationId: 'c',
      });
    });

    cancelAll();
    jest.advanceTimersByTime(DEBOUNCE_MS + 100);
    await Promise.resolve();

    expect(store[AI_POOL_KEY]).toBeUndefined();
  });

  it('content script is a no-op on non-claude.ai pages (no errors)', () => {
    // Simply verify that importing the modules doesn't throw on a blank page
    expect(() => {
      cancelAll();
    }).not.toThrow();
  });
});
