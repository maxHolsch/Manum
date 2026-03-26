// DOM selector module for Claude.ai conversation UI
// This is the single point of change when Claude.ai updates their DOM structure.
//
// Claude.ai DOM structure (as of early 2026):
//   AI messages:   <div data-is-streaming="false"> ... </div>
//   User messages: <div data-testid="user-message"> ... </div>
//
// Previous structure (pre-2026) used data-message-author-role="assistant"
// and data-testid="conversation-turn-N" — these no longer exist.

/**
 * Returns the conversation container to observe.
 * Falls back to document.body so the root observer always has something to watch.
 */
export function getConversationContainer(): Element | null {
  // Use the parent of the first AI message if present
  const firstMsg = document.querySelector('[data-is-streaming]');
  if (firstMsg?.parentElement) return firstMsg.parentElement;
  // Fallback: observe the whole body
  return document.body;
}

/**
 * Returns all current assistant message elements within the document.
 */
export function getAssistantMessages(): NodeListOf<Element> {
  return document.querySelectorAll('[data-is-streaming]');
}

/**
 * Returns true if the given element is (or is contained within) an assistant message.
 */
export function isAssistantMessage(element: Element): boolean {
  if (element.hasAttribute('data-is-streaming')) return true;
  return element.closest('[data-is-streaming]') !== null;
}

/**
 * Returns the full text content of a message element.
 */
export function getMessageText(element: Element): string {
  return (element.textContent ?? '').trim();
}

/**
 * Returns a stable ID for a message element.
 */
export function getMessageId(element: Element): string {
  // Use explicit message ID if present
  const explicit = element.getAttribute('data-message-id');
  if (explicit) return explicit;

  // Fall back to position index among all AI messages
  const messages = Array.from(document.querySelectorAll('[data-is-streaming]'));
  const idx = messages.indexOf(element);
  return idx >= 0 ? `assistant-${idx}` : `assistant-unknown-${Date.now()}`;
}
