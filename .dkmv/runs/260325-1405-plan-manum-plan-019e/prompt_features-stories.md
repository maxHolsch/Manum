You are a senior software architect extracting features and user stories from a PRD.

## Setup

1. The output directory is `docs/implementation/manum` — all deliverables go here
2. Create the output directory if it doesn't exist: `mkdir -p docs/implementation/manum`
3. Read `.agent/analysis.json` for the full PRD analysis (features, constraints, risks, architecture notes).
   If the `questions` array contains entries with a `user_answer` field, those are the user's decisions — incorporate them into your work.
4. Re-read the PRD at `.agent/prd.md` for reference

## Analysis Context

Estimated complexity: **large**

Features identified in analysis:

- F1: AI Response Capture — Chrome extension content script that observes Claude.ai DOM via MutationObserver, debounces streaming responses, and stores complete AI messages with timestamps and IDs in chrome.storage.local as the AI knowledge pool.

- F2: Copy Event Capture — Listens for copy events on Claude.ai pages, captures selected text with source message ID and timestamp, stores as copy records in chrome.storage.local for later paste matching.

- F3: Tab Focus Tracking — Tracks tab switches between editor, Claude.ai, and other tabs using chrome.tabs.onActivated and document.visibilitychange, logging timestamped events for behavioral analytics.

- F4: Offscreen Clipboard Access — Manifest V3 offscreen document for navigator.clipboard.readText() as a fallback for pastes that don't match any copy record (unlinked paste detection).

- F5: TipTap Rich Text Editor — React-based editor using TipTap (ProseMirror) with section-based document model, basic formatting toolbar, manuscript aesthetic (Special Elite font, parchment background, centered 768px column).

- F6: RED Attribution (Direct Paste Detection) — Detects pastes from AI by cross-referencing clipboard data with copy records and AI knowledge pool. Tags matched pastes as RED with source links. Includes unlinked paste fallback via substring matching (>80% verbatim match threshold).

- F7: Edit Distance Tracking and State Transitions — Tracks edits within RED-tagged spans, computes running edit distance from original paste. Transitions: RED→YELLOW at 20% change, RED→GREEN at 70% change. Debounced re-scoring on each edit.

- F8: Attribution Overlay UI — Toggle button to show/hide attribution highlighting. When on, displays green/yellow/red background colors on spans with yellow gradient based on edit distance. Summary bar shows percentage breakdown.

- F9: Document Persistence — IndexedDB storage for documents, attribution spans, and synced AI knowledge pool. Auto-save on edit (debounced 2s). Document list view for managing multiple documents.

- F10: Extension-Editor Data Sync — Synchronizes AI knowledge pool and copy records from chrome.storage to editor's IndexedDB via chrome.storage.onChanged or polling fallback. Graceful degradation when extension is disconnected.

- F11: YELLOW Attribution (Idea Overlap Detection) — N-gram matching engine that segments user text into sentences, compares against temporally-gated AI pool entries using 3-5 word n-gram overlap and keyword/entity overlap, maps scores to yellow intensity gradient.

- F12: LLM Judge Scoring Mode — Optional Claude Haiku-based semantic similarity scoring. Batches candidate pairs, returns 0-1 similarity scores and green/yellow/red classifications. Includes result caching and graceful fallback to edit-distance mode.

- F13: Temporal Gating — Enforces temporal priority: AI pool matches only count if ai_timestamp < span.created_at. If user wrote it before the AI said something similar, the text stays GREEN.

- F14: Git Integration (isomorphic-git) — Initializes git repository in IndexedDB via lightning-fs. Auto-commits document state as JSON on save. Stores commit metadata including timestamp, word count delta, and attribution snapshot.

- F15: Branch Creation (Tree and Selection) — Branch from tree (plus button creates branch from HEAD) and branch from selection (highlight paragraph, create branch of that section with L-shaped markers). Auto-generated branch names with rename option.

- F16: Branch Preview Scroller — Horizontal scroller at bottom of branched sections showing tabs for each branch that modifies that section. Clicking a tab previews the section content on that branch.

- F17: Branch Merge — Three-way merge on text content (common ancestor, current, incoming). Auto-merge for simple cases, conflict UI with accept/reject controls for overlapping edits. Initiated by double-clicking branch number.

- F18: Commit Timeline Visualizer — Vertical timeline in side drawer ('The Paper Drawer') with hand-drawn SVG connector lines. Each entry shows timestamp, title, summary, branch indicator. Click to navigate to commit state.

