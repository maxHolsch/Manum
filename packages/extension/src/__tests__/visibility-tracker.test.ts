/**
 * Tests for visibility change tracking.
 * @jest-environment jsdom
 */

import { startVisibilityTracker, stopVisibilityTracker } from '../content/visibility-tracker.js';

describe('visibility-tracker', () => {
  let sendMessageMock: jest.Mock;

  beforeEach(() => {
    stopVisibilityTracker();
    sendMessageMock = jest.fn().mockResolvedValue(undefined);
    (global as unknown as Record<string, unknown>).chrome = {
      runtime: {
        sendMessage: sendMessageMock,
      },
    };
  });

  afterEach(() => {
    stopVisibilityTracker();
  });

  it('sends a TAB_VISIBILITY_CHANGE message on visibilitychange event', () => {
    startVisibilityTracker();

    // Simulate becoming hidden
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(sendMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'TAB_VISIBILITY_CHANGE',
        visible: false,
        url: expect.any(String),
        timestamp: expect.any(Number),
      }),
    );
  });

  it('sends visible: true when document becomes visible', () => {
    startVisibilityTracker();

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(sendMessageMock).toHaveBeenCalledWith(expect.objectContaining({ visible: true }));
  });

  it('stopVisibilityTracker removes listener', () => {
    startVisibilityTracker();
    stopVisibilityTracker();

    document.dispatchEvent(new Event('visibilitychange'));
    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});
