# Phase 2: Capture Layer

## Prerequisites

- Phase 1 complete: monorepo builds, tests pass, extension loads in Chrome
- `@manum/shared` types available (AIPoolEntry, CopyRecord, TabEvent)
- Extension manifest has permissions: `storage`, `unlimitedStorage`, `tabs`, `clipboardRead`, `offscreen`
- Content script targets `https://claude.ai/*`

## Phase Goal

A Chrome extension that silently captures AI responses, copy events, and tab switches from Claude.ai — populating the AI knowledge pool in chrome.storage.local for later consumption by the editor.

## Phase Evaluation Criteria

- Content script injects on claude.ai pages (verify via `console.log` or `chrome.devtools`)
- AI response capture: inject mock DOM mutation → verify entry appears in `chrome.storage.local` with correct fields
- Copy event capture: simulate copy on claude.ai → verify copy record in storage with selected text and source ID
- Tab tracking: switch between tabs → verify timestamped events in storage
- Offscreen document: request clipboard read → verify message round-trip completes
- `pnpm --filter extension test` passes all unit tests (selector tests, debounce tests, storage tests)
- Storage schema validation: all stored records have required fields per `@manum/shared` types
- No console errors when extension is active on a non-claude.ai page
- All quality gates green (lint, types, tests)

---

## Tasks

### T030: Create Isolated DOM Selector Module for Claude.ai

**PRD Reference:** Sprint 1, Task 2 (AI response extraction — selector isolation)
**Depends on:** Nothing
**Blocks:** T031, T035
**User Stories:** US-02
**Estimated scope:** 30 min

#### Description

Create a dedicated module that encapsulates all DOM selectors for Claude.ai's conversation UI. This module is the single point of change when Claude.ai updates their DOM structure.

#### Acceptance Criteria

- [ ] Selector module exports functions: `getConversationContainer()`, `getAssistantMessages()`, `isAssistantMessage(element)`, `getMessageText(element)`, `getMessageId(element)`
- [ ] Selectors use resilient strategies: data-* attributes, ARIA roles, role attributes
- [ ] Module includes comments documenting which Claude.ai DOM structure each selector targets
- [ ] Unit tests with mock DOM verify all selector functions

#### Files to Create/Modify

- `packages/extension/src/content/selectors.ts` — (create) DOM selector module
- `packages/extension/src/__tests__/selectors.test.ts` — (create) Tests with mock DOM structures

#### Implementation Notes

Claude.ai's DOM is fragile. Prefer `[data-testid]`, `[role="assistant"]`, and structural selectors over class names. Create mock DOM structures in tests that mirror Claude.ai's actual markup. Version these mocks so they can be updated when the DOM changes. The selector module should NOT contain any business logic — just DOM queries.

#### Evaluation Checklist

- [ ] All selector tests pass with mock DOM
- [ ] Selectors are isolated in a single file with no business logic

---

### T031: Implement MutationObserver for AI Response Detection

**PRD Reference:** Sprint 1, Task 2 (MutationObserver on conversation container)
**Depends on:** T030
**Blocks:** T032
**User Stories:** US-02
**Estimated scope:** 1 hour

#### Description

Set up a MutationObserver on Claude.ai's conversation container that detects when new assistant messages appear. The observer watches for childList mutations and filters for assistant message elements using the selector module.

#### Acceptance Criteria

- [ ] MutationObserver attaches to the conversation container on page load
- [ ] Observer detects new assistant message elements added to the DOM
- [ ] Only assistant messages trigger the capture callback (not user messages)
- [ ] Observer reconnects if the conversation container is replaced (SPA navigation)
- [ ] Unit tests verify observer correctly identifies new assistant messages from mock mutations

#### Files to Create/Modify

- `packages/extension/src/content/observer.ts` — (create) MutationObserver setup and callback
- `packages/extension/src/content/index.ts` — (modify) Initialize observer on DOM ready
- `packages/extension/src/__tests__/observer.test.ts` — (create) Tests with mock DOM mutations

