// Tab focus tracking for the service worker.
// Records tab activation events and visibility changes as TabEvent entries.

import type { TabEvent } from '@manum/shared';

export const TAB_EVENTS_KEY = 'manum_tab_events';

/** Classify a URL into editor / claude / other. */
export function classifyTab(url: string): TabEvent['tabType'] {
  if (url.startsWith('chrome-extension://')) return 'editor';
  if (url.includes('claude.ai')) return 'claude';
  return 'other';
}

/**
 * Appends a TabEvent to chrome.storage.local.
 */
export async function recordTabEvent(event: TabEvent): Promise<void> {
  const result = await chrome.storage.local.get(TAB_EVENTS_KEY);
  const events: TabEvent[] = (result[TAB_EVENTS_KEY] as TabEvent[] | undefined) ?? [];
  events.push(event);
  await chrome.storage.local.set({ [TAB_EVENTS_KEY]: events });
  console.debug('[Manum] Tab event recorded', event.tabType, event.url);
}

/**
 * Registers the chrome.tabs.onActivated listener.
 * Must be called at the top level of the service worker (not inside async callbacks)
 * so it survives service worker restarts.
 */
export function startTabTracker(): void {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (chrome.runtime.lastError) {
        // Tab may have been closed before we could read it
        return;
      }
      const url = tab.url ?? tab.pendingUrl ?? '';
      const event: TabEvent = {
        tabType: classifyTab(url),
        timestamp: Date.now(),
        url,
      };
      recordTabEvent(event).catch((err: unknown) => {
        console.error('[Manum] Failed to record tab event', err);
      });
    });
  });

  // Handle visibility change messages from content scripts
  chrome.runtime.onMessage.addListener(
    (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void,
    ) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        (message as Record<string, unknown>)['type'] === 'TAB_VISIBILITY_CHANGE'
      ) {
        const msg = message as { type: string; visible: boolean; url: string; timestamp: number };
        const event: TabEvent = {
          tabType: classifyTab(msg.url),
          timestamp: msg.timestamp,
          url: msg.url,
        };
        recordTabEvent(event).catch((err: unknown) => {
          console.error('[Manum] Failed to record visibility event', err);
        });
      }
    },
  );
}
