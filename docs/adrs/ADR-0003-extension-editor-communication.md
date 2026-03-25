# ADR-0003: Extension-to-Editor Communication via chrome.storage + Message Passing

## Status
Accepted

## Context
The Chrome extension captures data (AI responses, copy events, tab switches) that the web editor needs for attribution. These are separate execution contexts — the extension runs on claude.ai, the editor is a separate web page (could be a chrome-extension:// page or a localhost page).

## Decision
Use a **hybrid approach**:
1. **chrome.storage.local** as the shared data bus — extension writes, editor reads
2. **chrome.storage.onChanged** listener in the editor for real-time updates when the editor is a chrome-extension:// page or has the extension's externally_connectable permissions
3. **Polling fallback** — if the editor cannot use chrome APIs directly (e.g., running on localhost), poll chrome.storage via the extension's service worker using chrome.runtime.sendMessage

The editor syncs the AI knowledge pool and copy records from chrome.storage into its own IndexedDB on startup and on change events.

## Rationale
- chrome.storage is already the extension's primary store (ADR-0001), so no additional write path needed
- onChanged events provide near-real-time sync without polling overhead
- Polling fallback ensures the editor works regardless of hosting model
- This avoids complex WebSocket/native messaging setups

## Consequences
- Editor needs to detect whether it has chrome API access and choose the appropriate sync strategy
- Polling introduces latency (configurable interval, default 2s)
- Extension must be installed for any attribution beyond basic paste detection

## Affects
Sprint 1 (extension storage schema design), Sprint 2 (editor reads extension data for paste matching), Sprint 3 (temporal gating relies on accurate AI pool timestamps from extension), Sprint 4 (analytics tracks extension connection status)
