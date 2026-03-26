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

// Mock Claude.ai DOM structure (2026 — uses data-is-streaming for AI messages)
const MOCK_CONVERSATION_HTML = `
<div data-testid="user-message">
  <div class="prose">Hello Claude</div>
</div>
<div data-is-streaming="false" data-message-id="msg-abc123">
  <div class="prose">Here is my response with some helpful information.</div>
</div>
<div data-testid="user-message">
  <div class="prose">Follow-up question</div>
</div>
<div data-is-streaming="false">
  <div class="prose">Second assistant response here.</div>
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

    it('falls back to document.body when no AI messages exist', () => {
      setupDOM('<div></div>');
      const container = getConversationContainer();
      expect(container).toBe(document.body);
    });
  });

  describe('getAssistantMessages', () => {
    it('returns all assistant message elements', () => {
      const messages = getAssistantMessages();
      expect(messages.length).toBe(2);
    });

    it('returns empty list when no assistant messages', () => {
      setupDOM('<div data-testid="user-message">only human</div>');
      const messages = getAssistantMessages();
      expect(messages.length).toBe(0);
    });
  });

  describe('isAssistantMessage', () => {
    it('returns true for direct assistant element', () => {
      const el = document.querySelector('[data-is-streaming]')!;
      expect(isAssistantMessage(el)).toBe(true);
    });

    it('returns true for a child of an assistant element', () => {
      const el = document.querySelector('[data-is-streaming] .prose')!;
      expect(isAssistantMessage(el)).toBe(true);
    });

    it('returns false for a human message element', () => {
      const el = document.querySelector('[data-testid="user-message"]')!;
      expect(isAssistantMessage(el)).toBe(false);
    });
  });

  describe('getMessageText', () => {
    it('returns text content from prose container when present', () => {
      const el = document.querySelector('[data-is-streaming]')!;
      const text = getMessageText(el);
      expect(text).toBe('Here is my response with some helpful information.');
    });

    it('returns trimmed text content', () => {
      const el = document.querySelector('[data-is-streaming]')!;
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

    it('returns positional fallback when no message-id', () => {
      const messages = document.querySelectorAll('[data-is-streaming]');
      // Second message has no data-message-id
      const el = messages[1];
      const id = getMessageId(el);
      expect(id).toBe('assistant-1');
    });
  });
});
