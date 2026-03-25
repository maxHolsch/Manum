# Phase 1: Project Foundation

## Prerequisites

- Node.js 18+ and pnpm installed
- Chrome browser available for extension development
- No prior codebase exists — this is a greenfield project

## Phase Goal

A fully scaffolded monorepo with shared types, build tooling, test infrastructure, and linting — ready for feature development across the extension and editor packages.

## Phase Evaluation Criteria

- `pnpm install` completes without errors
- `pnpm -r build` builds all three packages (shared, extension, editor) without errors
- `pnpm --filter editor test` runs Vitest with at least one passing test
- `pnpm --filter extension test` runs Jest with at least one passing test
- `pnpm lint` runs ESLint across all packages with zero errors
- `pnpm format:check` verifies Prettier formatting with zero violations
- Extension loads in Chrome via `chrome://extensions` (developer mode) without errors
- Editor opens as a `chrome-extension://` page with a blank React app rendering
- Shared types are importable from both editor and extension packages
- Pre-commit hook runs lint + tests and completes in under 30 seconds

---

## Tasks

### T010: Initialize Monorepo with pnpm Workspaces

**PRD Reference:** Architecture Overview (monorepo structure)
**Depends on:** Nothing
**Blocks:** T011, T012, T015
**User Stories:** US-01
**Estimated scope:** 30 min

#### Description

Create the root monorepo structure with pnpm workspaces. Set up `packages/extension`, `packages/editor`, and `packages/shared` directories with their own `package.json` files. Configure the root `pnpm-workspace.yaml` and root `package.json` with shared scripts.

#### Acceptance Criteria

- [ ] Root `pnpm-workspace.yaml` lists all three packages
- [ ] Each package has its own `package.json` with appropriate `name` field (e.g., `@manum/editor`, `@manum/extension`, `@manum/shared`)
- [ ] `pnpm install` succeeds from the root
- [ ] Root `package.json` has scripts for `build`, `test`, `lint` that run across all packages

#### Files to Create/Modify

- `pnpm-workspace.yaml` — (create) workspace configuration
- `package.json` — (create) root package with shared scripts and devDependencies
- `packages/editor/package.json` — (create) editor package manifest
- `packages/extension/package.json` — (create) extension package manifest
- `packages/shared/package.json` — (create) shared types package manifest
- `.gitignore` — (create) ignore node_modules, dist, .env, coverage

#### Implementation Notes

Use pnpm workspaces (not npm or yarn). Root scripts should use `pnpm -r` for recursive operations. The editor and extension packages should declare `@manum/shared` as a workspace dependency using `"workspace:*"`.

#### Evaluation Checklist

- [ ] `pnpm install` completes without errors
- [ ] `pnpm -r list` shows all three packages

---

### T011: Configure Vite + React + TypeScript for Editor Package

**PRD Reference:** Sprint 2, Task 1 (React + TipTap editor setup); Architecture Overview (tech stack)
**Depends on:** T010
**Blocks:** T013, T014
**User Stories:** US-01
**Estimated scope:** 1 hour

#### Description

Set up the editor package with Vite, React 18, and TypeScript. Configure it to build as a chrome-extension page (HTML entry point). The output should be a static HTML/JS bundle that can be loaded by the extension's manifest.

#### Acceptance Criteria

- [ ] `pnpm --filter editor dev` starts a Vite dev server serving a React app
- [ ] `pnpm --filter editor build` produces a `dist/` directory with `index.html`, JS, and CSS
- [ ] TypeScript strict mode is enabled
- [ ] React 18 renders a simple "Hello Manum" component
- [ ] `tsconfig.json` is configured with path aliases for `@manum/shared`

#### Files to Create/Modify

- `packages/editor/vite.config.ts` — (create) Vite config with React plugin
- `packages/editor/tsconfig.json` — (create) TypeScript config
- `packages/editor/index.html` — (create) HTML entry point
- `packages/editor/src/main.tsx` — (create) React entry point
- `packages/editor/src/App.tsx` — (create) Root App component (placeholder)

#### Implementation Notes

