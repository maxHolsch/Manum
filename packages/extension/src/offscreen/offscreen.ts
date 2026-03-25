// Offscreen document for clipboard access
// Used because service workers cannot access clipboard API directly

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'READ_CLIPBOARD') {
    navigator.clipboard
      .readText()
      .then((text) => sendResponse({ success: true, text }))
      .catch((err: Error) => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async response
  }
});
