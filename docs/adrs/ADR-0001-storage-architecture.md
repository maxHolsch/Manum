# ADR-0001: Dual Storage Architecture (chrome.storage + IndexedDB)

## Status
Accepted

## Context
Manum has two runtime contexts — a Chrome extension (content scripts, service worker) and a web application (React editor). Both need persistent storage, but Chrome extension APIs and web APIs have different storage mechanisms and constraints.

The Chrome extension captures AI responses and copy events on claude.ai. The web editor stores documents, attribution spans, git repositories, and analytics. Data must flow from the extension to the editor for paste attribution.

## Decision
Use **chrome.storage.local** as the primary store for the extension capture layer (AI knowledge pool, copy records, tab events), and **IndexedDB** as the primary store for the web editor (documents, attribution spans, git repo via lightning-fs, analytics). The editor maintains a local copy of the AI knowledge pool in IndexedDB, synced from chrome.storage.

## Rationale
- chrome.storage.local is the only reliable storage accessible from both content scripts and service workers in Manifest V3
- IndexedDB supports the large structured data needed for documents, git objects (via lightning-fs), and analytics time series
- Keeping a synced copy in IndexedDB means the editor works even if the extension is disconnected (graceful degradation)
- unlimitedStorage permission removes the chrome.storage.local quota

## Consequences
- Need a sync mechanism between chrome.storage and IndexedDB (polling or message-based)
- Two sources of truth for the AI pool — must handle sync conflicts (extension is authoritative)
- Editor must handle disconnected extension gracefully (all pastes become GREEN)

## Affects
Sprint 1 (extension storage), Sprint 2 (editor persistence, extension-editor sync), Sprint 3 (git storage in IndexedDB), Sprint 4 (analytics storage)
