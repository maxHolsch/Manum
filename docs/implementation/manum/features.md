# Manum Feature Registry

## Overview

27 features organized in 4 phases. Features must be built in dependency order.
Phases map to PRD sprints: Capture Layer, Editor + RED, YELLOW + Branching, Visualization + Analytics + Polish.

### User Decisions Applied

- **Hosting:** Editor runs as a `chrome-extension://` page (simplest chrome.storage access)
- **Codebase:** Monorepo with shared packages (`packages/extension`, `packages/editor`, `packages/shared`)
- **Edit distance:** Character-level Levenshtein distance
- **LLM judge:** Direct Anthropic API calls from browser (no proxy)
- **Aesthetic:** Established upfront from Phase 2 (not deferred to polish phase)

## Dependency Diagram

```
Phase 1: Foundation & Capture
─────────────────────────────
  F0 (Scaffolding)
  ├──► F1 (AI Capture)
  │    └──► F2 (Copy Capture)
  ├──► F3 (Tab Tracking)
  └──► F4 (Offscreen Clipboard)

Phase 2: Editor Core + RED Attribution
──────────────────────────────────────
  F0 ──► F5 (TipTap Editor)
         ├──► F25 (Aesthetic Foundation)
         ├──► F9 (Persistence)
         │    └──► F10 (Ext-Editor Sync) ◄── F1, F2
         │         └──► F6 (RED Attribution)
         │              ├──► F7 (Edit Distance Tracking)
         │              │    └──► F8 (Overlay UI) ◄── F6
         │              └────────┘
         └───────────────────────┘

Phase 3: YELLOW Attribution + Git Branching
───────────────────────────────────────────
  F9 ──► F13 (Temporal Gating)
         └──► F11 (YELLOW Attribution) ◄── F10
              └──► F12 (LLM Judge)

  F9 ──► F14 (Git Integration)
         ├──► F15 (Branch Creation)
         │    ├──► F16 (Branch Preview)
         │    └──► F17 (Branch Merge)
         └────────────────────────┘

Phase 4: Visualization, Analytics & Polish
──────────────────────────────────────────
  F14 ──► F18 (Commit Timeline)
          ├──► F19 (LLM Commit Metadata)
          └──► F20 (Diff Scrubbing)

  F9, F3 ──► F21 (Behavioral Analytics)
             └──► F22 (Analytics Dashboard)
                  └──► F23 (Cross-Project Comparison)

  F12, F10 ──► F24 (Settings Panel)

  F25, F22 ──► F26 (UI Polish & Onboarding)
```

## Feature List

### F0: Project Scaffolding & Build Infrastructure

- **Priority:** 1
- **Phase:** 1 — Foundation & Capture Layer
- **Status:** [ ] Not started
- **Depends on:** None
- **Blocks:** F1, F2, F3, F4, F5
- **User Stories:** US-01
- **Tasks:** TBD
- **PRD Reference:** Architecture Overview (tech stack, monorepo structure, testing tools)
- **Key Deliverables:**
  - Monorepo structure with `packages/extension`, `packages/editor`, `packages/shared`
  - Vite + React + TypeScript configuration for editor package
  - Manifest V3 extension scaffolding (manifest.json, content script entry, service worker, offscreen document)
  - Vitest config (editor), Jest config (extension)
  - ESLint + Prettier configuration
  - Pre-commit hook running tests (< 30 seconds)
  - Shared TypeScript types package (attribution spans, storage schemas, events)

### F1: AI Response Capture

- **Priority:** 2
- **Phase:** 1 — Foundation & Capture Layer
- **Status:** [ ] Not started
- **Depends on:** F0
- **Blocks:** F2, F10
- **User Stories:** US-02
- **Tasks:** TBD
- **PRD Reference:** Sprint 1, Task 2 (AI response extraction content script)
- **Key Deliverables:**
  - Content script injected on claude.ai pages
  - MutationObserver on conversation container detecting assistant messages
  - Streaming debounce (wait for message to stop growing before capture)
  - AI knowledge pool entries stored in chrome.storage.local with message ID, text, timestamp
  - Isolated selector module for easy updates when Claude.ai DOM changes
  - `unlimitedStorage` permission in manifest

### F2: Copy Event Capture

