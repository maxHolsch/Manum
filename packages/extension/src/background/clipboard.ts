// Clipboard access via offscreen document.
// Service workers cannot access the clipboard API directly — an offscreen
// document with the CLIPBOARD reason is used as a proxy.

/** True while the offscreen document is open. */
let offscreenOpen = false;

/**
 * Reads the current clipboard text content.
 * Creates the offscreen document on demand and cleans up after reading.
 *
 * @throws If clipboard access is denied or offscreen creation fails.
 */
export async function readClipboard(): Promise<string> {
  await ensureOffscreenDocument();

  return new Promise<string>((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'READ_CLIPBOARD' }, (response: unknown) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      const res = response as { success: boolean; text?: string; error?: string };
      if (res.success && res.text !== undefined) {
        resolve(res.text);
      } else {
        reject(new Error(res.error ?? 'Clipboard read failed'));
      }
    });
  }).finally(() => {
    closeOffscreenDocument().catch(() => {
      // Best-effort cleanup
    });
  });
}

async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenOpen) return;

  const offscreenHtmlUrl = chrome.runtime.getURL('offscreen/offscreen.html');

  try {
    await chrome.offscreen.createDocument({
      url: offscreenHtmlUrl,
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'Read clipboard content for Manum paste attribution',
    });
    offscreenOpen = true;
  } catch (err: unknown) {
    // Document may already exist (e.g., prior call didn't clean up)
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('already')) {
      throw err;
    }
    offscreenOpen = true;
  }
}

async function closeOffscreenDocument(): Promise<void> {
  if (!offscreenOpen) return;
  try {
    await chrome.offscreen.closeDocument();
  } finally {
    offscreenOpen = false;
  }
}
