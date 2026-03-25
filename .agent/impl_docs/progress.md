# Manum Implementation Progress

## Current Status

- **Phase:** 3 (complete)
- **Tasks completed:** 34 / 88
- **Test coverage:** 108 tests passing (unit + integration)
- **Last session:** 2026-03-25

## Phase Completion Workflow

Each phase follows an implement → review → fix cycle:

```
┌─────────────────────┐
│ Implement Phase N    │  Session K: build all tasks
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Review Phase N       │  Session K+1: read phase doc, run all checks,
│                      │  compare output against evaluation criteria
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │ Issues?    │
     └─────┬─────┘
       Yes │         No
           ▼          ▼
┌──────────────┐  ┌──────────────────┐
│ Fix issues   │  │ Proceed to       │
│ + re-review  │  │ Phase N+1        │
└──────┬───────┘  └──────────────────┘
       │
       └──► (back to Review)
```

**What happens in a review session:**
1. Re-read the phase document's evaluation criteria
2. Run every evaluation command — record which pass and fail
3. Run the *full* test suite (not just the phase's tests) — catch regressions
4. Check linting and type checking
5. Read through code changes for logic errors tests don't catch
6. Log all issues found, fix them, log fixes in progress.md
7. If any issues were structural (not just typos), do another review pass

**Typical pattern:** 1-3 review sessions per phase. Budget for them.

**H24: Use a different agent/session for reviews** when possible. Fresh context catches what the builder missed.

## Session Log

<!-- Agents: Add a new session entry after each implementation session. -->

### Session 1 — 2026-03-25

**Goal:** Implement Phase 1 — Foundation
**Completed:** T010, T011, T012, T013, T014, T015, T016, T017
**Infrastructure Updates Applied:** None
**Blockers:** None
**Discoveries:**
- pnpm wasn't installed; installed via sudo
- esbuild native binaries skipped by pnpm (approved build scripts); JS fallback works fine
- Extension package needed @types/node explicitly; ts-jest CJS mode needs separate tsconfig.test.json
- Shared package uses ESM .js extensions — Jest needs moduleNameMapper `'^(\\.{1,2}/.*)\\.js$': '$1'` to resolve
- Pre-existing .agent/ and docs/ files fail prettier — excluded via .prettierignore
**Changes:**
- `pnpm-workspace.yaml` — workspace config
- `package.json` — root with build/test/lint/verify/format scripts, husky+lint-staged config
- `.gitignore` — added standard ignores
- `.eslintrc.cjs` — root ESLint config (typescript-eslint + react-hooks + prettier)
- `.prettierrc` / `.prettierignore` — Prettier config excluding legacy docs
- `.husky/pre-commit` — lint-staged + full test run
- `packages/shared/` — TypeScript types: AttributionSpan, AIPoolEntry, CopyRecord, TabEvent, events
- `packages/editor/` — Vite+React app, vitest config, smoke test
- `packages/extension/` — Manifest V3, esbuild script, Jest config, manifest test + smoke test
**Coverage:** N/A (smoke tests only)
**Quality:** All evaluation criteria pass — `pnpm verify` exits 0
**Next:** Phase 1 review pass

### Session 2 — 2026-03-25

**Goal:** Implement Phase 2 — Capture Layer
**Completed:** T030, T031, T032, T033, T034, T035, T036, T037, T038, T039, T040, T041
**Infrastructure Updates Applied:**
- Added `"chrome"` to `types` in both `tsconfig.json` and `tsconfig.test.json` to include `@types/chrome` declarations
- Installed `jest-environment-jsdom` for DOM-dependent tests
**Blockers:** None
**Discoveries:**
- tsconfig.test.json explicitly listed types as `["node", "jest"]`, excluding `@types/chrome`; added `"chrome"` to both tsconfigs
- `jest-environment-jsdom` not installed; added as devDependency with `pnpm --filter @manum/extension add -D jest-environment-jsdom`
- DOM-dependent test files need `@jest-environment jsdom` docblock (selectors, observer, copy-listener, debounce, visibility-tracker, content-integration)
- Chrome module-level globals (e.g., `chrome.runtime.getURL`) must be deferred to function scope or they throw when module first loads in tests
- Async clipboard tests with fake timers require synchronous mock callbacks to avoid deadlock; `jest.runAllTimers()` fires setTimeout but not microtasks, so async mock chains need synchronous paths
- Integration test async flush: after `jest.advanceTimersByTime()`, need multiple `await Promise.resolve()` iterations to drain the async chain (get → set pipeline)
**Changes:**
- `packages/extension/src/content/selectors.ts` — DOM selector module (T030)
- `packages/extension/src/content/observer.ts` — MutationObserver with SPA re-attach (T031)
- `packages/extension/src/content/debounce.ts` — 1s streaming debounce (T032)
- `packages/extension/src/storage/ai-pool.ts` — AI pool storage operations (T033)
- `packages/extension/src/content/index.ts` — wired full capture pipeline (T034)
- `packages/extension/src/content/copy-listener.ts` — copy event capture (T035)
- `packages/extension/src/storage/copy-records.ts` — copy record storage (T036)
- `packages/extension/src/background/tab-tracker.ts` — tab activation + visibility message handling (T037, T038)
- `packages/extension/src/content/visibility-tracker.ts` — visibilitychange → service worker message (T038)
- `packages/extension/src/offscreen/offscreen.ts` — already implemented in Phase 1 (T039)
- `packages/extension/src/background/clipboard.ts` — offscreen clipboard proxy (T040)
- `packages/extension/src/storage/keys.ts` + `manager.ts` — typed storage access + LRU eviction (T041)
- `packages/extension/src/background/service-worker.ts` — wired tab tracker
- 11 new test files covering all new modules
**Coverage:** 75 tests, all passing; covers selectors, observer, debounce, storage, copy, tab tracking, visibility, clipboard, and integration pipeline
**Quality:** `pnpm -r test` → 75 passed; `pnpm lint` → 0 warnings; `pnpm build` → clean
**Next:** Phase 2 review pass, then Phase 3 — Editor Core

### Session 3 — 2026-03-25

**Goal:** Implement Phase 3 — Editor Core, Aesthetic, Persistence, and Sync
**Completed:** T060, T061, T062, T063, T064, T065, T066, T067, T068, T069, T070, T071, T072, T073
**Infrastructure Updates Applied:**
- Installed `@tiptap/react`, `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/pm`, `roughjs`, `wired-elements`, `idb` as production deps
- Installed `fake-indexeddb`, `@types/chrome` as devDependencies
- `@types/roughjs` does not exist in npm registry; roughjs ships its own `.d.ts` files
**Blockers:** None
**Discoveries:**
- TipTap v3 (3.20.5) `getJSON()` returns typed `DocumentType` (not `JSONContent`), with `NodeType | TextType` content — using `as JSONContent` cast in tests and hooks avoids type narrowing issues
- TipTap v3 `StarterKit` API changed: `history` option renamed to `undoRedo`; `document` and `text` options only accept `false` (not `{}`)
- `@typescript-eslint/no-namespace` forbids `declare global { namespace JSX {} }` — used `declare module 'react'` augmentation in a separate `.d.ts` file for wired-elements custom element types
- `fake-indexeddb/auto` installs a single global IndexedDB that persists across tests in the same file; isolation requires passing unique DB names per test via extended `resetDB(name?)` API
- Fake timers + IndexedDB promise resolution deadlock: tests that use `vi.useFakeTimers()` with real idb calls time out; workaround is to mock `updateDocument` in timer-dependent tests and only use real timers for IDB verification
**Changes:**
- `packages/editor/src/styles/` — `fonts.css`, `theme.css`, `texture.css`, `index.css` (manuscript palette)
- `packages/editor/src/editor/schema.ts` — TipTap StarterKit coreExtensions
- `packages/editor/src/editor/marks/attribution.ts` — AttributionMark with full attribute set
- `packages/editor/src/editor/nodes/branch-marker.ts` — BranchMarkerNode (inline atom)
- `packages/editor/src/components/ui/WiredButton.tsx` — wired-button wrapper
- `packages/editor/src/components/ui/WiredToggle.tsx` — wired-toggle wrapper
- `packages/editor/src/components/ui/RoughBorder.tsx` — rough.js SVG border component
- `packages/editor/src/hooks/useRoughCanvas.ts` — reusable rough.js canvas hook
- `packages/editor/src/components/Toolbar.tsx` — formatting toolbar
- `packages/editor/src/components/ConnectionStatus.tsx` — extension connectivity indicator
- `packages/editor/src/storage/db.ts` — IndexedDB schema via idb (documents, ai_pool, copy_records)
- `packages/editor/src/storage/documents.ts` — CRUD: createDocument, getDocument, updateDocument, deleteDocument, listDocuments
- `packages/editor/src/hooks/useAutoSave.ts` — debounced auto-save hook with save status
- `packages/editor/src/hooks/useDocuments.ts` — document list management hook
- `packages/editor/src/sync/extension-sync.ts` — chrome.storage → IndexedDB one-way sync
- `packages/editor/src/hooks/useExtensionSync.ts` — sync hook with connection state tracking
- `packages/editor/src/components/DocumentList.tsx` — document picker screen
- `packages/editor/src/components/Editor.tsx` — full ManumEditor component
- `packages/editor/src/App.tsx` — list/editor routing
- `packages/editor/src/types/wired-elements.d.ts` — custom element type declarations
- 7 new test files: schema, attribution-mark, branch-marker, documents, auto-save, extension-sync, graceful-degradation
**Coverage:** 33 editor tests + 75 extension tests = 108 total, all passing
**Quality:** `pnpm -r test` → 108 passed; `pnpm lint` → 0 warnings; `tsc --noEmit` → clean; `pnpm build` → clean
**Next:** Phase 3 review pass, then Phase 4 — RED Attribution
