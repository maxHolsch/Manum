/**
 * Tests for DOM selector module.
 * @jest-environment jsdom
 */

import {
  getConversationContainer,
  getAssistantMessages,
  isAssistantMessage,
  getMessageText,
  getMessageId,
} from '../content/selectors.js';

function setupDOM(html: string): void {
  document.body.innerHTML = html;
}

// Mock Claude.ai DOM structure (version 1)
const MOCK_CONVERSATION_HTML = `
<div data-testid="conversation-turn-0">
  <div role="presentation">
    <div data-message-author-role="human">
      <div class="prose">Hello Claude</div>
    </div>
  </div>
</div>
<div data-testid="conversation-turn-1">
  <div role="presentation">
    <div data-message-author-role="assistant" data-message-id="msg-abc123">
      <div class="prose">Here is my response with some helpful information.</div>
    </div>
  </div>
</div>
<div data-testid="conversation-turn-2">
  <div role="presentation">
    <div data-message-author-role="human">
      <div class="prose">Follow-up question</div>
    </div>
  </div>
</div>
<div data-testid="conversation-turn-3">
  <div role="presentation">
    <div data-message-author-role="assistant">
      <div class="prose">Second assistant response here.</div>
    </div>
  </div>
</div>
`;

describe('selectors', () => {
  beforeEach(() => {
    setupDOM(MOCK_CONVERSATION_HTML);
  });

  describe('getConversationContainer', () => {
    it('returns the parent of the first conversation turn', () => {
      const container = getConversationContainer();
      expect(container).not.toBeNull();
    });

    it('returns null when no conversation elements exist', () => {
      setupDOM('<div></div>');
      const container = getConversationContainer();
      expect(container).toBeNull();
    });
  });

  describe('getAssistantMessages', () => {
    it('returns all assistant message elements', () => {
      const messages = getAssistantMessages();
      expect(messages.length).toBe(2);
    });

    it('returns empty list when no assistant messages', () => {
      setupDOM('<div data-message-author-role="human">only human</div>');
      const messages = getAssistantMessages();
      expect(messages.length).toBe(0);
    });
  });

  describe('isAssistantMessage', () => {
    it('returns true for direct assistant element', () => {
      const el = document.querySelector('[data-message-author-role="assistant"]')!;
      expect(isAssistantMessage(el)).toBe(true);
    });

    it('returns true for a child of an assistant element', () => {
      const el = document.querySelector('[data-message-author-role="assistant"] .prose')!;
      expect(isAssistantMessage(el)).toBe(true);
    });

    it('returns false for a human message element', () => {
      const el = document.querySelector('[data-message-author-role="human"]')!;
      expect(isAssistantMessage(el)).toBe(false);
    });
  });

  describe('getMessageText', () => {
    it('returns text content from prose container when present', () => {
      const el = document.querySelector('[data-message-author-role="assistant"]')!;
      const text = getMessageText(el);
      expect(text).toBe('Here is my response with some helpful information.');
    });

    it('returns trimmed text content', () => {
      const el = document.querySelector('[data-message-author-role="assistant"]')!;
      const text = getMessageText(el);
      expect(text).not.toMatch(/^\s/);
      expect(text).not.toMatch(/\s$/);
    });
  });

  describe('getMessageId', () => {
    it('returns data-message-id when present', () => {
      const el = document.querySelector('[data-message-id="msg-abc123"]')!;
      expect(getMessageId(el)).toBe('msg-abc123');
    });

    it('returns conversation-turn testid when no message-id', () => {
      const turn3 = document.querySelector('[data-testid="conversation-turn-3"]')!;
      const el = turn3.querySelector('[data-message-author-role="assistant"]')!;
      const id = getMessageId(el);
      expect(id).toBe('conversation-turn-3');
    });
  });
});
