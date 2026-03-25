# Manum — Master Task List

## How to Use This Document

- Tasks are numbered T010-T181 sequentially
- [P] = parallelizable with other [P] tasks in same phase
- Check off tasks as completed: `- [x] T010 ...`
- Dependencies noted as "depends: T001, T003"
- Each phase has a detailed doc in `phaseN_*.md`

## Progress Summary

- **Total tasks:** 88
- **Completed:** 0
- **In progress:** 0
- **Blocked:** 0
- **Remaining:** 88

---

## Phase 1 — Foundation (depends: nothing)

> Detailed specs: [phase1_foundation.md](phase1_foundation.md)

### Task 1.1: Monorepo & Build Infrastructure (F0)

- [ ] T010 Initialize monorepo with pnpm workspaces (depends: nothing)
- [ ] T011 Configure Vite + React + TypeScript for editor package (depends: T010)
- [ ] T012 Create Manifest V3 extension scaffolding (depends: T010)
- [ ] T013 Configure Vitest for editor and Jest for extension (depends: T011, T012)
- [ ] T014 Set up ESLint + Prettier across all packages (depends: T011, T012)
- [ ] T015 Create shared TypeScript types package (depends: T010)
- [ ] T016 Set up pre-commit hook (depends: T013, T014, T015)
- [ ] T017 Verify full build pipeline (depends: T010, T011, T012, T013, T014, T015, T016)

---

## Phase 2 — Capture Layer (depends: Phase 1)

> Detailed specs: [phase2_capture.md](phase2_capture.md)

### Task 2.1: AI Response Capture (F1)

- [ ] T030 Create isolated DOM selector module for Claude.ai (depends: nothing)
- [ ] T031 Implement MutationObserver for AI response detection (depends: T030)
- [ ] T032 Implement streaming debounce for message capture (depends: T031)
- [ ] T033 [P] Implement AI knowledge pool storage (depends: T032)
- [ ] T034 Wire up content script: observer → debounce → storage (depends: T031, T032, T033)

### Task 2.2: Copy Event Capture (F2)

- [ ] T035 Implement copy event listener (depends: T030)
- [ ] T036 Store copy records in chrome.storage (depends: T035)

### Task 2.3: Tab Focus Tracking (F3)

- [ ] T037 Implement tab focus tracking in service worker (depends: nothing)
- [ ] T038 [P] Implement visibility change tracking in content script (depends: T037)

### Task 2.4: Offscreen Clipboard Access (F4)

- [ ] T039 Create offscreen document for clipboard access (depends: nothing)
- [ ] T040 Implement clipboard read message passing (depends: T039)

### Task 2.5: Storage Management (F0)

- [ ] T041 Define storage schema and management utilities (depends: T033)

---

## Phase 3 — Editor Core & Aesthetic (depends: Phase 1, Phase 2)

> Detailed specs: [phase3_editor_core.md](phase3_editor_core.md)

### Task 3.1: TipTap Editor Setup (F5)

- [ ] T060 Set up TipTap editor with React (depends: nothing)
- [ ] T061 Implement section-based document model (depends: T060)
- [ ] T062 Create formatting toolbar (depends: T060)
- [ ] T063 Implement custom TipTap marks for attribution spans (depends: T060)
- [ ] T064 Implement custom TipTap nodes for branch markers (depends: T060, T061)

### Task 3.2: Manuscript Aesthetic Foundation (F25)

- [ ] T065 Set up manuscript aesthetic foundation (depends: T060)
- [ ] T066 Integrate wired-elements for UI controls (depends: T065)
- [ ] T067 Integrate rough.js for hand-drawn shapes (depends: T065)

### Task 3.3: Document Persistence (F9)

- [ ] T068 Create IndexedDB persistence layer (depends: T061, T063)
- [ ] T069 Implement auto-save with debounced writes (depends: T068)
- [ ] T070 Create document list view (depends: T068)

### Task 3.4: Extension-Editor Data Sync (F10)

- [ ] T071 Implement extension-editor data sync (depends: T068)
- [ ] T072 Implement connection status indicator (depends: T071)
- [ ] T073 Implement graceful degradation without extension (depends: T071, T072)

---

## Phase 4 — RED Attribution & Edit Tracking (depends: Phase 3)

> Detailed specs: [phase4_red_attribution.md](phase4_red_attribution.md)

### Task 4.1: Paste Detection (F6)

- [ ] T090 Implement paste event listener on TipTap editor (depends: nothing)
- [ ] T091 Implement copy record matching for paste attribution (depends: T090)
- [ ] T092 Implement RED span tagging with source metadata (depends: T091)
- [ ] T093 Implement unlinked paste fallback (depends: T090)

### Task 4.2: Edit Distance Tracking (F7)

- [ ] T094 Implement character-level Levenshtein distance (depends: T092)
- [ ] T095 Implement edit distance tracking per RED span (depends: T094)
- [ ] T096 Implement state transitions (RED→YELLOW→GREEN) (depends: T095)

