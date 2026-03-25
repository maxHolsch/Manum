/**
 * Tests for clipboard access via offscreen document.
 */

// ---------------------------------------------------------------------------
// chrome mock — set up before importing clipboard module
// ---------------------------------------------------------------------------

let createDocumentMock: jest.Mock;
let closeDocumentMock: jest.Mock;
let sendMessageMock: jest.Mock;

function resetChromeMock(clipboardResponse: {
  success: boolean;
  text?: string;
  error?: string;
}): void {
  createDocumentMock = jest.fn().mockResolvedValue(undefined);
  closeDocumentMock = jest.fn().mockResolvedValue(undefined);

  // Call the callback synchronously so we don't need fake timers
  sendMessageMock = jest.fn((_msg: unknown, callback: (resp: unknown) => void) => {
    callback(clipboardResponse);
    return undefined;
  });

  (global as unknown as Record<string, unknown>).chrome = {
    runtime: {
      getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
      sendMessage: sendMessageMock,
      lastError: null,
    },
    offscreen: {
      createDocument: createDocumentMock,
      closeDocument: closeDocumentMock,
      Reason: { CLIPBOARD: 'CLIPBOARD' },
    },
  };
}

// ---------------------------------------------------------------------------
// Import after mock setup
// ---------------------------------------------------------------------------

// We need to re-import clipboard each test to reset offscreenOpen state.
// Use jest.isolateModules for that.

describe('clipboard', () => {
  it('returns clipboard text on success', async () => {
    resetChromeMock({ success: true, text: 'pasted content' });
    const { readClipboard } = await import('../background/clipboard.js');
    const text = await readClipboard();
    expect(text).toBe('pasted content');
    expect(createDocumentMock).toHaveBeenCalled();
  });

  it('rejects on clipboard error', async () => {
    resetChromeMock({ success: false, error: 'Permission denied' });
    const { readClipboard } = await import('../background/clipboard.js');
    await expect(readClipboard()).rejects.toThrow('Permission denied');
  });

  it('creates offscreen document with CLIPBOARD reason', async () => {
    resetChromeMock({ success: true, text: 'text' });
    const { readClipboard } = await import('../background/clipboard.js');
    await readClipboard();
    expect(createDocumentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reasons: expect.arrayContaining(['CLIPBOARD']),
      }),
    );
  });

  it('closes offscreen document after reading', async () => {
    resetChromeMock({ success: true, text: 'text' });
    const { readClipboard } = await import('../background/clipboard.js');
    await readClipboard();
    expect(closeDocumentMock).toHaveBeenCalled();
  });

  it('handles already-open offscreen document gracefully', async () => {
    resetChromeMock({ success: true, text: 'text' });
    createDocumentMock.mockRejectedValueOnce(new Error('Document already open'));
    const { readClipboard } = await import('../background/clipboard.js');
    const text = await readClipboard();
    expect(text).toBe('text');
  });
});