- F19: LLM-Generated Commit Metadata — Sends diffs to Claude Haiku to generate short titles, summaries, and conceptual change descriptions for each commit. Fallback to auto-generated titles from word count delta + timestamp.

- F20: Diff Scrubbing View — Scrub slider or click timeline entries to view any commit state. Additions highlighted green, deletions highlighted red (diff from previous commit).

- F21: Behavioral Analytics — Event bus capturing edit events, paste events, deletions, scroll-away-from-cursor, active time, tab switches, AI usage, branch creation, and branch sizes. Aggregated into per-document per-session summaries in IndexedDB.

- F22: Analytics Dashboard — Attribution summary ratio bar, session timeline (writing vs AI consultation vs idle), editing pattern charts, branch statistics. Uses hand-drawn chart style (chart.xkcd + react-rough-fiber).

- F23: Cross-Project Comparison — Document list with per-document attribution ratios. Trend chart showing green/yellow/red ratio changes over time across projects. Tracks AI dependency trajectory.

- F24: Settings Panel — Scoring mode toggle, connected AI platforms status, storage usage and cleanup, data export (documents, attribution, analytics).

- F25: Manuscript Aesthetic and Polish — Hand-drawn UI using rough.js, wired-elements, chart.xkcd, perfect-freehand, PaperCSS. Paper textures via css-doodle + SVG filters. Marker highlights, sketchy borders, typewriter/handwriting fonts. Side drawer animations, bottom nav bar, keyboard shortcuts, onboarding flow.

Constraints:

- Chrome extension must use Manifest V3 (content scripts, service worker, offscreen documents — no background pages)

- Claude.ai only — no support for ChatGPT or other AI platforms

- Single-user only — no collaboration, shared pools, or multi-user sync

- Editor must work when extension is disconnected (graceful degradation)

- LLM judge mode must fall back to edit-distance mode if Haiku API is unavailable

- AI pool growth is unbounded for now (deferred optimization)

- Section granularity for branching is paragraph-level TipTap nodes only

- DOM selectors for Claude.ai are fragile and will break — must be easy to update

- Attribution overlay is OFF by default

- Specific visual library stack mandated: rough.js, wired-elements, chart.xkcd, perfect-freehand, PaperCSS, css-doodle, Special Elite / Caveat / Courier Prime fonts

- Pre-commit tests must complete in under 30 seconds

Non-goals:

- Support for AI platforms other than Claude.ai (no ChatGPT, Gemini, etc.)

- Multi-user collaboration or shared document editing

- Cloud sync or server-side storage — everything is local (browser storage)

- AI pool eviction strategy optimization (deferred)

- Arbitrary text range selection for branching (paragraph-level only)

- Mobile or tablet support

- Real-time collaborative editing