#### Implementation Notes

Use `MutationObserver` with `{ childList: true, subtree: true }` on the conversation container. Claude.ai is a SPA — the container may be replaced on route changes. Watch for this with a parent observer or periodic re-attachment. The callback should call into the selector module to filter for assistant messages only.

#### Evaluation Checklist

- [ ] Observer tests pass with mock mutations
- [ ] Observer handles SPA navigation (container replacement)

---

### T032: Implement Streaming Debounce for Message Capture

**PRD Reference:** Sprint 1, Task 2 (Debounce for streaming completion)
**Depends on:** T031
**Blocks:** T033, T034
**User Stories:** US-02
**Estimated scope:** 1 hour

#### Description

Implement a debounce mechanism that waits for an AI message to finish streaming before capturing it. Claude.ai streams tokens into the DOM incrementally — the capture should only fire once the message stops growing.

#### Acceptance Criteria

- [ ] Debounce waits for message text to stop changing for at least 1 second before capture
- [ ] Intermediate streaming states do not trigger capture
- [ ] A fully rendered message is captured within 2 seconds of completion
- [ ] Multiple messages streaming in sequence are captured individually
- [ ] Unit tests simulate token-by-token growth and verify single capture per message

#### Files to Create/Modify

- `packages/extension/src/content/debounce.ts` — (create) Streaming debounce logic
- `packages/extension/src/__tests__/debounce.test.ts` — (create) Tests simulating streaming

#### Implementation Notes

Track each message element's `textContent` length. On each mutation, reset a timer. When the timer fires (1s of no changes), capture the message. Use a `Map<string, NodeJS.Timeout>` keyed by message ID to handle multiple concurrent messages. Ensure cleanup of timers when the observer disconnects.

#### Evaluation Checklist

- [ ] Debounce tests pass: rapid mutations → single capture
- [ ] Capture occurs within 2 seconds of message completion

---

### T033: Implement AI Knowledge Pool Storage [P]

**PRD Reference:** Sprint 1, Task 2 (Store in chrome.storage.local); Sprint 1, Task 6 (Storage schema)
**Depends on:** T032
**Blocks:** T034, T041
**User Stories:** US-02
**Estimated scope:** 30 min

#### Description

Implement the storage layer for captured AI responses. Each captured message is stored as an `AIPoolEntry` in chrome.storage.local with a unique message ID, full text, timestamp, and conversation context.

#### Acceptance Criteria

- [ ] Captured messages are stored in chrome.storage.local under a namespaced key (e.g., `manum_ai_pool`)
- [ ] Each entry includes: `messageId`, `text`, `timestamp`, `conversationId`
- [ ] Entries conform to the `AIPoolEntry` type from `@manum/shared`
- [ ] Storage persists across page navigations
- [ ] Duplicate message IDs are not stored (idempotent writes)

#### Files to Create/Modify

- `packages/extension/src/storage/ai-pool.ts` — (create) AI pool storage operations
- `packages/extension/src/__tests__/ai-pool.test.ts` — (create) Storage tests with mock chrome.storage

#### Implementation Notes

Use `chrome.storage.local.get()` and `chrome.storage.local.set()`. Store entries as an array under a single key, or as individual keys with a prefix. Array approach is simpler for syncing to the editor later. Use `@manum/shared` types for the entry shape. Mock `chrome.storage.local` in tests using a simple in-memory implementation.

#### Evaluation Checklist

- [ ] Storage tests pass with mock chrome.storage
- [ ] Entries have all required fields per `AIPoolEntry` type

---

### T034: Wire Up Content Script: Observer → Debounce → Storage

**PRD Reference:** Sprint 1, Task 2 (end-to-end capture flow)
**Depends on:** T031, T032, T033
**Blocks:** Nothing
**User Stories:** US-02
**Estimated scope:** 30 min

