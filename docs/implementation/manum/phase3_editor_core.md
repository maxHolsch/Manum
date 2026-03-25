# Phase 3: Editor Core & Aesthetic

## Prerequisites

- Phase 1 complete: monorepo builds, all quality gates green
- Phase 2 complete: extension captures AI responses, copy events, and tab switches to chrome.storage.local
- `@manum/shared` types available for AttributionSpan, AIPoolEntry, CopyRecord
- Editor package has Vite + React + TypeScript configured

## Phase Goal

A functional TipTap editor with manuscript aesthetic, IndexedDB persistence, document management, and real-time data sync from the extension — ready for attribution features in Phase 4.

## Phase Evaluation Criteria

- Editor opens as a chrome-extension:// page and renders TipTap with manuscript styling
- User can type text with bold, italic, and heading formatting
- Manuscript aesthetic is visible: Special Elite font, parchment background, paper texture, wired-elements controls
- Documents auto-save to IndexedDB after 2 seconds of inactivity
- Document list view shows saved documents with titles and last-modified dates
- Documents persist across browser restarts (close and reopen extension page)
- AI knowledge pool syncs from chrome.storage to editor's IndexedDB within 2 seconds
- Connection status indicator shows extension connectivity state
- Editor functions without errors when extension APIs are unavailable (graceful degradation)
- `pnpm --filter editor test` passes all unit and integration tests
- All quality gates green (lint, types, tests)

---

## Tasks

### T060: Set Up TipTap Editor with React

**PRD Reference:** Sprint 2, Task 1 (React + TipTap editor setup)
**Depends on:** Nothing
**Blocks:** T061, T062, T063, T064
**User Stories:** US-06
**Estimated scope:** 1 hour

#### Description

Install TipTap and configure it as the editor within the React app. Set up the basic editor component with a centered 768px max-width column layout.

#### Acceptance Criteria

- [ ] TipTap editor renders in the React app with an editable content area
- [ ] Editor has a centered column layout with 768px max-width
- [ ] User can type text and see it appear in the editor
- [ ] Editor component is a standalone React component (`<ManumEditor />`)
- [ ] Basic test verifies the editor renders and accepts input

#### Files to Create/Modify

- `packages/editor/src/components/Editor.tsx` — (create) TipTap editor component
- `packages/editor/src/App.tsx` — (modify) Render the editor component
- `packages/editor/package.json` — (modify) Add TipTap dependencies

#### Implementation Notes

