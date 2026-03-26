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

  it('calls callback when an assistant message finishes streaming', async () => {
    // Set up conversation container with an existing AI message
    document.body.innerHTML = `
      <div data-is-streaming="false">Previous response</div>
    `;

    const callback = jest.fn();
    startObserver(callback);

    // callback is called once for the existing completed message
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    // Simulate Claude.ai adding a new streaming message that completes
    const msg = document.createElement('div');
    msg.setAttribute('data-is-streaming', 'false');
    msg.textContent = 'Hello, I am Claude.';
    document.body.appendChild(msg);

    // Allow microtask queue to flush
    await new Promise((r) => setTimeout(r, 0));

    expect(callback).toHaveBeenCalledWith(msg);
  });

  it('does not call callback for human messages', async () => {
    document.body.innerHTML = `<div data-is-streaming="false">AI msg</div>`;

    const callback = jest.fn();
    startObserver(callback);
    callback.mockClear();

    const msg = document.createElement('div');
    msg.setAttribute('data-testid', 'user-message');
    msg.textContent = 'User input';
    document.body.appendChild(msg);

    await new Promise((r) => setTimeout(r, 0));

    expect(callback).not.toHaveBeenCalled();
  });

  it('re-attaches observer when conversation container is replaced (SPA navigation)', async () => {
    document.body.innerHTML = `<div data-is-streaming="false">First convo</div>`;

    const callback = jest.fn();
    startObserver(callback);
    callback.mockClear();

    // Simulate SPA navigation: remove old container and add new one
    document.body.innerHTML = '';
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);

    await new Promise((r) => setTimeout(r, 0));

    // Now add an assistant message in the new container
    const msg = document.createElement('div');
    msg.setAttribute('data-is-streaming', 'false');
    msg.textContent = 'Response after navigation';
    wrapper.appendChild(msg);

    await new Promise((r) => setTimeout(r, 0));

    expect(callback).toHaveBeenCalledWith(msg);
  });

  it('stopObserver disconnects cleanly', async () => {
    document.body.innerHTML = `<div data-is-streaming="false">AI msg</div>`;

    const callback = jest.fn();
    startObserver(callback);
    callback.mockClear();
    stopObserver();

    // Mutation after stop should not trigger callback
    const msg = document.createElement('div');
    msg.setAttribute('data-is-streaming', 'false');
    document.body.appendChild(msg);

    await new Promise((r) => setTimeout(r, 0));

    expect(callback).not.toHaveBeenCalled();
  });
});