#### Description

Connect the MutationObserver, streaming debounce, and AI pool storage into a complete capture pipeline in the content script entry point. When a new AI message finishes streaming, it flows through: observer detects → debounce waits → storage writes.

#### Acceptance Criteria

- [ ] Content script initializes observer on page load
- [ ] Complete flow: DOM mutation → debounce → storage write works end-to-end
- [ ] Integration test verifies the full pipeline with mock DOM and mock storage
- [ ] Console logging (debug level) shows capture events for development

#### Files to Create/Modify

- `packages/extension/src/content/index.ts` — (modify) Wire up the full pipeline
- `packages/extension/src/__tests__/content-integration.test.ts` — (create) Integration test

#### Implementation Notes

The content script entry point should: (1) wait for DOM ready, (2) find the conversation container via selectors, (3) attach the observer, (4) pass mutations through the debounce, (5) write completed messages to storage. Add a `console.debug('[Manum]', ...)` prefix for all debug output so it's easy to filter.

#### Evaluation Checklist

- [ ] Integration test passes: mock mutation → entry in mock storage
- [ ] Content script loads without errors on non-claude.ai pages (graceful no-op)

---

### T035: Implement Copy Event Listener

**PRD Reference:** Sprint 1, Task 3 (Copy event listener)
**Depends on:** T030
**Blocks:** T036
**User Stories:** US-03
**Estimated scope:** 30 min

#### Description

Add a copy event listener to the claude.ai content script that captures when the user copies text from an AI response. Extract the selected text, identify the source message, and prepare a copy record.

#### Acceptance Criteria

- [ ] `document.addEventListener('copy', ...)` is registered on claude.ai pages
- [ ] Copy handler extracts `window.getSelection().toString()` for the selected text
- [ ] Handler identifies the source message element using the selector module
- [ ] Copy records include: selectedText, sourceMessageId, timestamp
- [ ] Only copies from within assistant messages are recorded (not user message copies)

#### Files to Create/Modify

- `packages/extension/src/content/copy-listener.ts` — (create) Copy event handler
- `packages/extension/src/__tests__/copy-listener.test.ts` — (create) Tests with mock copy events

#### Implementation Notes

Use `window.getSelection()` to get the selected text on copy. Walk up the DOM from the selection's anchor node to find the containing message element, then use `selectors.getMessageId()` to identify it. Only create a record if `selectors.isAssistantMessage()` returns true for the containing element.

#### Evaluation Checklist

- [ ] Copy listener tests pass with mock events and DOM
- [ ] Non-assistant copies are ignored

---

### T036: Store Copy Records in chrome.storage

**PRD Reference:** Sprint 1, Task 3 (Store as pending copy record)
**Depends on:** T035
**Blocks:** Nothing
**User Stories:** US-03
**Estimated scope:** 30 min

#### Description

Persist copy records from the copy event listener to chrome.storage.local. Wire the copy listener to the storage layer and integrate it into the content script initialization.

#### Acceptance Criteria

- [ ] Copy records stored in chrome.storage.local under a namespaced key (e.g., `manum_copy_records`)
- [ ] Each record conforms to the `CopyRecord` type from `@manum/shared`
- [ ] Multiple copies from the same message create separate records
- [ ] Records are available within 1 second of the copy event
- [ ] Integration test: mock copy event → verify record in mock storage

#### Files to Create/Modify

- `packages/extension/src/storage/copy-records.ts` — (create) Copy record storage operations
- `packages/extension/src/content/index.ts` — (modify) Initialize copy listener
- `packages/extension/src/__tests__/copy-records.test.ts` — (create) Storage tests

#### Implementation Notes

Similar pattern to AI pool storage. Store as an array under a single key. Each record: `{ selectedText, sourceMessageId, timestamp, id }` where `id` is a generated UUID. The copy listener should call the storage module's `addCopyRecord()` function.