Install: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`. Use `useEditor()` hook from `@tiptap/react`. The `EditorContent` component renders the editor. Set up with `StarterKit` extension for basic functionality. CSS: `max-width: 768px; margin: 0 auto; padding: 2rem;`.

#### Evaluation Checklist

- [ ] Editor renders and accepts typed text
- [ ] Column is centered at 768px max-width

---

### T061: Implement Section-Based Document Model

**PRD Reference:** Sprint 2, Task 1 (section-based document model)
**Depends on:** T060
**Blocks:** T064, T068
**User Stories:** US-06
**Estimated scope:** 1 hour

#### Description

Configure TipTap's document model to use paragraph-level nodes as the atomic unit (sections). Each paragraph node is the basis for branching and attribution granularity.

#### Acceptance Criteria

- [ ] Document schema uses paragraph nodes as the primary content block
- [ ] Each paragraph node can hold arbitrary inline content (text, marks)
- [ ] Document serializes to structured JSON via TipTap's `editor.getJSON()`
- [ ] JSON round-trip: serialize → deserialize → identical content
- [ ] Test verifies document model structure

#### Files to Create/Modify

- `packages/editor/src/editor/schema.ts` — (create) Custom document schema configuration
- `packages/editor/src/__tests__/schema.test.ts` — (create) Document model tests

#### Implementation Notes

TipTap's default document model already uses paragraphs as the primary block. The key here is to ensure the schema is explicitly defined (not just defaults) so we can extend it later with custom nodes for branch markers. Export the schema configuration as a reusable TipTap extension set.

#### Evaluation Checklist

- [ ] Document model test passes: create content, serialize, deserialize, verify equality
- [ ] Paragraph nodes are the atomic content blocks

---

### T062: Create Formatting Toolbar

**PRD Reference:** Sprint 2, Task 1 (Basic toolbar)
**Depends on:** T060
**Blocks:** Nothing
**User Stories:** US-06
**Estimated scope:** 30 min

#### Description

Add a minimal formatting toolbar with bold, italic, and heading controls. Toolbar buttons should reflect active formatting state.

#### Acceptance Criteria

- [ ] Toolbar renders above the editor with buttons for Bold, Italic, H1, H2, H3
- [ ] Clicking a button applies/removes the formatting on the current selection
- [ ] Active formatting is visually indicated (button appears pressed/highlighted)
- [ ] Keyboard shortcuts work: Ctrl+B (bold), Ctrl+I (italic)
- [ ] Test verifies toolbar buttons toggle formatting

#### Files to Create/Modify

- `packages/editor/src/components/Toolbar.tsx` — (create) Formatting toolbar component
- `packages/editor/src/components/Editor.tsx` — (modify) Include toolbar above editor

#### Implementation Notes

Use TipTap's `editor.chain().focus().toggleBold().run()` pattern. Check active state with `editor.isActive('bold')`. Keep the toolbar minimal — this will be styled with wired-elements in T066. For now, use basic HTML buttons.

#### Evaluation Checklist

- [ ] Bold, Italic, and Heading buttons work
- [ ] Active state is visually indicated

---

### T063: Implement Custom TipTap Marks for Attribution Spans

**PRD Reference:** Sprint 2, Task 1 (Custom TipTap marks for attribution spans)
**Depends on:** T060
**Blocks:** T068
**User Stories:** US-06
**Estimated scope:** 1 hour

#### Description

Create a custom TipTap mark that stores attribution metadata (color, confidence, source, edit distance) on text spans. This mark is the foundation for the attribution system.

#### Acceptance Criteria

- [ ] Custom `attribution` mark registered with TipTap
- [ ] Mark stores attributes: `color`, `confidence`, `scoringMode`, `pasteEventId`, `originalPasteContent`, `editDistance`, `createdAt`
- [ ] Mark can be programmatically applied to a text range
- [ ] Mark attributes are preserved in JSON serialization/deserialization
- [ ] Multiple overlapping marks are handled correctly (or prevented if not supported)
- [ ] Test verifies mark creation, attribute storage, and JSON round-trip

#### Files to Create/Modify

- `packages/editor/src/editor/marks/attribution.ts` — (create) Custom attribution mark extension
- `packages/editor/src/__tests__/attribution-mark.test.ts` — (create) Mark tests

#### Implementation Notes

Create a TipTap `Mark.create()` with the following schema:
```typescript
Mark.create({
  name: 'attribution',
  addAttributes() {
    return {
      color: { default: 'green' },
      confidence: { default: 1.0 },
      scoringMode: { default: 'edit-distance' },
      pasteEventId: { default: null },
      originalPasteContent: { default: null },
      editDistance: { default: null },
      createdAt: { default: null },
    };
  },
  // ... parseHTML and renderHTML
});
```
Render the mark as a `<span>` with `data-attribution-color` attribute for CSS targeting. Don't apply visual styles yet — that's handled by the overlay toggle in Phase 4.

#### Evaluation Checklist

- [ ] Attribution mark tests pass
- [ ] Marks survive JSON round-trip with all attributes intact

---

### T064: Implement Custom TipTap Nodes for Branch Markers

**PRD Reference:** Sprint 2, Task 1 (Custom TipTap nodes for branch markers)
**Depends on:** T060, T061
**Blocks:** Nothing
**User Stories:** US-06
**Estimated scope:** 30 min

#### Description

Create a custom TipTap node type for branch markers — the L-shaped indicators that appear on branched sections. This is a placeholder node that will be activated in Phase 5 when branching is implemented.

#### Acceptance Criteria

- [ ] Custom `branchMarker` node registered with TipTap
- [ ] Node stores attributes: `branchId`, `branchName`, `position` (start/end)
- [ ] Node renders as an inline decoration (non-editable)
- [ ] Node is preserved in JSON serialization
- [ ] Test verifies node creation and serialization

#### Files to Create/Modify

- `packages/editor/src/editor/nodes/branch-marker.ts` — (create) Custom branch marker node
- `packages/editor/src/__tests__/branch-marker.test.ts` — (create) Node tests

#### Implementation Notes

Use TipTap's `Node.create()` with `inline: true`, `group: 'inline'`, `atom: true` (non-editable). The visual rendering (L-shaped markers) will be styled in Phase 5. For now, just establish the node type in the schema so the document model supports it.

#### Evaluation Checklist

- [ ] Branch marker node tests pass
- [ ] Node persists in document JSON

---

### T065: Set Up Manuscript Aesthetic Foundation

**PRD Reference:** UI Design Direction; Visual/UI library stack
**Depends on:** T060
**Blocks:** T066, T067
**User Stories:** US-07
**Estimated scope:** 1 hour

#### Description

Establish the core manuscript aesthetic: load fonts (Special Elite, Courier Prime, Caveat), apply the warm parchment color palette, and add paper texture overlays using CSS and SVG filters.

#### Acceptance Criteria

- [ ] Special Elite font loaded and applied to body/editor text
- [ ] Courier Prime font loaded for metadata elements
- [ ] Caveat font loaded for handwritten elements
- [ ] Background color uses warm parchment tones (#FBF3E3 for main, #FFF8EF for editor area)
- [ ] Paper grain texture overlay at 5% opacity using `feTurbulence` SVG filter or css-doodle
- [ ] Slight card rotations (-0.5deg to 1.5deg) applied to panel-like elements
- [ ] Color palette variables defined in CSS custom properties

#### Files to Create/Modify

- `packages/editor/src/styles/fonts.css` — (create) Font imports (Google Fonts)
- `packages/editor/src/styles/theme.css` — (create) Color palette CSS custom properties
- `packages/editor/src/styles/texture.css` — (create) Paper texture overlay styles
- `packages/editor/src/styles/index.css` — (create) Main stylesheet importing all partials
- `packages/editor/src/main.tsx` — (modify) Import main stylesheet

#### Implementation Notes

Load fonts from Google Fonts: `@import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime&family=Caveat&display=swap')`. CSS custom properties:
```css
:root {
  --color-parchment: #FBF3E3;
  --color-paper: #FFF8EF;
  --color-border: #E1D9CA;
  --color-ink: #080200;
  --color-ink-light: #1E1B12;
  --color-accent: #4A5E8A;
  --color-gray: #80756D;
  --color-gray-light: #D2C4BA;
  --font-body: 'Special Elite', monospace;
  --font-meta: 'Courier Prime', monospace;
  --font-handwriting: 'Caveat', cursive;
}
```
Paper texture: use an SVG `<filter>` with `<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3"/>` at 5% opacity as a fixed overlay.

