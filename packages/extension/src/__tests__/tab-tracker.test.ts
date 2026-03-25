/**
 * Tests for tab focus tracking.
 */

import { classifyTab, recordTabEvent, TAB_EVENTS_KEY } from '../background/tab-tracker.js';
import type { TabEvent } from '@manum/shared';

// ---------------------------------------------------------------------------
// chrome.storage.local mock
// ---------------------------------------------------------------------------
const store: Record<string, unknown> = {};

(global as unknown as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get: jest.fn(async (key: string) => ({ [key]: store[key] })),
      set: jest.fn(async (obj: Record<string, unknown>) => {
        Object.assign(store, obj);
      }),
    },
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
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('classifyTab', () => {
  it('classifies chrome-extension:// URLs as editor', () => {
    expect(classifyTab('chrome-extension://abcdef/index.html')).toBe('editor');
  });

  it('classifies claude.ai URLs as claude', () => {
    expect(classifyTab('https://claude.ai/chat/abc123')).toBe('claude');
  });

  it('classifies other URLs as other', () => {
    expect(classifyTab('https://github.com')).toBe('other');
    expect(classifyTab('https://google.com')).toBe('other');
    expect(classifyTab('')).toBe('other');
  });
});

describe('recordTabEvent', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    jest.clearAllMocks();
    refreshMocks();
  });

  it('stores a tab event', async () => {
    const event: TabEvent = { tabType: 'claude', timestamp: Date.now(), url: 'https://claude.ai' };
    await recordTabEvent(event);

    const result = store[TAB_EVENTS_KEY] as TabEvent[];
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(event);
  });

  it('appends multiple events', async () => {
    const e1: TabEvent = { tabType: 'claude', timestamp: 1000, url: 'https://claude.ai' };
    const e2: TabEvent = { tabType: 'other', timestamp: 2000, url: 'https://example.com' };
    await recordTabEvent(e1);
    await recordTabEvent(e2);

    const result = store[TAB_EVENTS_KEY] as TabEvent[];
    expect(result).toHaveLength(2);
  });

  it('stored events under the correct key', async () => {
    const event: TabEvent = {
      tabType: 'editor',
      timestamp: Date.now(),
      url: 'chrome-extension://x',
    };
    await recordTabEvent(event);
    expect(store).toHaveProperty(TAB_EVENTS_KEY);
  });
});
