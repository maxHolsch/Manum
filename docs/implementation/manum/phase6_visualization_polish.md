# Phase 6: Visualization, Analytics & Polish

## Prerequisites

- Phase 5 complete: YELLOW attribution works, git branching operational, LLM judge available
- Git commits are being created on auto-save with metadata (T131, T132)
- Branch system operational (T134-T140)
- IndexedDB persistence and extension sync operational
- Manuscript aesthetic foundation in place (T065-T067)

## Infrastructure Updates Required

### IU-4: Export Commit Log with Parsed Metadata

**File:** `packages/editor/src/git/log.ts`

The timeline visualizer needs commit log entries with parsed metadata (word count delta, attribution snapshot). Ensure `getCommitLog()` returns parsed metadata from commit messages.

```typescript
interface CommitEntry {
  oid: string;
  message: string;
  timestamp: number;
  metadata?: {
    wordCount: number;
    wordCountDelta: number;
    attribution: { green: number; yellow: number; red: number };
  };
  branch?: string;
}
```

**Tests:** Verify metadata parsing from commit messages returns structured data.

### IU-5: Add Chart Libraries

**File:** `packages/editor/package.json`

Add chart.xkcd and react-rough-fiber dependencies needed for analytics dashboard charts.

```json
"chart.xkcd": "^1.1.0",
"react-rough-fiber": "^0.1.0",
"perfect-freehand": "^1.2.0"
```

**Tests:** Verify packages install and import without errors.

## Phase Goal

A complete application with commit timeline visualization, diff scrubbing, behavioral analytics dashboard, cross-project comparison, settings panel, keyboard navigation, and onboarding — all styled with the manuscript aesthetic.

## Phase Evaluation Criteria

- Commit timeline renders in side drawer with chronological entries and hand-drawn connectors
- Clicking a timeline entry shows the document at that commit's state
- LLM-generated commit titles appear on timeline entries (or fallback titles when API unavailable)
- Diff scrubbing: navigate between commits → green additions and red deletions visible
- Behavioral analytics: perform actions (type, paste, branch) → verify events captured in IndexedDB
- Analytics dashboard: attribution ratio bar, session timeline, editing pattern charts render with chart.xkcd style
- Cross-project comparison: multiple documents → per-document ratios and trend chart visible
- Settings panel: scoring mode toggle works, API key input persists, data export produces valid JSON
- Bottom nav bar switches between Write, Branch, Insights modes
- Side drawer opens/closes with animation
- Keyboard shortcuts work: Ctrl+Shift+A (toggle attribution), Ctrl+B (branch), Ctrl+S (save)
- Onboarding flow renders on first launch and can be skipped/replayed
- `pnpm --filter editor test` passes all Phase 6 tests
- All quality gates green (lint, types, tests)

---

## Tasks

### T160: Implement Commit Timeline in Side Drawer

**PRD Reference:** Sprint 4, Task 1 (Commit timeline visualizer)
**Depends on:** Nothing
**Blocks:** T161, T162
**User Stories:** US-22
**Estimated scope:** 1 hour

#### Description

Create a vertical commit timeline inside the side drawer ("The Paper Drawer"). Each entry shows timestamp, title, summary, and branch indicator.

#### Acceptance Criteria