#### Evaluation Checklist

- [ ] Fonts render correctly in the editor
- [ ] Color palette matches PRD specification
- [ ] Paper texture is visible at low opacity

---

### T066: Integrate wired-elements for UI Controls

**PRD Reference:** UI Design Direction (wired-elements for sketchy UI components)
**Depends on:** T065
**Blocks:** Nothing
**User Stories:** US-07
**Estimated scope:** 30 min

#### Description

Integrate the wired-elements library for hand-drawn style UI controls. Replace basic HTML buttons in the toolbar with wired-elements equivalents.

#### Acceptance Criteria

- [ ] `wired-elements` package installed
- [ ] Toolbar buttons use `<wired-button>` elements
- [ ] Buttons render with a hand-drawn/sketchy appearance
- [ ] React wrapper components created for commonly used wired-elements

#### Files to Create/Modify

- `packages/editor/src/components/ui/WiredButton.tsx` — (create) React wrapper for wired-button
- `packages/editor/src/components/ui/WiredToggle.tsx` — (create) React wrapper for wired-toggle
- `packages/editor/src/components/Toolbar.tsx` — (modify) Use WiredButton components
- `packages/editor/package.json` — (modify) Add wired-elements dependency

#### Implementation Notes

wired-elements are Web Components. In React, use them directly in JSX: `<wired-button onClick={...}>Bold</wired-button>`. For TypeScript, you may need to declare the custom elements in a `.d.ts` file. Create thin React wrapper components that handle event mapping and typing.

