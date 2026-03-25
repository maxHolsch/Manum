/**
 * Tests for copy event listener.
 * @jest-environment jsdom
 */

import { startCopyListener, stopCopyListener } from '../content/copy-listener.js';

// ---------------------------------------------------------------------------
// Helpers to set up mock DOM and fire copy events
// ---------------------------------------------------------------------------

function setupDOM(html: string): void {
  document.body.innerHTML = html;
}

function fireCopyEvent(selectedText: string, anchorNode: Node): void {
  // Mock window.getSelection
  const mockSelection = {
    toString: () => selectedText,
    anchorNode,
  };
  jest.spyOn(window, 'getSelection').mockReturnValue(mockSelection as unknown as Selection);

  document.dispatchEvent(new Event('copy'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('copy-listener', () => {
  beforeEach(() => {
    stopCopyListener();
    setupDOM(`
      <div data-testid="conversation-turn-1">
        <div data-message-author-role="assistant" data-message-id="msg-abc">
          <div class="prose">Assistant response text here.</div>
        </div>
      </div>
      <div data-testid="conversation-turn-2">
        <div data-message-author-role="human">
          <div class="prose">User message</div>
        </div>
      </div>
    `);
    jest.restoreAllMocks();
  });

  afterEach(() => {
    stopCopyListener();
    jest.restoreAllMocks();
  });

  it('calls handler when text is copied from an assistant message', () => {
    const handler = jest.fn();
    startCopyListener(handler);

    const proseEl = document.querySelector('[data-message-author-role="assistant"] .prose')!;
    fireCopyEvent('Assistant response text', proseEl);

    expect(handler).toHaveBeenCalledTimes(1);
    const record = handler.mock.calls[0][0];
    expect(record.selectedText).toBe('Assistant response text');
    expect(record.sourceMessageId).toBe('msg-abc');
    expect(record.timestamp).toBeGreaterThan(0);
  });

  it('does not call handler for copies from human messages', () => {
    const handler = jest.fn();
    startCopyListener(handler);

    const humanEl = document.querySelector('[data-message-author-role="human"] .prose')!;
    fireCopyEvent('User message', humanEl);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call handler when selection is empty', () => {
    const handler = jest.fn();
    startCopyListener(handler);

    const proseEl = document.querySelector('[data-message-author-role="assistant"] .prose')!;
    fireCopyEvent('', proseEl);

    expect(handler).not.toHaveBeenCalled();
  });

  it('stopCopyListener removes event listener', () => {
    const handler = jest.fn();
    startCopyListener(handler);
    stopCopyListener();

    const proseEl = document.querySelector('[data-message-author-role="assistant"] .prose')!;
    fireCopyEvent('Some text', proseEl);

    expect(handler).not.toHaveBeenCalled();
  });

  it('record does not have id field (partial record)', () => {
    const handler = jest.fn();
    startCopyListener(handler);

    const proseEl = document.querySelector('[data-message-author-role="assistant"] .prose')!;
    fireCopyEvent('text', proseEl);

    const record = handler.mock.calls[0][0];
    expect(record).not.toHaveProperty('id');
  });
});
