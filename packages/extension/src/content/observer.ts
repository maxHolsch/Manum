// MutationObserver that watches Claude.ai's conversation container for new
// assistant messages. Handles SPA navigation by re-attaching when the container
// is replaced.

import { getConversationContainer, isAssistantMessage } from './selectors.js';

export type AssistantMessageCallback = (element: Element) => void;

interface ObserverState {
  /** Observer watching the conversation container for new messages. */
  contentObserver: MutationObserver | null;
  /** Observer watching the document body for container replacement (SPA nav). */
  rootObserver: MutationObserver | null;
  /** Currently observed container element. */
  container: Element | null;
}

const state: ObserverState = {
  contentObserver: null,
  rootObserver: null,
  container: null,
};

/**
 * Attaches a MutationObserver to the conversation container.
 * Calls `onNewMessage` each time a new assistant message element is added.
 * Also installs a root observer to handle SPA navigation (container replacement).
 */
export function startObserver(onNewMessage: AssistantMessageCallback): void {
  attachContentObserver(onNewMessage);
  attachRootObserver(onNewMessage);
}

/** Disconnects both observers and clears state. */
export function stopObserver(): void {
  state.contentObserver?.disconnect();
  state.rootObserver?.disconnect();
  state.contentObserver = null;
  state.rootObserver = null;
  state.container = null;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function attachContentObserver(onNewMessage: AssistantMessageCallback): void {
  const container = getConversationContainer();
  if (!container) {
    console.debug('[Manum] Conversation container not found — will retry via root observer');
    return;
  }

  if (state.contentObserver) {
    state.contentObserver.disconnect();
  }

  state.container = container;
  state.contentObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') continue;
      for (const node of Array.from(mutation.addedNodes)) {
        if (!(node instanceof Element)) continue;
        // Check if the added node itself is an assistant message
        if (isAssistantMessage(node)) {
          onNewMessage(node);
          continue;
        }
        // Check descendants (Claude may wrap the turn in a container div)
        const nested = node.querySelectorAll('[data-message-author-role="assistant"]');
        for (const el of Array.from(nested)) {
          onNewMessage(el);
        }
      }
    }
  });

  state.contentObserver.observe(container, { childList: true, subtree: true });
  console.debug('[Manum] Content observer attached to', container);
}

function attachRootObserver(onNewMessage: AssistantMessageCallback): void {
  if (state.rootObserver) {
    state.rootObserver.disconnect();
  }

  state.rootObserver = new MutationObserver(() => {
    const currentContainer = getConversationContainer();
    if (currentContainer && currentContainer !== state.container) {
      console.debug('[Manum] Conversation container replaced — re-attaching content observer');
      attachContentObserver(onNewMessage);
    }
  });

  state.rootObserver.observe(document.body, { childList: true, subtree: true });
}