#### Evaluation Checklist

- [ ] Toolbar renders with wired-elements styling
- [ ] Wired buttons respond to click events

---

### T067: Integrate rough.js for Hand-Drawn Shapes

**PRD Reference:** UI Design Direction (rough.js for hand-drawn shapes and borders)
**Depends on:** T065
**Blocks:** Nothing
**User Stories:** US-07
**Estimated scope:** 30 min

#### Description

Set up rough.js for rendering hand-drawn shapes, borders, and decorative elements. Create utility components/hooks for common patterns.

#### Acceptance Criteria

- [ ] `rough.js` package installed
- [ ] Utility React hook or component for rendering rough.js shapes on a canvas/SVG
- [ ] At least one decorative element uses rough.js (e.g., editor panel border)
- [ ] Rough shapes render consistently across browser refreshes (seeded randomness)

#### Files to Create/Modify

- `packages/editor/src/components/ui/RoughBorder.tsx` — (create) Rough.js border component
- `packages/editor/src/hooks/useRoughCanvas.ts` — (create) Hook for rough.js canvas drawing
- `packages/editor/package.json` — (modify) Add rough.js dependency

#### Implementation Notes

rough.js can render to SVG or Canvas. SVG is better for React since it's declarative. Use `rough.svg(svgElement)` to get a drawable, then call `drawable.rectangle(...)` with options like `{ roughness: 1.5, stroke: 'var(--color-border)' }`. For seeded randomness (consistent rendering), use the `seed` option: `{ seed: 42 }`.

#### Evaluation Checklist

- [ ] Rough.js shapes render in the editor UI
- [ ] Shapes are consistent across page refreshes

---

### T068: Create IndexedDB Persistence Layer

**PRD Reference:** Sprint 2, Task 6 (Persistence layer)
**Depends on:** T061, T063
**Blocks:** T069, T070, T071
**User Stories:** US-08
**Estimated scope:** 1 hour

#### Description

Implement the IndexedDB storage layer for documents, including their content (TipTap JSON), attribution spans, and metadata. Use a simple wrapper around the IndexedDB API.

#### Acceptance Criteria

- [ ] IndexedDB database `manum_db` created with object stores for documents and AI pool
- [ ] Document store schema: `id`, `title`, `content` (TipTap JSON), `attributionSpans`, `createdAt`, `updatedAt`
- [ ] CRUD operations: `createDocument()`, `getDocument(id)`, `updateDocument(id, data)`, `deleteDocument(id)`, `listDocuments()`
- [ ] Data persists across page navigations and browser restarts
- [ ] Unit tests verify all CRUD operations

#### Files to Create/Modify

- `packages/editor/src/storage/db.ts` — (create) IndexedDB database initialization
- `packages/editor/src/storage/documents.ts` — (create) Document CRUD operations
- `packages/editor/src/__tests__/documents.test.ts` — (create) Tests with fake-indexeddb

#### Implementation Notes

Use `idb` library (lightweight IndexedDB wrapper with Promises) or raw IndexedDB API. For testing, use `fake-indexeddb` package which provides an in-memory IndexedDB implementation. Database schema version 1:
```
manum_db v1:
  documents: { keyPath: 'id', indexes: ['updatedAt'] }
  ai_pool: { keyPath: 'messageId', indexes: ['timestamp'] }
  copy_records: { keyPath: 'id', indexes: ['timestamp'] }
```