Use `@vitejs/plugin-react` for React support. Set `base: './'` in Vite config so assets use relative paths (required for chrome-extension:// pages). TypeScript `strict: true`. The editor will eventually be loaded as a chrome-extension page, so ensure the build output is self-contained.

#### Evaluation Checklist

- [ ] `pnpm --filter editor build` succeeds
- [ ] Opening `dist/index.html` in a browser shows the React app

---

### T012: Create Manifest V3 Extension Scaffolding

**PRD Reference:** Sprint 1, Task 1 (Manifest V3 scaffolding)
**Depends on:** T010
**Blocks:** T013, T014
**User Stories:** US-01
**Estimated scope:** 1 hour

#### Description

Create the Chrome extension with Manifest V3 structure. Set up `manifest.json` with the required permissions, content script entry for claude.ai, service worker, offscreen document entry, and the editor as a chrome-extension page.

#### Acceptance Criteria

- [ ] `manifest.json` is valid Manifest V3 with correct permissions
- [ ] Content script targets `claude.ai` pages
- [ ] Service worker entry point exists and loads
- [ ] Offscreen document HTML exists
- [ ] Editor page is registered in `manifest.json` (e.g., as a side panel or chrome_url_overrides)
- [ ] Extension loads in Chrome developer mode without errors

#### Files to Create/Modify

- `packages/extension/manifest.json` — (create) Manifest V3 configuration
- `packages/extension/src/content/index.ts` — (create) Content script entry point (empty)
- `packages/extension/src/background/service-worker.ts` — (create) Service worker entry point (empty)
- `packages/extension/src/offscreen/offscreen.html` — (create) Offscreen document HTML
- `packages/extension/src/offscreen/offscreen.ts` — (create) Offscreen document script (empty)
- `packages/extension/build.mjs` — (create) Build script using esbuild or Vite to bundle TS files

#### Implementation Notes

Permissions needed: `storage`, `unlimitedStorage`, `tabs`, `clipboardRead`, `offscreen`. Host permission: `*://claude.ai/*`. Content script should match `https://claude.ai/*`. The editor page can be referenced via `chrome_url_overrides` for newtab or as a standalone page in `web_accessible_resources`. Use a simple esbuild script or Vite config to compile TypeScript to JS for the extension. CRXJS Vite Plugin is an option but a simpler approach (manual Vite config or esbuild) may be more reliable initially.

#### Evaluation Checklist

- [ ] Extension loads in `chrome://extensions` (developer mode) without errors
- [ ] Content script injects on claude.ai pages (verify via console log)

---

### T013: Configure Vitest for Editor and Jest for Extension

**PRD Reference:** Architecture Overview (testing tools)
**Depends on:** T011, T012
**Blocks:** T016
**User Stories:** US-01
**Estimated scope:** 30 min

#### Description

Set up Vitest as the test runner for the editor package and Jest as the test runner for the extension package. Create a smoke test in each package to verify the test runners work.

#### Acceptance Criteria

- [ ] `pnpm --filter editor test` runs Vitest and passes at least one test
- [ ] `pnpm --filter extension test` runs Jest and passes at least one test
- [ ] Vitest is configured with jsdom environment for React component testing
- [ ] Jest is configured with ts-jest for TypeScript support
- [ ] Code coverage can be generated for both packages

#### Files to Create/Modify

- `packages/editor/vitest.config.ts` — (create) Vitest configuration
- `packages/editor/src/__tests__/smoke.test.ts` — (create) Smoke test
- `packages/extension/jest.config.ts` — (create) Jest configuration
- `packages/extension/tsconfig.json` — (create) TypeScript config for extension
- `packages/extension/src/__tests__/smoke.test.ts` — (create) Smoke test

#### Implementation Notes

Vitest should use `environment: 'jsdom'` for DOM testing. Jest should use `ts-jest` preset. Both configs should resolve `@manum/shared` imports. Add `test` scripts to each package's `package.json`.

#### Evaluation Checklist

- [ ] `pnpm --filter editor test` passes
- [ ] `pnpm --filter extension test` passes

---

### T014: Set Up ESLint + Prettier Across All Packages

**PRD Reference:** Architecture Overview (ESLint + Prettier)
**Depends on:** T011, T012
**Blocks:** T016
**User Stories:** US-01
**Estimated scope:** 30 min

#### Description

Configure ESLint with TypeScript and React rules, and Prettier for code formatting across all packages. Use a shared ESLint config at the root.

#### Acceptance Criteria

- [ ] `pnpm lint` runs ESLint across all packages
- [ ] `pnpm format:check` verifies Prettier formatting
- [ ] `pnpm format` auto-formats all files
- [ ] ESLint catches TypeScript errors and React hook violations
- [ ] No lint errors in the existing codebase

#### Files to Create/Modify

- `.eslintrc.cjs` or `eslint.config.mjs` — (create) Root ESLint configuration
- `.prettierrc` — (create) Prettier configuration
- `.prettierignore` — (create) Prettier ignore patterns
- `package.json` — (modify) Add lint and format scripts

#### Implementation Notes

Use `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` for TypeScript. Use `eslint-plugin-react-hooks` for React. Prettier should be integrated via `eslint-config-prettier` to avoid conflicts. Keep rules pragmatic — don't over-configure.

#### Evaluation Checklist

- [ ] `pnpm lint` exits with code 0
- [ ] `pnpm format:check` exits with code 0

---

### T015: Create Shared TypeScript Types Package

**PRD Reference:** Architecture Overview (shared types); Attribution Model (data schema)
**Depends on:** T010
**Blocks:** T016
**User Stories:** US-01
**Estimated scope:** 1 hour

#### Description

Create the `@manum/shared` package with TypeScript type definitions for attribution spans, storage schemas, and event types. These types are the contract between the extension and editor packages.

#### Acceptance Criteria

- [ ] `AttributionSpan` interface matches the PRD data schema
- [ ] Storage schemas defined for AI knowledge pool entries, copy records, and tab events
- [ ] Event type definitions for extension-editor communication
- [ ] Types are importable from `@manum/shared` in both editor and extension
- [ ] Package builds with `tsc` and outputs `.d.ts` files

#### Files to Create/Modify

- `packages/shared/src/index.ts` — (create) Re-exports all types
- `packages/shared/src/attribution.ts` — (create) AttributionSpan and related types
- `packages/shared/src/storage.ts` — (create) Storage schema types (AIPoolEntry, CopyRecord, TabEvent)
- `packages/shared/src/events.ts` — (create) Event message types for extension-editor communication
- `packages/shared/tsconfig.json` — (create) TypeScript config with declaration output

#### Implementation Notes

The `AttributionSpan` interface should match the PRD schema exactly:
```typescript
interface AttributionSpan {
  start: number;
  end: number;
  color: 'green' | 'yellow' | 'red';
  confidence: number;
  scoring_mode: 'edit-distance' | 'llm-judge';
  paste_event_id?: string;
  original_paste_content?: string;
  edit_distance_from_paste?: number;
  matched_ai_entries?: {
    ai_message_id: string;
    overlap_score: number;
    method: string;
    ai_timestamp: number;
  }[];
  created_at: number;
  last_modified: number;
}
```

Storage types: `AIPoolEntry` (messageId, text, timestamp, conversationId), `CopyRecord` (selectedText, sourceMessageId, timestamp), `TabEvent` (tabType: 'editor' | 'claude' | 'other', timestamp, url).

#### Evaluation Checklist

- [ ] `pnpm --filter shared build` succeeds
- [ ] Types can be imported in editor and extension packages without errors

---

### T016: Set Up Pre-Commit Hook

**PRD Reference:** Architecture Overview (pre-commit hook)
**Depends on:** T013, T014, T015
**Blocks:** T017
**User Stories:** US-01
**Estimated scope:** 15 min

#### Description

Set up a pre-commit hook using husky and lint-staged that runs lint and unit tests before each commit. The hook must complete in under 30 seconds.

#### Acceptance Criteria

- [ ] Pre-commit hook runs on `git commit`
- [ ] Hook runs ESLint on staged files
- [ ] Hook runs Prettier on staged files
- [ ] Hook runs unit tests
- [ ] Hook completes in under 30 seconds
- [ ] Hook prevents commit if lint or tests fail

#### Files to Create/Modify

- `.husky/pre-commit` — (create) Hook script
- `package.json` — (modify) Add husky and lint-staged configuration
- `.lintstagedrc` or `package.json` — (modify) lint-staged config

#### Implementation Notes

Use `husky` for git hooks and `lint-staged` for running lint only on staged files. For tests, run only unit tests (not integration or E2E). The 30-second budget means tests must be fast — ensure test configs don't include slow integration tests.

#### Evaluation Checklist

- [ ] `git commit` triggers the pre-commit hook
- [ ] Hook completes in under 30 seconds (time it)

---

### T017: Verify Full Build Pipeline

**PRD Reference:** Architecture Overview
**Depends on:** T010, T011, T012, T013, T014, T015, T016
**Blocks:** Nothing (end of phase)
**User Stories:** US-01
**Estimated scope:** 30 min

#### Description

Create a CI-ready build verification script that builds all packages, runs all tests, and verifies the extension can be loaded. This task ensures the full pipeline works end-to-end before moving to feature development.

#### Acceptance Criteria

- [ ] A single command (`pnpm verify` or similar) builds all packages, runs all tests, and runs lint
- [ ] Extension `dist/` directory contains a valid `manifest.json` and all referenced files
- [ ] Editor `dist/` directory contains `index.html` and bundled assets
- [ ] All smoke tests pass
- [ ] No TypeScript errors across any package

#### Files to Create/Modify

- `package.json` — (modify) Add `verify` script that chains build + test + lint
- `packages/extension/src/__tests__/manifest.test.ts` — (create) Test that validates manifest.json structure

#### Implementation Notes

The verify script should be: `pnpm -r build && pnpm -r test && pnpm lint`. Add a Jest test in the extension package that reads the built `manifest.json` and verifies required fields exist (permissions, content_scripts, background, etc.).

#### Evaluation Checklist

- [ ] `pnpm verify` exits with code 0
- [ ] All 8 phase evaluation criteria pass
