/**
 * Tests for MutationObserver-based AI response detection.
 * @jest-environment jsdom
 */

import { startObserver, stopObserver } from '../content/observer.js';

describe('observer', () => {
  beforeEach(() => {
    stopObserver();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    stopObserver();
  });

  it('calls callback when an assistant message is added to the container', async () => {
    // Set up conversation container
    document.body.innerHTML = `
      <div data-testid="conversation-turn-0">
        <div data-message-author-role="human">Hello</div>
      </div>
    `;

    const callback = jest.fn();
    startObserver(callback);

    // Simulate Claude.ai adding an assistant message turn
    const turn = document.createElement('div');
    turn.setAttribute('data-testid', 'conversation-turn-1');
    const msg = document.createElement('div');
    msg.setAttribute('data-message-author-role', 'assistant');
    msg.textContent = 'Hello, I am Claude.';
    turn.appendChild(msg);
    document.body.appendChild(turn);

    // Allow microtask queue to flush
    await new Promise((r) => setTimeout(r, 0));

    expect(callback).toHaveBeenCalledWith(msg);
  });

  it('does not call callback for human messages', async () => {
    document.body.innerHTML = `<div data-testid="conversation-turn-0"></div>`;

    const callback = jest.fn();
    startObserver(callback);

    const turn = document.createElement('div');
    const msg = document.createElement('div');
    msg.setAttribute('data-message-author-role', 'human');
    msg.textContent = 'User input';
    turn.appendChild(msg);
    document.body.appendChild(turn);

    await new Promise((r) => setTimeout(r, 0));

    expect(callback).not.toHaveBeenCalled();
  });

  it('re-attaches observer when conversation container is replaced (SPA navigation)', async () => {
    document.body.innerHTML = `<div data-testid="conversation-turn-0"></div>`;

    const callback = jest.fn();
    startObserver(callback);

    // Simulate SPA navigation: remove old container and add new one
    document.body.innerHTML = '';
    const newTurn = document.createElement('div');
    newTurn.setAttribute('data-testid', 'conversation-turn-0');
    document.body.appendChild(newTurn);

    await new Promise((r) => setTimeout(r, 0));

    // Now add an assistant message in the new container
    const msg = document.createElement('div');
    msg.setAttribute('data-message-author-role', 'assistant');
    msg.textContent = 'Response after navigation';
    newTurn.appendChild(msg);

    await new Promise((r) => setTimeout(r, 0));

    expect(callback).toHaveBeenCalledWith(msg);
  });

  it('stopObserver disconnects cleanly', async () => {
    document.body.innerHTML = `<div data-testid="conversation-turn-0"></div>`;

    const callback = jest.fn();
    startObserver(callback);
    stopObserver();

    // Mutation after stop should not trigger callback
    const msg = document.createElement('div');
    msg.setAttribute('data-message-author-role', 'assistant');
    document.body.appendChild(msg);

    await new Promise((r) => setTimeout(r, 0));

    expect(callback).not.toHaveBeenCalled();
  });
});