#### Evaluation Checklist

- [ ] All CRUD tests pass with fake-indexeddb
- [ ] Database schema matches expected structure

---

### T069: Implement Auto-Save with Debounced Writes

**PRD Reference:** Sprint 2, Task 6 (Auto-save on edit, debounced 2 seconds)
**Depends on:** T068
**Blocks:** Nothing
**User Stories:** US-08
**Estimated scope:** 30 min

#### Description

Implement auto-save that triggers after 2 seconds of edit inactivity. The save writes the current TipTap document state to IndexedDB.

#### Acceptance Criteria

- [ ] Auto-save triggers after 2 seconds of no edits
- [ ] Rapid edits reset the debounce timer (only one save after inactivity)
- [ ] Save writes the full document state (TipTap JSON + metadata) to IndexedDB
- [ ] Save indicator shows when a save is in progress or completed
- [ ] Test verifies debounce behavior: rapid edits → single save

#### Files to Create/Modify

- `packages/editor/src/hooks/useAutoSave.ts` — (create) Auto-save hook with debounce
- `packages/editor/src/components/Editor.tsx` — (modify) Wire auto-save to editor updates
- `packages/editor/src/__tests__/auto-save.test.ts` — (create) Debounce behavior tests

#### Implementation Notes

Use TipTap's `onUpdate` callback to detect edits. Debounce with a 2-second timeout. On save, call `editor.getJSON()` to get the document state and pass it to `updateDocument()`. Show a subtle save indicator (e.g., "Saved" text that fades out). Use `useRef` for the timeout to avoid stale closures.

#### Evaluation Checklist

- [ ] Auto-save tests pass: verify debounce timing and single save
- [ ] Save writes correct document state to IndexedDB

---

### T070: Create Document List View

**PRD Reference:** Sprint 2, Task 6 (Document list view)
**Depends on:** T068
**Blocks:** Nothing
**User Stories:** US-08
**Estimated scope:** 1 hour

#### Description

Implement a document list view that shows all saved documents with titles and last-modified dates. Users can open, create, and delete documents from this view.

#### Acceptance Criteria

- [ ] Document list displays all saved documents from IndexedDB
- [ ] Each list item shows: title, last modified date
- [ ] "New Document" button creates a blank document and opens the editor
- [ ] Clicking a document opens it in the editor
- [ ] Delete action removes a document from IndexedDB (with confirmation)
- [ ] Empty state message when no documents exist

#### Files to Create/Modify

- `packages/editor/src/components/DocumentList.tsx` — (create) Document list component
- `packages/editor/src/App.tsx` — (modify) Add routing between list view and editor view
- `packages/editor/src/hooks/useDocuments.ts` — (create) Hook for document list operations

#### Implementation Notes

Use simple React state management (no need for a router library). App state: `{ view: 'list' | 'editor', activeDocumentId?: string }`. The list component fetches documents via `listDocuments()` and renders them with manuscript styling. Use wired-elements for the "New Document" button and cards for document items.

#### Evaluation Checklist

- [ ] Document list renders documents from IndexedDB
- [ ] Create, open, and delete operations work

---

### T071: Implement Extension-Editor Data Sync

**PRD Reference:** Sprint 2, Task 7 (Extension <-> Web App communication)
**Depends on:** T068
**Blocks:** T072
**User Stories:** US-09
**Estimated scope:** 1 hour

#### Description

Sync AI knowledge pool and copy records from chrome.storage.local (populated by extension) to the editor's IndexedDB. Since the editor runs as a chrome-extension:// page, it has direct access to chrome.storage.

#### Acceptance Criteria

