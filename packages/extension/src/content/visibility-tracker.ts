// Visibility change tracker for Claude.ai content script.
// Sends document visibility events to the service worker for storage.

function handleVisibilityChange(): void {
  const message = {
    type: 'TAB_VISIBILITY_CHANGE',
    visible: !document.hidden,
    url: window.location.href,
    timestamp: Date.now(),
  };

  chrome.runtime.sendMessage(message).catch((err: unknown) => {
    // Service worker may not be active — this is non-critical
    console.debug('[Manum] Visibility message not delivered', err);
  });

  console.debug('[Manum] Visibility change:', message.visible ? 'visible' : 'hidden');
}

/**
 * Registers the visibilitychange listener on the document.
 */
export function startVisibilityTracker(): void {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  console.debug('[Manum] Visibility tracker registered');
}

/**
 * Removes the visibilitychange listener.
 */
export function stopVisibilityTracker(): void {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}