#### Evaluation Checklist

- [ ] Copy record storage tests pass
- [ ] Content script initializes copy listener alongside observer

---

### T037: Implement Tab Focus Tracking in Service Worker

**PRD Reference:** Sprint 1, Task 4 (Tab tracking — service worker)
**Depends on:** Nothing
**Blocks:** T038
**User Stories:** US-04
**Estimated scope:** 30 min

#### Description

Implement tab switch tracking in the extension's service worker using `chrome.tabs.onActivated`. Log timestamped events that categorize tabs as editor, Claude.ai, or other.

#### Acceptance Criteria

- [ ] `chrome.tabs.onActivated.addListener()` is registered in the service worker
- [ ] Each tab activation creates a `TabEvent` with: tabType, timestamp, url
- [ ] Tab types are classified: `editor` (chrome-extension:// pages), `claude` (claude.ai), `other`
- [ ] Events are stored in chrome.storage.local under `manum_tab_events`
- [ ] Unit tests verify correct tab classification

#### Files to Create/Modify

- `packages/extension/src/background/tab-tracker.ts` — (create) Tab tracking logic
- `packages/extension/src/background/service-worker.ts` — (modify) Initialize tab tracker
- `packages/extension/src/__tests__/tab-tracker.test.ts` — (create) Tests with mock chrome.tabs

#### Implementation Notes

Use `chrome.tabs.get(activeInfo.tabId)` to get the URL of the activated tab, then classify based on URL pattern. Store events as an array. The service worker may be terminated and restarted by Chrome — ensure the listener is registered at the top level (not inside an async callback).

#### Evaluation Checklist

- [ ] Tab tracker tests pass with mock chrome.tabs API
- [ ] Service worker registers listener on startup

---

### T038: Implement Visibility Change Tracking in Content Script [P]

**PRD Reference:** Sprint 1, Task 4 (document.visibilitychange in content scripts)
**Depends on:** T037
**Blocks:** Nothing
**User Stories:** US-04
**Estimated scope:** 15 min

#### Description

Add `document.visibilitychange` listener in the claude.ai content script to supplement the service worker's tab tracking. This captures when the claude.ai tab becomes visible or hidden.

#### Acceptance Criteria

- [ ] `document.addEventListener('visibilitychange', ...)` registered in content script
- [ ] Visibility changes are sent to the service worker via `chrome.runtime.sendMessage()`
- [ ] Service worker receives and stores these events alongside tab activation events
- [ ] Test verifies message passing between content script and service worker

#### Files to Create/Modify

- `packages/extension/src/content/visibility-tracker.ts` — (create) Visibility change handler
- `packages/extension/src/content/index.ts` — (modify) Initialize visibility tracker
- `packages/extension/src/__tests__/visibility-tracker.test.ts` — (create) Tests

#### Implementation Notes

Send a message like `{ type: 'TAB_VISIBILITY_CHANGE', visible: !document.hidden, url: location.href, timestamp: Date.now() }` to the service worker. The service worker's message listener (in tab-tracker.ts or a separate handler) should store this as a `TabEvent`.

#### Evaluation Checklist

- [ ] Visibility tracker tests pass
- [ ] Message passing works between content script and service worker

---

### T039: Create Offscreen Document for Clipboard Access

**PRD Reference:** Sprint 1, Task 5 (Offscreen document for clipboard)
**Depends on:** Nothing
**Blocks:** T040
**User Stories:** US-05
**Estimated scope:** 30 min

#### Description

Set up the offscreen document that provides clipboard access via `navigator.clipboard.readText()`. The offscreen document is created on demand by the service worker.

#### Acceptance Criteria

- [ ] Offscreen HTML document exists with the required `<script>` tag
- [ ] Service worker can create the offscreen document via `chrome.offscreen.createDocument()`
- [ ] Offscreen document script listens for messages from the service worker
- [ ] `navigator.clipboard.readText()` is called and result sent back via message passing

#### Files to Create/Modify

- `packages/extension/src/offscreen/offscreen.html` — (modify) Add script reference
- `packages/extension/src/offscreen/offscreen.ts` — (modify) Implement message listener and clipboard read

#### Implementation Notes

Create the offscreen document with reason `CLIPBOARD` and justification string. The offscreen script should listen for `chrome.runtime.onMessage` with type `READ_CLIPBOARD`, call `navigator.clipboard.readText()`, and send the result back via `sendResponse`. The offscreen document should be created only when needed.

#### Evaluation Checklist

- [ ] Offscreen document loads without errors
- [ ] Message listener is registered

---

### T040: Implement Clipboard Read Message Passing

**PRD Reference:** Sprint 1, Task 5 (Message passing for clipboard)
**Depends on:** T039
**Blocks:** Nothing
**User Stories:** US-05
**Estimated scope:** 30 min

#### Description

Implement the service worker side of clipboard access: create the offscreen document on demand, send a clipboard read request, receive the result, and clean up the offscreen document.

#### Acceptance Criteria

- [ ] Service worker exports a `readClipboard()` function
- [ ] Function creates offscreen document if not already open
- [ ] Function sends `READ_CLIPBOARD` message and awaits response
- [ ] Function returns clipboard text content
- [ ] Offscreen document is cleaned up after use
- [ ] Handles errors gracefully (clipboard denied, offscreen creation failure)

#### Files to Create/Modify

- `packages/extension/src/background/clipboard.ts` — (create) Clipboard access via offscreen document
- `packages/extension/src/__tests__/clipboard.test.ts` — (create) Tests with mock chrome.offscreen

#### Implementation Notes

Use `chrome.offscreen.createDocument()` with `reasons: ['CLIPBOARD']`. Check if the document already exists before creating (use `chrome.offscreen.hasDocument()` if available, otherwise track state). Send message via `chrome.runtime.sendMessage()`. Clean up with `chrome.offscreen.closeDocument()` after receiving the response. Wrap in try/catch for graceful error handling.

#### Evaluation Checklist

- [ ] Clipboard tests pass with mock chrome.offscreen
- [ ] Error cases handled (clipboard denied, creation failure)

---

### T041: Define Storage Schema and Management Utilities

**PRD Reference:** Sprint 1, Task 6 (Storage schema and management)
**Depends on:** T033
**Blocks:** Nothing
**User Stories:** US-02, US-03, US-04
**Estimated scope:** 30 min

#### Description

Create a unified storage management module that provides typed access to all storage keys, storage size monitoring, and basic cleanup (LRU eviction for AI pool entries if needed).

#### Acceptance Criteria

- [ ] Storage keys are defined as constants (e.g., `STORAGE_KEYS.AI_POOL`, `STORAGE_KEYS.COPY_RECORDS`, `STORAGE_KEYS.TAB_EVENTS`)
- [ ] Typed getter/setter functions for each storage area
- [ ] Storage size estimation function
- [ ] Basic LRU eviction for AI pool entries (remove oldest when approaching limit)
- [ ] Unit tests verify typed access and eviction logic

#### Files to Create/Modify

- `packages/extension/src/storage/keys.ts` — (create) Storage key constants
- `packages/extension/src/storage/manager.ts` — (create) Storage management utilities
- `packages/extension/src/__tests__/storage-manager.test.ts` — (create) Tests

#### Implementation Notes

While `unlimitedStorage` is requested, it's good practice to have a safety net. Estimate size using `JSON.stringify(data).length`. LRU eviction: sort AI pool entries by timestamp, remove the oldest when total entries exceed a configurable threshold (e.g., 10,000 entries). The eviction should be a background task that doesn't block writes.

#### Evaluation Checklist

- [ ] Storage manager tests pass
- [ ] Eviction logic correctly removes oldest entries