- **Priority:** 3
- **Phase:** 1 — Foundation & Capture Layer
- **Status:** [ ] Not started
- **Depends on:** F0, F1
- **Blocks:** F10
- **User Stories:** US-03
- **Tasks:** TBD
- **PRD Reference:** Sprint 1, Task 3 (Copy event listener)
- **Key Deliverables:**
  - Copy event listener on claude.ai pages
  - Capture of selected text, source message ID, and timestamp
  - Copy records stored in chrome.storage.local for later paste matching

### F3: Tab Focus Tracking

- **Priority:** 2
- **Phase:** 1 — Foundation & Capture Layer
- **Status:** [ ] Not started
- **Depends on:** F0
- **Blocks:** F21
- **User Stories:** US-04
- **Tasks:** TBD
- **PRD Reference:** Sprint 1, Task 4 (Tab tracking)
- **Key Deliverables:**
  - chrome.tabs.onActivated listener in service worker
  - document.visibilitychange listener in content scripts
  - Timestamped tab-switch event log (editor vs. Claude.ai vs. other)

### F4: Offscreen Clipboard Access

- **Priority:** 3
- **Phase:** 1 — Foundation & Capture Layer
- **Status:** [ ] Not started
- **Depends on:** F0
- **Blocks:** F6
- **User Stories:** US-05
- **Tasks:** TBD
- **PRD Reference:** Sprint 1, Task 5 (Offscreen document for clipboard)
- **Key Deliverables:**
  - Offscreen document created via chrome.offscreen.createDocument()
  - Message passing between service worker and offscreen document
  - navigator.clipboard.readText() for unlinked paste fallback

### F5: TipTap Rich Text Editor

- **Priority:** 4
- **Phase:** 2 — Editor Core + RED Attribution
- **Status:** [ ] Not started
- **Depends on:** F0
- **Blocks:** F25, F9, F6
- **User Stories:** US-06
- **Tasks:** TBD
- **PRD Reference:** Sprint 2, Task 1 (React + TipTap editor setup)
- **Key Deliverables:**
  - React + TipTap editor with section-based (paragraph-level) document model
  - Basic formatting toolbar (bold, italic, headings)
  - Editor rendered as chrome-extension:// page
  - Centered 768px column layout
  - Custom TipTap marks for attribution spans
  - Custom TipTap nodes for branch markers

### F25: Manuscript Aesthetic Foundation