### Task 4.3: Attribution Overlay UI (F8)

- [ ] T097 Implement attribution overlay toggle button (depends: nothing)
- [ ] T098 Implement span highlighting (green/yellow/red backgrounds) (depends: T097)
- [ ] T099 Implement yellow gradient based on edit distance (depends: T098)
- [ ] T100 Implement summary bar with percentage breakdown (depends: T098)

---

## Phase 5 — YELLOW Attribution & Git Branching (depends: Phase 4)

> Detailed specs: [phase5_yellow_branching.md](phase5_yellow_branching.md)

### Task 5.1: Temporal Gating (F13)

- [ ] T120 Implement temporal gating — timestamp tracking (depends: nothing)
- [ ] T121 Implement temporal gating — AI pool query filtering (depends: T120)

### Task 5.2: YELLOW Attribution / Idea Overlap (F11)

- [ ] T122 Implement text segmentation into sentence-level chunks (depends: nothing)
- [ ] T123 Implement n-gram extraction and overlap scoring (depends: T121, T122)
- [ ] T124 [P] Implement keyword/entity overlap detection (depends: T122)
- [ ] T125 Implement combined score to yellow intensity mapping (depends: T123, T124)
- [ ] T126 [P] Implement automatic YELLOW scoring on sync (depends: T125)

### Task 5.3: LLM Judge Scoring Mode (F12)

- [ ] T127 Implement LLM judge — Anthropic API integration (depends: T125)
- [ ] T128 Implement LLM judge — batch processing and caching (depends: T127)
- [ ] T129 Implement LLM judge — fallback to edit-distance mode (depends: T128)

### Task 5.4: Git Integration (F14)

- [ ] T130 Initialize isomorphic-git repository in IndexedDB (depends: nothing)
- [ ] T131 Implement auto-commit on save (depends: T130)
- [ ] T132 Implement commit metadata (depends: T131)
- [ ] T133 Implement git log and diff operations (depends: T130, T131)

### Task 5.5: Branch Creation (F15)

- [ ] T134 Implement branch creation from tree (depends: T133)
- [ ] T135 Implement branch list UI and branch switching (depends: T134)
- [ ] T136 Implement selection-based branch creation (depends: T135)
- [ ] T137 Implement L-shaped branch markers in editor (depends: T136)

### Task 5.6: Branch Preview & Merge (F16, F17)

- [ ] T138 Implement branch preview horizontal scroller (depends: T134, T135)
- [ ] T139 Implement three-way merge for branch merging (depends: T134, T135)
- [ ] T140 Implement merge conflict UI (depends: T139)

---

## Phase 6 — Visualization, Analytics & Polish (depends: Phase 5)

> Detailed specs: [phase6_visualization_polish.md](phase6_visualization_polish.md)

### Task 6.1: Commit Timeline (F18)

- [ ] T160 Implement commit timeline in side drawer (depends: nothing)
- [ ] T161 Implement hand-drawn SVG connector lines (depends: T160)
- [ ] T162 Implement timeline entry click navigation (depends: T160)

### Task 6.2: LLM Commit Metadata (F19)

- [ ] T163 Implement LLM-generated commit metadata (depends: T160)
- [ ] T164 Implement commit metadata fallback (depends: T163)

### Task 6.3: Diff Scrubbing (F20)

- [ ] T165 Implement diff scrubbing view (depends: T160, T162)
- [ ] T166 Implement diff highlighting (additions/deletions) (depends: T165)

### Task 6.4: Behavioral Analytics (F21)

- [ ] T167 Implement behavioral analytics event bus (depends: nothing)
- [ ] T168 Implement session aggregation and storage (depends: T167)

### Task 6.5: Analytics Dashboard (F22)

- [ ] T169 Implement analytics dashboard — attribution summary bar (depends: T168)
- [ ] T170 Implement analytics dashboard — session timeline chart (depends: T169)
- [ ] T171 [P] Implement analytics dashboard — editing pattern charts (depends: T169)

### Task 6.6: Cross-Project Comparison (F23)

- [ ] T172 Implement cross-project comparison view (depends: T169)
- [ ] T173 Implement cross-project trend chart (depends: T172)

### Task 6.7: Settings Panel (F24)

- [ ] T174 Implement settings panel — scoring mode toggle (depends: nothing)
- [ ] T175 Implement settings panel — connection & API key (depends: T174)
- [ ] T176 Implement settings panel — storage & export (depends: T174)

### Task 6.8: Navigation & Polish (F26)

- [ ] T177 Implement bottom nav bar (depends: nothing)
- [ ] T178 Implement side drawer animations (depends: T177)
- [ ] T179 Implement keyboard shortcuts (depends: T177)
- [ ] T180 Implement onboarding flow (depends: T177)
- [ ] T181 Final UI polish and aesthetic refinements (depends: T177, T178, T180)