- [ ] On editor load, existing AI pool entries are synced from chrome.storage to IndexedDB
- [ ] On editor load, existing copy records are synced from chrome.storage to IndexedDB
- [ ] `chrome.storage.onChanged` listener triggers incremental sync for new entries
- [ ] Sync completes within 2 seconds for new entries
- [ ] Duplicate entries are not created (idempotent sync)
- [ ] Tests verify sync with mock chrome.storage data

#### Files to Create/Modify

- `packages/editor/src/sync/extension-sync.ts` — (create) Sync logic between chrome.storage and IndexedDB
- `packages/editor/src/hooks/useExtensionSync.ts` — (create) React hook wrapping sync lifecycle
- `packages/editor/src/__tests__/extension-sync.test.ts` — (create) Sync tests

#### Implementation Notes

Since the editor is a chrome-extension:// page, it has direct access to `chrome.storage.local`. On mount: (1) read all entries from chrome.storage, (2) upsert into IndexedDB. Then listen to `chrome.storage.onChanged` for incremental updates. Use `chrome.storage.local.get(STORAGE_KEYS.AI_POOL)` for bulk read. The sync should be one-way: extension → editor (editor never writes back to chrome.storage).

#### Evaluation Checklist

- [ ] Initial sync copies all entries from chrome.storage to IndexedDB
- [ ] Incremental sync adds new entries within 2 seconds

---

### T072: Implement Connection Status Indicator

**PRD Reference:** Sprint 2, Task 7 (Connection status indicator)
**Depends on:** T071
**Blocks:** Nothing
**User Stories:** US-09
**Estimated scope:** 30 min

#### Description

Add a visible indicator showing whether the extension data source is connected. This helps users understand when AI attribution data is available.

#### Acceptance Criteria

- [ ] Status indicator visible in the editor UI (top corner or toolbar area)
- [ ] Shows "Connected" (green dot) when chrome.storage is accessible and has data
- [ ] Shows "Disconnected" (gray dot) when chrome.storage is unavailable
- [ ] Status updates when connection state changes
- [ ] Styled with manuscript aesthetic (wired-elements or rough.js)

#### Files to Create/Modify

- `packages/editor/src/components/ConnectionStatus.tsx` — (create) Status indicator component
- `packages/editor/src/components/Editor.tsx` — (modify) Include status indicator

#### Implementation Notes

Check connectivity by attempting to read from chrome.storage. If `chrome.storage` is undefined (editor running outside extension context), show disconnected. If readable but empty, show connected with a note. Use a small dot or badge with text tooltip.

#### Evaluation Checklist

- [ ] Status indicator renders with correct state
- [ ] Indicator updates on connection change

---

### T073: Implement Graceful Degradation Without Extension

**PRD Reference:** Constraint: editor must work when extension is disconnected
**Depends on:** T071, T072
**Blocks:** Nothing
**User Stories:** US-09
**Estimated scope:** 30 min

#### Description

Ensure the editor functions correctly even when chrome extension APIs are unavailable. All features that depend on extension data should degrade gracefully.

#### Acceptance Criteria

- [ ] Editor loads and functions (typing, formatting, saving) without extension APIs
- [ ] When extension is unavailable, all typed text is treated as GREEN (no attribution)
- [ ] Paste events still work but without AI matching (all pastes treated as original)
- [ ] No console errors or crashes when chrome.storage is undefined
- [ ] Previously synced data remains available in IndexedDB
- [ ] Test verifies editor functions without mock chrome APIs

#### Files to Create/Modify

- `packages/editor/src/sync/extension-sync.ts` — (modify) Add try/catch guards around chrome.storage access
- `packages/editor/src/__tests__/graceful-degradation.test.ts` — (create) Tests without chrome API mocks

#### Implementation Notes

Wrap all `chrome.storage` calls in try/catch or check for `typeof chrome !== 'undefined' && chrome.storage`. Create a storage abstraction that returns empty results when the API is unavailable. The sync hook should set a `connected: false` state rather than throwing.

#### Evaluation Checklist

- [ ] Editor loads without errors in a context without chrome APIs
- [ ] Graceful degradation test passes