- **Priority:** 5
- **Phase:** 2 — Editor Core + RED Attribution
- **Status:** [ ] Not started
- **Depends on:** F5
- **Blocks:** F26
- **User Stories:** US-07
- **Tasks:** TBD
- **PRD Reference:** UI Design Direction, Visual/UI library stack table
- **Key Deliverables:**
  - Special Elite (body), Courier Prime (metadata), Caveat (handwriting) fonts loaded
  - Warm parchment color palette (#FBF3E3, #FFF8EF, #E1D9CA)
  - PaperCSS integration or custom sketchy CSS
  - Paper texture overlays via css-doodle + feTurbulence SVG filters (5% opacity)
  - rough.js integration for hand-drawn shapes and borders
  - wired-elements for basic UI controls (buttons, toggles, inputs)
  - Slight card rotations (-0.5deg to 1.5deg) for handcrafted feel

### F9: Document Persistence

- **Priority:** 5
- **Phase:** 2 — Editor Core + RED Attribution
- **Status:** [ ] Not started
- **Depends on:** F5
- **Blocks:** F10, F13, F14, F21
- **User Stories:** US-08
- **Tasks:** TBD
- **PRD Reference:** Sprint 2, Task 6 (Persistence layer)
- **Key Deliverables:**
  - IndexedDB storage for documents and attribution spans
  - Auto-save on edit (debounced 2 seconds of inactivity)
  - Document list view for managing multiple documents
  - Local copy of synced AI knowledge pool in IndexedDB

### F10: Extension-Editor Data Sync

- **Priority:** 6
- **Phase:** 2 — Editor Core + RED Attribution
- **Status:** [ ] Not started
- **Depends on:** F1, F2, F9
- **Blocks:** F6, F11, F24
- **User Stories:** US-09
- **Tasks:** TBD
- **PRD Reference:** Sprint 2, Task 7 (Extension <-> Web App communication)
- **Key Deliverables:**
  - Sync AI knowledge pool from chrome.storage to editor IndexedDB
  - Sync copy records for paste matching
  - chrome.storage.onChanged listener for real-time sync (extension-page has direct access)
  - Graceful degradation when extension APIs unavailable
  - Connection status indicator

### F6: RED Attribution (Direct Paste Detection)

- **Priority:** 7
- **Phase:** 2 — Editor Core + RED Attribution
- **Status:** [ ] Not started
- **Depends on:** F5, F10, F4
- **Blocks:** F7
- **User Stories:** US-10, US-11
- **Tasks:** TBD
- **PRD Reference:** Sprint 2, Tasks 2-3 (Paste event capture, Unlinked paste fallback)
- **Key Deliverables:**
  - Paste event listener on TipTap editor
  - Cross-reference clipboard data with copy records from extension
  - Matched pastes tagged as RED with source link and original text
  - Unlinked paste fallback: substring matching against AI pool (>80% verbatim threshold)
  - Lower confidence score for unlinked matches

### F7: Edit Distance Tracking and State Transitions

- **Priority:** 8
- **Phase:** 2 — Editor Core + RED Attribution
- **Status:** [ ] Not started
- **Depends on:** F6
- **Blocks:** F8
- **User Stories:** US-12
- **Tasks:** TBD
- **PRD Reference:** Sprint 2, Task 4 (Edit tracking on RED spans)
- **Key Deliverables:**
  - Character-level Levenshtein distance computation
  - Running edit distance tracked per RED-tagged span
  - State transitions: RED -> YELLOW at 20% change, RED -> GREEN at 70% change
  - Debounced re-scoring on each edit (avoid performance hit during rapid typing)
  - Only re-score the edited span, not the full document

### F8: Attribution Overlay UI

- **Priority:** 9
- **Phase:** 2 — Editor Core + RED Attribution
- **Status:** [ ] Not started
- **Depends on:** F6, F7
- **Blocks:** None
- **User Stories:** US-13
- **Tasks:** TBD
- **PRD Reference:** Sprint 2, Task 5 (Attribution overlay UI)
- **Key Deliverables:**
  - Toggle button: "Show Attribution" — OFF by default
  - Green/yellow/red background highlighting on attributed spans
  - Yellow gradient: darker at 20% edit distance, lighter approaching 70%
  - Summary bar showing percentage breakdown (e.g., "72% green | 18% yellow | 10% red")
  - Underlying document content unchanged regardless of overlay state

### F13: Temporal Gating

- **Priority:** 10
- **Phase:** 3 — YELLOW Attribution + Git Branching
- **Status:** [ ] Not started
- **Depends on:** F9
- **Blocks:** F11
- **User Stories:** US-14
- **Tasks:** TBD
- **PRD Reference:** Sprint 3, Task 3 (Temporal gating implementation); Attribution Model — Temporal Gating Rule
- **Key Deliverables:**
  - created_at timestamp on every user text span
  - AI pool query filtered: only entries where ai_timestamp < span.created_at
  - User text written before AI says something similar stays GREEN
  - Yellow -> Green transition blocked (once AI said it first, overlap is permanent)

### F11: YELLOW Attribution (Idea Overlap Detection)

- **Priority:** 11
- **Phase:** 3 — YELLOW Attribution + Git Branching
- **Status:** [ ] Not started
- **Depends on:** F13, F10
- **Blocks:** F12
- **User Stories:** US-15
- **Tasks:** TBD
- **PRD Reference:** Sprint 3, Task 1 (N-gram matching engine)
- **Key Deliverables:**
  - Text segmentation into sentence-level chunks
  - 3-5 word n-gram extraction and overlap scoring against temporally-gated AI pool
  - Keyword/entity overlap as secondary signal (capitalized words, technical terms)
  - Combined overlap score mapped to yellow intensity gradient
  - Stopword filtering to reduce false positives on common phrases

### F12: LLM Judge Scoring Mode

- **Priority:** 12
- **Phase:** 3 — YELLOW Attribution + Git Branching
- **Status:** [ ] Not started
- **Depends on:** F11
- **Blocks:** F24
- **User Stories:** US-16
- **Tasks:** TBD
- **PRD Reference:** Sprint 3, Task 2 (LLM judge mode)
- **Key Deliverables:**
  - Direct Anthropic API integration (API key stored locally in browser)
  - Batch candidate pairs (user chunk + AI pool entry) sent to Claude Haiku
  - Similarity score (0-1) and green/yellow/red classification returned
  - Result caching keyed on content hashes to avoid redundant API calls
  - Graceful fallback to edit-distance mode on API failure
  - Rate limiting for API calls

### F14: Git Integration (isomorphic-git)

- **Priority:** 10
- **Phase:** 3 — YELLOW Attribution + Git Branching
- **Status:** [ ] Not started
- **Depends on:** F9
- **Blocks:** F15, F18
- **User Stories:** US-17
- **Tasks:** TBD
- **PRD Reference:** Sprint 3, Task 4 (Git integration with isomorphic-git)
- **Key Deliverables:**
  - Git repository initialized in IndexedDB via lightning-fs
  - Auto-commit on save (document state as structured JSON)
  - Commit metadata: timestamp, word count delta, attribution snapshot
  - Git operations: commit, log, diff between commits

### F15: Branch Creation (Tree and Selection)

- **Priority:** 11
- **Phase:** 3 — YELLOW Attribution + Git Branching
- **Status:** [ ] Not started
- **Depends on:** F14
- **Blocks:** F16, F17
- **User Stories:** US-18, US-19
- **Tasks:** TBD
- **PRD Reference:** Sprint 3, Tasks 5-6 (Branch creation from tree and selection)
- **Key Deliverables:**
  - Plus button in side drawer creates branch from current HEAD
  - Auto-generated branch names with rename option
  - Branch list in side drawer with active branch highlighted
  - Selection-based branching: highlight paragraph, "Branch this section" action
  - L-shaped markers on branched sections in the editor
  - Branch switching (checkout) preserving document state per branch

### F16: Branch Preview Scroller

- **Priority:** 12
- **Phase:** 3 — YELLOW Attribution + Git Branching
- **Status:** [ ] Not started
- **Depends on:** F15
- **Blocks:** None
- **User Stories:** US-20
- **Tasks:** TBD
- **PRD Reference:** Sprint 3, Task 7 (Branch preview scroller)
- **Key Deliverables:**
  - Horizontal scroller at bottom of branched sections
  - Tabs for each branch that modifies that section
  - Click tab to preview section content on that branch
  - Active branch tab highlighted with accent color (#4A5E8A)

### F17: Branch Merge

- **Priority:** 12
- **Phase:** 3 — YELLOW Attribution + Git Branching
- **Status:** [ ] Not started
- **Depends on:** F15
- **Blocks:** None
- **User Stories:** US-21
- **Tasks:** TBD
- **PRD Reference:** Sprint 3, Task 8 (Branch merge)
- **Key Deliverables:**
  - Three-way merge on text content (common ancestor, current, incoming)
  - Auto-merge for non-conflicting changes
  - Conflict UI with accept/reject controls per section for overlapping edits
  - Merge initiated via double-click on branch number or branch picker
  - Merge commit created on success

### F18: Commit Timeline Visualizer

- **Priority:** 13
- **Phase:** 4 — Visualization, Analytics & Polish
- **Status:** [ ] Not started
- **Depends on:** F14
- **Blocks:** F19, F20
- **User Stories:** US-22
- **Tasks:** TBD
- **PRD Reference:** Sprint 4, Task 1 (Commit timeline visualizer)
- **Key Deliverables:**
  - Vertical timeline in side drawer ("The Paper Drawer")
  - Each entry: timestamp, title, summary, branch indicator
  - Active commit highlighted with accent color (#4A5E8A)
  - Hand-drawn SVG connector lines (perfect-freehand)
  - Click entry to navigate to that commit's document state

### F19: LLM-Generated Commit Metadata

- **Priority:** 14
- **Phase:** 4 — Visualization, Analytics & Polish
- **Status:** [ ] Not started
- **Depends on:** F18
- **Blocks:** None
- **User Stories:** US-23
- **Tasks:** TBD
- **PRD Reference:** Sprint 4, Task 2 (LLM-generated commit metadata)
- **Key Deliverables:**
  - Diff sent to Claude Haiku on each commit
  - Generated: short title, 1-sentence summary, conceptual change description
  - Metadata stored alongside commit
  - Fallback: auto-generated title from word count delta + timestamp when API unavailable

### F20: Diff Scrubbing View

- **Priority:** 14
- **Phase:** 4 — Visualization, Analytics & Polish
- **Status:** [ ] Not started
- **Depends on:** F18
- **Blocks:** None
- **User Stories:** US-24
- **Tasks:** TBD
- **PRD Reference:** Sprint 4, Task 3 (Diff scrubbing view)
- **Key Deliverables:**
  - Scrub slider or click timeline entries to view any commit state
  - Additions highlighted green (present in this commit, not previous)
  - Deletions highlighted red (present in previous, not this commit)
  - Diff rendering using editor's own styling and manuscript aesthetic

### F21: Behavioral Analytics

- **Priority:** 13
- **Phase:** 4 — Visualization, Analytics & Polish
- **Status:** [ ] Not started
- **Depends on:** F9, F3
- **Blocks:** F22
- **User Stories:** US-25
- **Tasks:** TBD
- **PRD Reference:** Sprint 4, Task 4 (Behavioral analytics collection); Behavioral Analytics section
- **Key Deliverables:**
  - Event bus capturing: edit events, paste events, deletions, scroll-away-from-cursor, active time, tab switches, AI usage, branch creation, branch sizes
  - Per-document per-session aggregated summaries
  - Session summaries stored in IndexedDB

### F22: Analytics Dashboard

- **Priority:** 14
- **Phase:** 4 — Visualization, Analytics & Polish
- **Status:** [ ] Not started
- **Depends on:** F21
- **Blocks:** F23, F26
- **User Stories:** US-26
- **Tasks:** TBD
- **PRD Reference:** Sprint 4, Task 5 (Analytics dashboard)
- **Key Deliverables:**
  - Attribution summary ratio bar with colored segments
  - Session timeline: writing (blue) vs. AI consultation (orange) vs. idle (gray)
  - Editing pattern charts (words written/deleted, paste frequency)
  - Branch statistics (count, average size)
  - Hand-drawn chart style using chart.xkcd + react-rough-fiber

### F23: Cross-Project Comparison

- **Priority:** 15
- **Phase:** 4 — Visualization, Analytics & Polish
- **Status:** [ ] Not started
- **Depends on:** F22, F9
- **Blocks:** None
- **User Stories:** US-27
- **Tasks:** TBD
- **PRD Reference:** Sprint 4, Task 6 (Cross-project comparison)
- **Key Deliverables:**
  - Document list with per-document attribution ratios
  - Trend chart: green/yellow/red ratio changes over time across projects
  - AI dependency trajectory tracking ("Am I becoming more or less dependent?")

### F24: Settings Panel

- **Priority:** 14
- **Phase:** 4 — Visualization, Analytics & Polish
- **Status:** [ ] Not started
- **Depends on:** F12, F10
- **Blocks:** None
- **User Stories:** US-28
- **Tasks:** TBD
- **PRD Reference:** Sprint 4, Task 7 (Settings panel)
- **Key Deliverables:**
  - Scoring mode toggle: Edit Distance (default) | LLM Judge
  - Connected AI platforms status (Claude.ai connected/disconnected)
  - Anthropic API key input for LLM judge mode
  - Storage usage display and cleanup controls
  - Data export: documents, attribution data, analytics (JSON)

### F26: UI Polish & Onboarding

- **Priority:** 16
- **Phase:** 4 — Visualization, Analytics & Polish
- **Status:** [ ] Not started
- **Depends on:** F25, F22
- **Blocks:** None
- **User Stories:** US-29, US-30
- **Tasks:** TBD
- **PRD Reference:** Sprint 4, Task 8 (Polish and UX); UI Design Direction
- **Key Deliverables:**
  - Side drawer open/close animations
  - Bottom nav bar (Write | Branch | Insights modes) with blur backdrop
  - Keyboard shortcuts for common actions
  - Onboarding flow for first-time users
  - Index-card style branch cards with tape overlay and drop shadows
  - Marker highlights using SVGBox pen-brushes + displacement filters
  - Final aesthetic refinements from Figma direction
