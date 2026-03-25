// Content script for claude.ai pages
// Captures AI responses, copy events, and visibility changes

import { startObserver } from './observer.js';
import { scheduleCapture, cancelAll } from './debounce.js';
import { getMessageId, getMessageText } from './selectors.js';
import { addAIPoolEntry } from '../storage/ai-pool.js';
import { startCopyListener } from './copy-listener.js';
import { addCopyRecord } from '../storage/copy-records.js';
import { startVisibilityTracker } from './visibility-tracker.js';

console.debug('[Manum] Content script loaded on:', window.location.href);

// ---------------------------------------------------------------------------
// Pipeline: new assistant message → debounce → store
// ---------------------------------------------------------------------------

function onAssistantMessage(element: Element): void {
  scheduleCapture(element, async (el) => {
    const messageId = getMessageId(el);
    const text = getMessageText(el);

    if (!text) {
      console.debug('[Manum] Skipping empty message', messageId);
      return;
    }

    await addAIPoolEntry({
      messageId,
      text,
      timestamp: Date.now(),
      conversationId: getConversationId(),
    });

    console.debug('[Manum] Captured AI message', messageId, text.slice(0, 60));
  });
}

/** Extracts a conversation ID from the current URL. */
function getConversationId(): string {
  const match = window.location.pathname.match(/\/chat\/([^/]+)/);
  return match?.[1] ?? 'unknown';
}

// ---------------------------------------------------------------------------
// Copy event pipeline: copy → store
// ---------------------------------------------------------------------------

startCopyListener(async (record) => {
  await addCopyRecord(record);
  console.debug('[Manum] Copy recorded from', record.sourceMessageId);
});

// ---------------------------------------------------------------------------
// Visibility tracking
// ---------------------------------------------------------------------------

startVisibilityTracker();

// ---------------------------------------------------------------------------
// Observer start
// ---------------------------------------------------------------------------

function init(): void {
  startObserver(onAssistantMessage);
  console.debug('[Manum] Observer started');
}

// Handle both initial load and deferred DOM-ready scenarios
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on unload
window.addEventListener('unload', () => {
  cancelAll();
});