- Automatic plagiarism detection against external sources (only checks against user's own AI interactions)

User decisions:

- **How should the web editor be hosted/packaged?** → extension-page

- **How should the extension and web app codebases be organized?** → monorepo

- **What strategy should be used for the edit distance computation?** → levenshtein

- **Should the LLM judge mode use the Anthropic SDK directly or go through a lightweight backend proxy?** → direct

- **How should the project handle the hand-drawn aesthetic during early sprints?** → upfront

## Step 3: Extract Features → features.md

### Process

1. **Enumerate features.** Assign each a unique ID: F1, F2, ... FN.
2. **Determine dependencies.** Which features require other features to be complete first?
3. **Draw the dependency graph.** Use ASCII art — it must be scannable in a terminal.
4. **Assign priorities.** Priority = build order, not business importance. Foundation features are priority 1.
5. **Link to PRD sections.** Each feature traces to a specific PRD section.
6. **Link to user stories.** Each feature serves one or more user stories (assign US-IDs after Step 4).

### features.md Structure

Write `<output_dir>/features.md` with this structure:

```markdown
# {Project} Feature Registry

## Overview

{N} features organized in {M} phases. Features must be built in dependency order.

## Dependency Diagram

{ASCII diagram showing feature dependencies across phases}

## Feature List

### F1: {Feature Name}

- **Priority:** {build order number}
- **Phase:** {phase number} — {phase name}
- **Status:** [ ] Not started
- **Depends on:** {F-IDs or "None"}
- **Blocks:** {F-IDs that depend on this}
- **User Stories:** {US-IDs}
- **Tasks:** {T-ID range — leave as TBD for now}
- **PRD Reference:** Section {N} ({description})
- **Key Deliverables:**
  - {Concrete output 1}
  - {Concrete output 2}
```

### Feature Heuristics

- **A feature is too big if** it would take more than one phase to implement. Split it.
- **A feature is too small if** it doesn't have at least 2-3 tasks. Merge with a related feature.
- **Foundation features come first.** Config, project structure, testing infrastructure, build system — always Phase 1.
- **Every feature must produce something testable.** If you can't write a test for it, it's not a feature.
- **Dependency arrows only point forward.** If F5 depends on F3, F3 must be in an earlier or same phase. Circular dependencies indicate a design problem.

## Step 4: Derive User Stories → user_stories.md

### Process

1. **Identify personas** from the PRD. Common: end user, developer, admin, operator.
2. **For each feature,** write 1-3 user stories using: "As a {role}, I want to {action} so I can {benefit}"
3. **Write acceptance criteria** for each story (3-7 per story). Each must be testable and specific.
4. **Build the traceability matrix** linking stories to features and tasks.
5. **Group stories by category** (setup, core workflow, management, etc.).

### user_stories.md Structure

Write `<output_dir>/user_stories.md` with this structure:

```markdown
# {Project} User Stories

## Summary

{N} user stories across {M} categories.

## Traceability Matrix

| US ID | Title   | Feature | Task(s) | Status |
| ----- | ------- | ------- | ------- | ------ |
| US-01 | {title} | F1      | TBD     | [ ]    |
| US-02 | {title} | F2      | TBD     | [ ]    |

---

## Stories by Category

### {Category Name} (US-01 through US-04)

#### US-01: {Title}

> As a {role}, I want to {action} so I can {benefit}

**Acceptance Criteria:**

- [ ] {Criterion 1 — testable, specific}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

**Feature:** F1 | **Tasks:** TBD | **Priority:** Must-have
```

### User Story Heuristics

- **Atomic stories.** One behavior per story. If it contains "and," split it.
- **3-7 acceptance criteria per story.** Fewer than 3 = underspecified. More than 7 = story needs splitting.
- **Acceptance criteria are testable.** Each maps to something verifiable: a command that succeeds, an output that matches, a test that passes.
- **Use plain language.** Avoid implementation details in acceptance criteria.
- **For AI agents: mandate, don't suggest.** Write "MUST verify ownership" not "Consider checking ownership."
- **INVEST criteria.** Independent, Negotiable, Valuable, Estimable, Small, Testable.
- **Every feature should have at least one story.** Infrastructure features map to developer-facing stories.

## Self-Review

Before finalizing, perform the following verification:

1. **Re-read `.agent/analysis.json`** and the PRD. For each feature in the analysis, verify it appears in features.md. For each persona, verify at least one user story addresses them.
2. **Check completeness** — does every feature have a unique ID, dependencies, priority, and PRD reference? Does every user story have 3-7 acceptance criteria? Are there any features without stories or stories without features?
3. **Check correctness** — do feature dependencies flow forward (no circular deps)? Are acceptance criteria testable and specific, not vague? Do user story IDs in features.md match those in user_stories.md?
4. **Verify sizing** — are any features too big (>1 phase) or too small (<2-3 tasks)? Split or merge as needed.
5. **Fix genuine gaps** — if you find missing stories, broken cross-references, or vague acceptance criteria, fix them now.

## Finalize

After writing both files:

1. Go back and update the `User Stories` field in features.md with the actual US-IDs
2. Create `.agent/features_stories_done.txt` with content:
   ```
   Output directory: <output_dir>
   Features: {count} features written to <output_dir>/features.md
   Stories: {count} stories written to <output_dir>/user_stories.md
   Categories: {list of categories}
   ```
3. Create `.agent/features_stories_summary.json` — a structured summary for downstream tasks:
   ```json
   {
     "feature_count": 5,
     "story_count": 12,
     "feature_ids": ["F1", "F2", "F3", "F4", "F5"],
     "categories": ["Setup", "Core Workflow", "Management"]
   }
   ```

## Constraints

- Write only features.md and user_stories.md to the output directory
- Do NOT create phase documents, tasks.md, or any other files yet
- Task IDs in traceability matrix should be "TBD" — they'll be assigned in the next step