- [ ] Vertical timeline renders in the side drawer (320px width)
- [ ] Each entry displays: timestamp, title (from commit message), branch indicator
- [ ] Active commit (current HEAD) is highlighted with accent color (#4A5E8A) and glow
- [ ] Timeline updates when new commits are created
- [ ] Entries are ordered chronologically (newest at top or bottom — pick one, be consistent)
- [ ] Test: create commits → verify timeline shows correct entries

#### Files to Create/Modify

- `packages/editor/src/components/Timeline.tsx` — (create) Commit timeline component
- `packages/editor/src/components/TimelineEntry.tsx` — (create) Individual timeline entry
- `packages/editor/src/components/BranchDrawer.tsx` — (modify) Include timeline in drawer

#### Implementation Notes

Use `getCommitLog()` from the git module. Render as a vertical list with a connecting line. Each entry is a card with manuscript styling (Caveat font for titles, Courier Prime for timestamps). Active commit: `box-shadow: 0 0 10px var(--color-accent)`. The drawer should have tabs or sections for "Timeline" and "Branches".

#### Evaluation Checklist

- [ ] Timeline renders with correct commit data
- [ ] Active commit is highlighted

---

### T161: Implement Hand-Drawn SVG Connector Lines

**PRD Reference:** Sprint 4, Task 1 (Wobbly hand-drawn line connecting entries)
**Depends on:** T160
**Blocks:** Nothing
**User Stories:** US-22
**Estimated scope:** 30 min

#### Description

Connect timeline entries with hand-drawn SVG lines using the perfect-freehand library for a manuscript feel.

#### Acceptance Criteria

- [ ] Timeline entries are connected by hand-drawn SVG lines
- [ ] Lines use perfect-freehand for natural brush-stroke appearance
- [ ] Lines connect from one entry's bottom to the next entry's top
- [ ] Branch points show forking lines
- [ ] Lines use warm gray color consistent with the aesthetic

#### Files to Create/Modify

- `packages/editor/src/components/TimelineConnector.tsx` — (create) SVG connector using perfect-freehand
- `packages/editor/src/components/Timeline.tsx` — (modify) Include connectors between entries

#### Implementation Notes

Use `getStroke()` from perfect-freehand to generate SVG path data from a set of points. For each pair of adjacent entries, create a path from the bottom center of one to the top center of the next. Add slight randomness to control points for a hand-drawn feel. Convert stroke to SVG path using `getSvgPathFromStroke()`.

#### Evaluation Checklist

- [ ] Connector lines render between timeline entries
- [ ] Lines have a hand-drawn appearance

---

### T162: Implement Timeline Entry Click Navigation

**PRD Reference:** Sprint 4, Task 1 (Click to navigate to commit state)
**Depends on:** T160
**Blocks:** Nothing
**User Stories:** US-22
**Estimated scope:** 30 min

#### Description

Clicking a timeline entry navigates the editor to show the document at that commit's state (read-only historical view).

#### Acceptance Criteria

- [ ] Clicking a timeline entry loads the document state at that commit
- [ ] Editor displays historical content in read-only mode
- [ ] Visual indicator shows the user is viewing a historical state
- [ ] "Return to latest" button or action exits historical view
- [ ] Historical navigation doesn't create new commits
- [ ] Test: click older commit → verify editor shows older content

#### Files to Create/Modify

- `packages/editor/src/git/history.ts` — (create) Load document state at specific commit
- `packages/editor/src/components/Timeline.tsx` — (modify) Add click handler
- `packages/editor/src/components/Editor.tsx` — (modify) Support read-only historical mode

#### Implementation Notes

Use isomorphic-git to read the file at a specific commit OID:
```typescript
const { blob } = await git.readBlob({ fs, dir, oid: commitOid, filepath: `/${docId}.json` });
const content = JSON.parse(new TextDecoder().decode(blob));
```
Set the editor to read-only mode while viewing history. Add a banner "Viewing version from {date}" with a "Return to latest" button.

#### Evaluation Checklist

- [ ] Historical navigation loads correct document state
- [ ] Editor is read-only in historical view

---

### T163: Implement LLM-Generated Commit Metadata

**PRD Reference:** Sprint 4, Task 2 (LLM-generated commit metadata)
**Depends on:** T160
**Blocks:** T164
**User Stories:** US-23
**Estimated scope:** 1 hour

#### Description

On each commit, send the diff to Claude Haiku to generate a short title, 1-sentence summary, and conceptual change description.

#### Acceptance Criteria

- [ ] After each commit, the diff is sent to Claude Haiku
- [ ] Haiku returns: short title (5-8 words), 1-sentence summary, conceptual description
- [ ] Generated metadata is stored alongside the commit (in IndexedDB, linked by commit OID)
- [ ] Metadata displays in timeline entries
- [ ] Previously generated metadata is not re-fetched on subsequent views
- [ ] Test: mock Haiku response → verify metadata stored and displayed

#### Files to Create/Modify

- `packages/editor/src/git/commit-metadata.ts` — (create) LLM commit metadata generation
- `packages/editor/src/storage/commit-metadata-store.ts` — (create) IndexedDB store for metadata
- `packages/editor/src/__tests__/commit-metadata.test.ts` — (create) Metadata generation tests

#### Implementation Notes

Reuse the Anthropic API client from T127. Prompt:
```
Given this document diff, generate:
1. A short title (5-8 words) describing what changed
2. A one-sentence summary
3. A brief conceptual description of the change

Diff:
{diff text}

Respond with JSON: { "title": "...", "summary": "...", "conceptual": "..." }
```
Store in IndexedDB with commit OID as key. Fire and forget — don't block the save on API response. Update timeline entries asynchronously when metadata arrives.

#### Evaluation Checklist

- [ ] Metadata generation test passes with mock API
- [ ] Metadata stored and linked to commit OID

---

### T164: Implement Commit Metadata Fallback

**PRD Reference:** Sprint 4, Task 2 (Fallback: auto-generated title)
**Depends on:** T163
**Blocks:** Nothing
**User Stories:** US-23
**Estimated scope:** 15 min

#### Description

When the Haiku API is unavailable, generate fallback titles from word count delta and timestamp.

#### Acceptance Criteria

- [ ] Fallback title format: "Added {N} words" or "Removed {N} words" + timestamp
- [ ] Fallback activates when LLM metadata generation fails
- [ ] Fallback metadata has the same structure as LLM metadata (title, summary)
- [ ] Test: API failure → verify fallback title generated

#### Files to Create/Modify

- `packages/editor/src/git/commit-metadata.ts` — (modify) Add fallback logic
- `packages/editor/src/__tests__/commit-metadata.test.ts` — (modify) Add fallback test

#### Implementation Notes

```typescript
function generateFallbackMetadata(wordCountDelta: number, timestamp: number) {
  const action = wordCountDelta >= 0 ? `Added ${wordCountDelta} words` : `Removed ${Math.abs(wordCountDelta)} words`;
  return {
    title: action,
    summary: `${action} at ${new Date(timestamp).toLocaleTimeString()}`,
    conceptual: null,
  };
}
```

#### Evaluation Checklist

- [ ] Fallback generates correct title from word count delta
- [ ] Fallback used when API fails

---

### T165: Implement Diff Scrubbing View

**PRD Reference:** Sprint 4, Task 3 (Diff scrubbing view)
**Depends on:** T160, T162
**Blocks:** T166
**User Stories:** US-24
**Estimated scope:** 1 hour

#### Description

Add a scrub slider or mechanism to navigate between commits and view any historical state. Paired with diff highlighting (T166) to show changes.

#### Acceptance Criteria

- [ ] Scrub slider or navigation arrows allow stepping through commits
- [ ] Slider position corresponds to commit index in the log
- [ ] Moving the slider updates the editor to show that commit's state
- [ ] Current position indicator shows which commit is being viewed
- [ ] Smooth navigation without full page reloads
- [ ] Test: scrub through commits → verify editor updates at each position

#### Files to Create/Modify

- `packages/editor/src/components/DiffScrubber.tsx` — (create) Scrub slider component
- `packages/editor/src/components/Editor.tsx` — (modify) Wire scrubber to historical view

#### Implementation Notes

Render a horizontal slider (range input or custom) at the bottom of the editor or in the drawer. The slider's range is 0 to `commits.length - 1`. On change, load the document at the corresponding commit using the historical navigation from T162. Use wired-elements slider if available, or a custom styled range input.

#### Evaluation Checklist

- [ ] Scrub slider navigates through commits
- [ ] Editor content updates at each position

---

### T166: Implement Diff Highlighting (Additions/Deletions)

**PRD Reference:** Sprint 4, Task 3 (Additions green, deletions red)
**Depends on:** T165
**Blocks:** Nothing
**User Stories:** US-24
**Estimated scope:** 1 hour

#### Description

When viewing historical commits (via scrubber or timeline click), show diff highlighting: additions in green, deletions in red, relative to the previous commit.

#### Acceptance Criteria

- [ ] Additions (text in current commit, not in previous) highlighted with green background
- [ ] Deletions (text in previous commit, not in current) shown with red strikethrough
- [ ] Diff highlighting uses the manuscript aesthetic
- [ ] Highlighting is only visible in historical/scrub mode
- [ ] Test: two commits with known changes → verify correct diff highlighting

#### Files to Create/Modify

- `packages/editor/src/components/DiffView.tsx` — (create) Diff rendering component
- `packages/editor/src/git/diff.ts` — (modify) Return structured diff for rendering
- `packages/editor/src/__tests__/diff-view.test.ts` — (create) Diff rendering tests

#### Implementation Notes

Use the git diff from T133 to get additions/deletions. Render the diff by merging both documents and marking added/removed sections. For the editor: render the current commit's text with green highlighting on new sections, and insert deleted sections as red strikethrough text inline. Use TipTap decorations or a custom read-only renderer.

#### Evaluation Checklist

- [ ] Additions show green highlighting
- [ ] Deletions show red strikethrough

---

### T167: Implement Behavioral Analytics Event Bus

**PRD Reference:** Sprint 4, Task 4 (Behavioral analytics collection)
**Depends on:** Nothing
**Blocks:** T168
**User Stories:** US-25
**Estimated scope:** 1 hour

#### Description

Create an event bus that captures writing behavior events: edit events, paste events, deletions, scroll activity, active time, tab switches, AI usage, branch creation, and branch sizes.

#### Acceptance Criteria

- [ ] Event bus provides `emit(eventType, payload)` and `subscribe(eventType, handler)` methods
- [ ] Events captured: `edit`, `paste`, `delete`, `scroll`, `active_time`, `tab_switch`, `ai_usage`, `branch_create`, `branch_resize`
- [ ] Each event includes a timestamp
- [ ] Event capture does not visibly impact editor performance
- [ ] Events are buffered and flushed periodically (not on every keystroke)
- [ ] Test: emit events → verify subscribers receive them

#### Files to Create/Modify

- `packages/editor/src/analytics/event-bus.ts` — (create) Event bus implementation
- `packages/editor/src/analytics/collectors.ts` — (create) Event collectors for each event type
- `packages/editor/src/__tests__/event-bus.test.ts` — (create) Event bus tests

#### Implementation Notes

Simple publish-subscribe pattern. Buffer events in memory and flush every 30 seconds or on page unload. Collectors are attached to TipTap events (`onUpdate`, `onTransaction`), scroll events, visibility changes, etc. The bus should support multiple subscribers per event type.

Performance: use `requestIdleCallback` for non-critical event processing. Edit events should be aggregated (count edits per 30-second window rather than logging each keystroke).

#### Evaluation Checklist

- [ ] Event bus tests pass
- [ ] Event capture doesn't cause visible performance degradation

---

### T168: Implement Session Aggregation and Storage

**PRD Reference:** Sprint 4, Task 4 (Aggregate into session summaries in IndexedDB)
**Depends on:** T167
**Blocks:** T169
**User Stories:** US-25
**Estimated scope:** 30 min

#### Description

Aggregate raw events into per-document per-session summaries and store them in IndexedDB.

#### Acceptance Criteria

- [ ] Sessions are defined as continuous activity periods (gap of >5 minutes = new session)
- [ ] Session summary includes: active time, edit count, paste count, deletion count, tab switches, branch creations
- [ ] Summaries are stored in IndexedDB `analytics_sessions` store
- [ ] Each summary links to a document ID and has start/end timestamps
- [ ] Test: emit events over time → verify correct session summary

#### Files to Create/Modify

- `packages/editor/src/analytics/session.ts` — (create) Session aggregation logic
- `packages/editor/src/storage/analytics-store.ts` — (create) Analytics IndexedDB operations
- `packages/editor/src/__tests__/session-aggregation.test.ts` — (create) Aggregation tests

#### Implementation Notes

Track session start time and last activity time. If `Date.now() - lastActivity > 5 * 60 * 1000`, end the current session and start a new one. On session end (or periodically), write the summary to IndexedDB. Summary structure:
```typescript
interface SessionSummary {
  id: string;
  documentId: string;
  startTime: number;
  endTime: number;
  activeTime: number; // milliseconds of actual editing
  editCount: number;
  pasteCount: number;
  deleteCount: number;
  tabSwitches: number;
  branchCreations: number;
}
```

#### Evaluation Checklist

- [ ] Session aggregation test passes
- [ ] Summaries persist in IndexedDB

---

### T169: Implement Analytics Dashboard — Attribution Summary Bar

**PRD Reference:** Sprint 4, Task 5 (Attribution summary ratio bar)
**Depends on:** T168
**Blocks:** T170
**User Stories:** US-26
**Estimated scope:** 30 min

#### Description

Create the analytics dashboard's attribution summary ratio bar showing green/yellow/red percentages with colored segments.

#### Acceptance Criteria

- [ ] Ratio bar renders with colored segments proportional to attribution percentages
- [ ] Green, yellow, and red segments are visually distinct
- [ ] Percentage labels shown on or near segments
- [ ] Bar uses hand-drawn aesthetic (rough.js borders or chart.xkcd style)
- [ ] Test: known attribution ratios → verify bar renders correctly

#### Files to Create/Modify

- `packages/editor/src/components/analytics/AttributionBar.tsx` — (create) Attribution ratio bar
- `packages/editor/src/components/analytics/Dashboard.tsx` — (create) Dashboard container

#### Implementation Notes

Render as a horizontal bar using flexbox with colored segments. Use rough.js to draw the bar outline for hand-drawn effect. Percentages come from `computeAttributionRatios()` (T100). The dashboard is accessible via the Insights mode in the bottom nav (T177).

#### Evaluation Checklist

- [ ] Attribution bar renders with correct proportions
- [ ] Bar has manuscript aesthetic

---

### T170: Implement Analytics Dashboard — Session Timeline Chart

**PRD Reference:** Sprint 4, Task 5 (Session timeline visualization)
**Depends on:** T169
**Blocks:** Nothing
**User Stories:** US-26
**Estimated scope:** 1 hour

#### Description

Create a session timeline chart showing writing (blue) vs. AI consultation (orange) vs. idle (gray) periods.

#### Acceptance Criteria

- [ ] Timeline chart renders with colored blocks for each activity type
- [ ] Writing periods (active editing) shown in blue
- [ ] AI consultation periods (Claude.ai tab active) shown in orange
- [ ] Idle periods shown in gray
- [ ] Chart uses chart.xkcd hand-drawn style
- [ ] Test: known session data → verify chart renders correct segments

#### Files to Create/Modify

- `packages/editor/src/components/analytics/SessionTimeline.tsx` — (create) Session timeline chart
- `packages/editor/src/components/analytics/Dashboard.tsx` — (modify) Include session timeline

#### Implementation Notes

Use chart.xkcd or react-rough-fiber for hand-drawn chart rendering. The timeline is a horizontal stacked bar chart where each segment represents a time block colored by activity type. Activity types are derived from tab events (Claude.ai tab = AI consultation, editor tab = writing, no activity = idle). If chart.xkcd doesn't support stacked bars natively, render manually with rough.js rectangles.

#### Evaluation Checklist

- [ ] Session timeline renders with correct activity colors
- [ ] Chart has hand-drawn aesthetic

---

### T171: Implement Analytics Dashboard — Editing Pattern Charts [P]

**PRD Reference:** Sprint 4, Task 5 (Editing patterns, branch statistics)
**Depends on:** T169
**Blocks:** Nothing
**User Stories:** US-26
**Estimated scope:** 1 hour

#### Description

Add editing pattern charts showing words written/deleted per session and paste frequency. Also add branch statistics (count, average size).

#### Acceptance Criteria

- [ ] Words written/deleted per session chart (bar or line chart)
- [ ] Paste frequency chart (number of pastes per session)
- [ ] Branch statistics: number of branches, average branch word count
- [ ] All charts use chart.xkcd hand-drawn style
- [ ] Test: known session data → verify charts render with correct values

#### Files to Create/Modify

- `packages/editor/src/components/analytics/EditingCharts.tsx` — (create) Editing pattern charts
- `packages/editor/src/components/analytics/BranchStats.tsx` — (create) Branch statistics
- `packages/editor/src/components/analytics/Dashboard.tsx` — (modify) Include editing charts and branch stats

#### Implementation Notes

Use chart.xkcd for line/bar charts. Data comes from session summaries in IndexedDB. Branch statistics: query git branches and compute word counts per branch. Keep charts simple — the hand-drawn aesthetic adds visual interest, so the data representation can be straightforward.

#### Evaluation Checklist

- [ ] Editing charts render with session data
- [ ] Branch statistics show correct counts

---

### T172: Implement Cross-Project Comparison View

**PRD Reference:** Sprint 4, Task 6 (Cross-project comparison)
**Depends on:** T169
**Blocks:** T173
**User Stories:** US-27
**Estimated scope:** 30 min

#### Description

Create a document list view showing per-document attribution ratios for comparing AI dependency across projects.

#### Acceptance Criteria

- [ ] Document list shows each document with its attribution ratio (green/yellow/red percentages)
- [ ] Ratios displayed as small colored bars next to document titles
- [ ] Documents sorted by most recent activity
- [ ] List uses manuscript aesthetic styling
- [ ] Test: multiple documents with known ratios → verify list renders correctly

#### Files to Create/Modify

- `packages/editor/src/components/analytics/ProjectComparison.tsx` — (create) Cross-project comparison view
- `packages/editor/src/components/analytics/Dashboard.tsx` — (modify) Include comparison view

#### Implementation Notes

Query all documents from IndexedDB, compute attribution ratios for each using `computeAttributionRatios()`. Render as a list with mini ratio bars. This view answers "which documents are most AI-dependent?"

#### Evaluation Checklist

- [ ] Document list shows per-document ratios
- [ ] Multiple documents render correctly

---

### T173: Implement Cross-Project Trend Chart

**PRD Reference:** Sprint 4, Task 6 (Trend chart over time)
**Depends on:** T172
**Blocks:** Nothing
**User Stories:** US-27
**Estimated scope:** 30 min

#### Description

Create a trend chart showing how green/yellow/red ratios change over time across all documents — tracking AI dependency trajectory.

#### Acceptance Criteria

- [ ] Line or area chart showing green/yellow/red percentages over time
- [ ] X-axis: time (days/weeks); Y-axis: percentage
- [ ] Three lines/areas for each color
- [ ] Chart answers "Am I becoming more or less dependent on AI?"
- [ ] Uses chart.xkcd hand-drawn style
- [ ] Test: known time-series data → verify chart renders correct trends

#### Files to Create/Modify

- `packages/editor/src/components/analytics/TrendChart.tsx` — (create) Trend chart component
- `packages/editor/src/components/analytics/Dashboard.tsx` — (modify) Include trend chart

#### Implementation Notes

Aggregate attribution ratios per document per day (or week). Plot three lines on a chart.xkcd line chart. Data: for each time point, compute the average attribution ratio across all active documents. If only one document, show that document's ratio over time (from commit snapshots).

#### Evaluation Checklist

- [ ] Trend chart renders with time-series data
- [ ] Chart shows directional trends

---

### T174: Implement Settings Panel — Scoring Mode Toggle

**PRD Reference:** Sprint 4, Task 7 (Settings panel — scoring mode)
**Depends on:** Nothing
**Blocks:** T175
**User Stories:** US-28
**Estimated scope:** 30 min

#### Description

Create the settings panel with a scoring mode toggle between Edit Distance (default) and LLM Judge.

#### Acceptance Criteria

- [ ] Settings panel accessible from the UI (gear icon or menu)
- [ ] Scoring mode toggle: "Edit Distance" (default) | "LLM Judge"
- [ ] Changing scoring mode triggers re-scoring of the current document
- [ ] Setting persists across sessions in IndexedDB
- [ ] Uses wired-elements toggle/radio buttons

#### Files to Create/Modify

- `packages/editor/src/components/Settings.tsx` — (create) Settings panel component
- `packages/editor/src/storage/settings-store.ts` — (create) Settings persistence
- `packages/editor/src/__tests__/settings.test.ts` — (create) Settings tests

#### Implementation Notes

Settings stored in IndexedDB `settings` store as key-value pairs. On scoring mode change, dispatch an event that triggers the auto-scorer (T126) to re-score. Use `wired-toggle` or `wired-radio` for the toggle UI.

#### Evaluation Checklist

- [ ] Scoring mode toggle changes and persists
- [ ] Re-scoring triggers on mode change

---

### T175: Implement Settings Panel — Connection & API Key

**PRD Reference:** Sprint 4, Task 7 (Connected platforms, API key)
**Depends on:** T174
**Blocks:** Nothing
**User Stories:** US-28
**Estimated scope:** 30 min

#### Description

Add connection status display and Anthropic API key input to the settings panel.

#### Acceptance Criteria

- [ ] Connected AI platforms section shows Claude.ai connection status
- [ ] API key input field for Anthropic API (for LLM judge mode)
- [ ] API key stored locally in IndexedDB (not chrome.storage for security)
- [ ] API key field shows masked value after entry
- [ ] Connection status reflects actual extension connectivity

#### Files to Create/Modify

- `packages/editor/src/components/Settings.tsx` — (modify) Add connection and API key sections

#### Implementation Notes

Reuse the connection status logic from T072. API key: use a `wired-input` with `type="password"` for masking. Store the key in IndexedDB settings store. The LLM judge client (T127) reads the key from settings storage.

#### Evaluation Checklist

- [ ] API key input saves and loads from IndexedDB
- [ ] Connection status displays correctly

---

### T176: Implement Settings Panel — Storage & Export

**PRD Reference:** Sprint 4, Task 7 (Storage usage, data export)
**Depends on:** T174
**Blocks:** Nothing
**User Stories:** US-28
**Estimated scope:** 1 hour

#### Description

Add storage usage display, cleanup controls, and data export functionality to the settings panel.

#### Acceptance Criteria

- [ ] Storage usage displayed (estimated size of IndexedDB data)
- [ ] "Clean up" button removes old/unused data (old sessions, stale cache)
- [ ] "Export Data" button generates a JSON file with documents, attribution data, and analytics
- [ ] Export file downloads via browser's download mechanism
- [ ] Test: export → verify JSON file contains expected data structure

#### Files to Create/Modify

- `packages/editor/src/components/Settings.tsx` — (modify) Add storage and export sections
- `packages/editor/src/storage/export.ts` — (create) Data export logic
- `packages/editor/src/__tests__/export.test.ts` — (create) Export tests

#### Implementation Notes

Storage estimation: iterate over IndexedDB object stores and estimate size with `JSON.stringify()`. Export: read all documents, attribution spans, analytics sessions from IndexedDB, bundle into a single JSON object, create a Blob, and trigger download via `URL.createObjectURL()` + hidden `<a>` element click.

#### Evaluation Checklist

- [ ] Storage usage displays a number
- [ ] Export produces valid JSON file

---

### T177: Implement Bottom Nav Bar

**PRD Reference:** Sprint 4, Task 8 (Bottom nav bar)
**Depends on:** Nothing
**Blocks:** T178
**User Stories:** US-29
**Estimated scope:** 30 min

#### Description

Create a floating bottom navigation bar with Write, Branch, and Insights mode switching. The nav bar has a blur backdrop consistent with the manuscript aesthetic.

#### Acceptance Criteria

- [ ] Bottom nav bar floats at the bottom of the viewport
- [ ] Three mode buttons: Write (editor), Branch (branch drawer), Insights (analytics)
- [ ] Active mode visually indicated
- [ ] Blur backdrop behind the nav bar (`backdrop-filter: blur()`)
- [ ] Switching modes changes the main content area
- [ ] Uses manuscript aesthetic styling

#### Files to Create/Modify

- `packages/editor/src/components/BottomNav.tsx` — (create) Bottom navigation component
- `packages/editor/src/App.tsx` — (modify) Wire nav modes to content switching
- `packages/editor/src/styles/nav.css` — (create) Nav bar styles

#### Implementation Notes

CSS: `position: fixed; bottom: 0; backdrop-filter: blur(10px); background: rgba(251, 243, 227, 0.8)`. Use wired-elements for the buttons or custom styled buttons with rough.js outlines. Mode switching: render different components based on active mode (editor, branch drawer, analytics dashboard).

#### Evaluation Checklist

- [ ] Nav bar renders at bottom with three modes
- [ ] Mode switching shows correct content

---

### T178: Implement Side Drawer Animations

**PRD Reference:** Sprint 4, Task 8 (Side drawer open/close animation)
**Depends on:** T177
**Blocks:** Nothing
**User Stories:** US-29
**Estimated scope:** 30 min

#### Description

Add smooth open/close animations to the side drawer (The Paper Drawer) that holds the timeline and branch list.

#### Acceptance Criteria

- [ ] Drawer slides in from the right with smooth animation
- [ ] Drawer slides out when closed
- [ ] Animation duration: 200-300ms with easing
- [ ] Editor content area resizes when drawer opens/closes
- [ ] Drawer open/close triggered by button or keyboard shortcut

#### Files to Create/Modify

- `packages/editor/src/components/BranchDrawer.tsx` — (modify) Add animation
- `packages/editor/src/styles/drawer.css` — (create) Drawer animation styles

#### Implementation Notes

CSS transition on `transform: translateX()` or `width`. When closed: `transform: translateX(100%)`. When open: `transform: translateX(0)`. Use `transition: transform 250ms ease-out`. The editor column should adjust its width/margin when the drawer state changes.

#### Evaluation Checklist

- [ ] Drawer animates smoothly on open/close
- [ ] Editor content adjusts to drawer state

---

### T179: Implement Keyboard Shortcuts

**PRD Reference:** Sprint 4, Task 8 (Keyboard shortcuts)
**Depends on:** T177
**Blocks:** Nothing
**User Stories:** US-29
**Estimated scope:** 30 min

#### Description

Add keyboard shortcuts for common actions: toggle attribution overlay, create branch, open/close drawer, save, switch modes.

#### Acceptance Criteria

- [ ] Ctrl+Shift+A: Toggle attribution overlay
- [ ] Ctrl+Shift+B: Create new branch
- [ ] Ctrl+Shift+D: Toggle side drawer
- [ ] Ctrl+S: Save (manual save)
- [ ] Ctrl+1/2/3: Switch to Write/Branch/Insights mode
- [ ] Shortcuts work from anywhere in the editor
- [ ] Test: simulate key combinations → verify correct actions triggered

#### Files to Create/Modify

- `packages/editor/src/hooks/useKeyboardShortcuts.ts` — (create) Keyboard shortcut handler
- `packages/editor/src/App.tsx` — (modify) Wire shortcuts to actions
- `packages/editor/src/__tests__/keyboard-shortcuts.test.ts` — (create) Shortcut tests

#### Implementation Notes

Use a `useEffect` with `document.addEventListener('keydown', handler)`. Check for modifier keys (`ctrlKey`, `shiftKey`) and key codes. Prevent default browser behavior for conflicting shortcuts (e.g., Ctrl+S). Map shortcuts to action functions.

#### Evaluation Checklist

- [ ] All shortcuts trigger correct actions
- [ ] No conflicts with browser/editor shortcuts

---

### T180: Implement Onboarding Flow

**PRD Reference:** Sprint 4, Task 8 (Onboarding flow for first-time users)
**Depends on:** T177
**Blocks:** Nothing
**User Stories:** US-30
**Estimated scope:** 1 hour

#### Description

Create a guided onboarding flow for first-time users that explains what Manum does, how attribution colors work, and how branching works.

#### Acceptance Criteria

- [ ] First launch triggers the onboarding flow (detected via IndexedDB flag)
- [ ] Onboarding explains: what Manum does, attribution colors (green/yellow/red), branching
- [ ] Onboarding uses manuscript aesthetic (hand-drawn elements, warm tones)
- [ ] Flow can be skipped via a "Skip" button
- [ ] Flow can be replayed from settings
- [ ] After onboarding, user lands in the editor with a new empty document
- [ ] Covers extension installation/connection status

#### Files to Create/Modify

- `packages/editor/src/components/Onboarding.tsx` — (create) Onboarding flow component
- `packages/editor/src/components/onboarding/Steps.tsx` — (create) Individual onboarding steps
- `packages/editor/src/App.tsx` — (modify) Show onboarding on first launch

#### Implementation Notes

Multi-step modal or full-screen flow. Steps:
1. Welcome — "Manum tracks how much of your writing is yours"
2. Colors — Explain green/yellow/red with visual examples
3. Branching — Explain section-level branching
4. Extension — Check and show connection status
5. Start — Create first document

Use Caveat font for headings, rough.js for decorative borders. Store `onboarding_completed: true` in IndexedDB settings after completion.

#### Evaluation Checklist

- [ ] Onboarding shows on first launch
- [ ] Can be skipped and replayed

---

### T181: Final UI Polish and Aesthetic Refinements

**PRD Reference:** Sprint 4, Task 8 (Polish and UX); UI Design Direction
**Depends on:** T177, T178, T180
**Blocks:** Nothing
**User Stories:** US-29, US-30
**Estimated scope:** 2 hours

#### Description

Final pass on UI polish: index-card style branch cards, tape overlays, marker highlights using SVGBox pen-brushes, consistent spacing, and overall aesthetic coherence.

#### Acceptance Criteria

- [ ] Branch cards use index-card style with tape overlay and drop shadows
- [ ] Card rotations (-0.5deg to 1.5deg) applied consistently
- [ ] Marker highlights use SVG pen-brush styling where applicable
- [ ] All UI components use consistent manuscript aesthetic
- [ ] No unstyled or generic-looking components remain
- [ ] Responsive behavior: editor remains usable at various viewport widths

#### Files to Create/Modify

- `packages/editor/src/styles/cards.css` — (create) Index card and tape overlay styles
- `packages/editor/src/styles/highlights.css` — (create) Marker highlight styles
- Various component files — (modify) Apply final styling tweaks

#### Implementation Notes

Index card style: `background: var(--color-paper); box-shadow: 2px 2px 5px rgba(0,0,0,0.1); transform: rotate(calc(-0.5deg + random * 2deg))`. Tape overlay: pseudo-element with semi-transparent beige strip across the top. Use SVG `<filter>` elements for displacement effects on marker highlights. This task is a polish pass — test each component visually and fix inconsistencies.

#### Evaluation Checklist

- [ ] All components have consistent manuscript aesthetic
- [ ] No unstyled elements visible
- [ ] Branch cards, timeline, nav bar all look cohesive
