// DOM selector module for Claude.ai conversation UI
// This is the single point of change when Claude.ai updates their DOM structure.
//
// Claude.ai DOM structure (as of early 2025):
//   <div data-testid="conversation-turn-N" ...>
//     <div [role="presentation"] ...>
//       <div data-message-author-role="assistant" ...>  ← assistant message
//         <div class="..." ...>
//           ... rendered markdown content ...
//         </div>
//       </div>
//       <div data-message-author-role="human" ...>     ← user message
//         ...
//       </div>
//     </div>
//   </div>

/**
 * Returns the top-level conversation container element, or null if not found.
 * Uses `[data-testid="conversation-turn-0"]` parent, or falls back to
 * `[role="main"]` which wraps the chat.
 */
export function getConversationContainer(): Element | null {
  // Primary: the scrollable thread container
  const primary = document.querySelector('[data-testid^="conversation-turn-"]');
  if (primary) {
    return primary.parentElement ?? primary;
  }
  // Fallback: main landmark
  return document.querySelector('[role="main"]');
}

/**
 * Returns all current assistant message elements within the document.
 * Targets `[data-message-author-role="assistant"]` — more stable than class names.
 */
export function getAssistantMessages(): NodeListOf<Element> {
  return document.querySelectorAll('[data-message-author-role="assistant"]');
}

/**
 * Returns true if the given element is (or is contained within) an assistant message.
 */
export function isAssistantMessage(element: Element): boolean {
  if (element.getAttribute('data-message-author-role') === 'assistant') {
    return true;
  }
  return element.closest('[data-message-author-role="assistant"]') !== null;
}

/**
 * Returns the full text content of a message element.
 * Prefers the innermost prose container to avoid capturing UI chrome.
 */
export function getMessageText(element: Element): string {
  // Look for a prose/content container first
  const prose = element.querySelector('.prose, [class*="prose"], [class*="message-content"]');
  const target = prose ?? element;
  return (target.textContent ?? '').trim();
}

/**
 * Returns a stable ID for a message element.
 * Uses `data-message-id` if present, falls back to constructing one from the
 * nearest `[data-testid="conversation-turn-N"]` ancestor index.
 */
export function getMessageId(element: Element): string {
  // Prefer explicit message ID attribute
  const explicit = element.getAttribute('data-message-id');
  if (explicit) return explicit;

  // Try the conversation-turn testid
  const turn = element.closest('[data-testid^="conversation-turn-"]');
  if (turn) {
    return turn.getAttribute('data-testid') ?? generateFallbackId(element);
  }

  return generateFallbackId(element);
}

/** Generates a fallback ID based on DOM position — not stable across navigations. */
function generateFallbackId(element: Element): string {
  const messages = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
  const idx = messages.indexOf(element);
  return idx >= 0 ? `assistant-${idx}` : `assistant-unknown-${Date.now()}`;
}
