# Phase 4: RED Attribution & Edit Tracking

## Prerequisites

- Phase 3 complete: TipTap editor renders with manuscript aesthetic, documents persist in IndexedDB, extension data syncs
- Custom `attribution` mark registered with TipTap (T063)
- IndexedDB has AI pool entries and copy records synced from extension (T071)
- Editor handles paste events (TipTap provides `onPaste` hook)

## Infrastructure Updates Required

### IU-1: Add Paste Event Hook to Editor Component

**File:** `packages/editor/src/components/Editor.tsx`

The Editor component needs to expose paste events for attribution processing. T090 depends on this hook being available.

```typescript
// In useEditor config, add:
editorProps: {
  handlePaste: (view, event, slice) => {
    // Will be wired to attribution handler in T090
    return false; // Let TipTap handle the paste, but intercept data
  },
}
```

**Tests:** Verify editor still accepts paste events after adding the hook.

## Phase Goal

Pastes from AI are automatically detected and tagged RED, edits are tracked with Levenshtein distance causing color transitions, and an attribution overlay can be toggled to visualize the document's AI provenance.

## Phase Evaluation Criteria

- Paste text that matches a copy record in IndexedDB → span tagged RED with source metadata
- Paste text matching >80% of an AI pool entry (no copy record) → span tagged RED with lower confidence
- Paste text with no AI match → span remains GREEN
- Edit a RED span by ~25% → verify it transitions to YELLOW
- Edit a RED span by ~75% → verify it transitions to GREEN
- Attribution overlay toggle: OFF by default, shows colored highlighting when ON
- Yellow gradient: visually darker at 20% edit distance, lighter approaching 70%
- Summary bar displays correct percentages for a mixed document
- `pnpm --filter editor test` passes all attribution-related tests
- All quality gates green (lint, types, tests)

---

## Tasks

### T090: Implement Paste Event Listener on TipTap Editor

**PRD Reference:** Sprint 2, Task 2 (Paste event capture in editor)
**Depends on:** Nothing
**Blocks:** T091, T093
**User Stories:** US-10
**Estimated scope:** 30 min

#### Description

Create a paste event handler that intercepts paste events in the TipTap editor, extracts clipboard text, and triggers the attribution matching pipeline.

#### Acceptance Criteria

- [ ] Paste events in the editor are intercepted and clipboard text is extracted
- [ ] `clipboardData.getData('text/plain')` provides the pasted text
- [ ] Pasted text and its position (start, end) in the document are captured
- [ ] The paste handler calls into the attribution matching module (T091)
- [ ] Normal paste behavior is preserved (text still appears in the editor)
- [ ] Test verifies paste event interception and data extraction

#### Files to Create/Modify

- `packages/editor/src/attribution/paste-handler.ts` — (create) Paste event processing
- `packages/editor/src/components/Editor.tsx` — (modify) Wire paste handler to TipTap
- `packages/editor/src/__tests__/paste-handler.test.ts` — (create) Paste interception tests

#### Implementation Notes

Use TipTap's `editorProps.handlePaste` to intercept. Extract text via `event.clipboardData.getData('text/plain')`. After TipTap inserts the text, determine the position range using the editor's selection state before and after paste. Pass `{ text, start, end, timestamp }` to the matching module.

#### Evaluation Checklist

- [ ] Paste handler tests pass
- [ ] Pasted text appears in the editor normally

---

### T091: Implement Copy Record Matching for Paste Attribution

**PRD Reference:** Sprint 2, Task 2 (Cross-reference clipboard data with copy records)
**Depends on:** T090
**Blocks:** T092
**User Stories:** US-10
**Estimated scope:** 1 hour

#### Description

When text is pasted, search the synced copy records in IndexedDB for a match. A match means the pasted text was previously copied from an AI response on Claude.ai.

#### Acceptance Criteria

- [ ] On paste, query IndexedDB copy records for matching text
- [ ] Match criteria: pasted text equals or is a substring of a copy record's `selectedText`
- [ ] Most recent matching copy record is selected (by timestamp)
- [ ] Match result includes the `sourceMessageId` linking to the AI response
- [ ] No match returns null (triggering the unlinked paste fallback)
- [ ] Test with known copy records verifies correct matching

#### Files to Create/Modify

- `packages/editor/src/attribution/copy-matcher.ts` — (create) Copy record matching logic
- `packages/editor/src/__tests__/copy-matcher.test.ts` — (create) Matching tests

#### Implementation Notes

Simple matching strategy: exact match on `selectedText` first, then substring match (pasted text contained within a copy record). Use the most recent match to handle cases where the user copied the same text multiple times. Query IndexedDB's `copy_records` store with a cursor scan (or load all into memory if the set is small — typically under 1000 records).

#### Evaluation Checklist

- [ ] Exact match test passes
- [ ] Substring match test passes
- [ ] No-match case returns null

---

### T092: Implement RED Span Tagging with Source Metadata

**PRD Reference:** Sprint 2, Task 2 (Tag pasted span as RED with source link)
**Depends on:** T091
**Blocks:** T094
**User Stories:** US-10
**Estimated scope:** 1 hour

#### Description

When a paste matches a copy record, apply the `attribution` mark to the pasted text range with RED color, source metadata, and the original paste content.

#### Acceptance Criteria

- [ ] Matched paste text range receives the `attribution` mark with `color: 'red'`
- [ ] Mark attributes include: `pasteEventId`, `originalPasteContent`, `confidence: 1.0`, `createdAt`
- [ ] The mark is applied after TipTap finishes inserting the pasted text
- [ ] Original paste content is stored in the mark for later edit-distance comparison
- [ ] Test: paste matching text → verify attribution mark with correct attributes on the range

#### Files to Create/Modify

- `packages/editor/src/attribution/tagger.ts` — (create) Apply attribution marks to text ranges
- `packages/editor/src/__tests__/tagger.test.ts` — (create) Tagging tests

#### Implementation Notes

Use TipTap's `editor.chain().setTextSelection({ from, to }).setMark('attribution', { color: 'red', ... }).run()` to apply the mark. The `from` and `to` positions come from the paste handler. Store `Date.now()` as `createdAt`. Generate a unique `pasteEventId` (UUID) for tracking.

#### Evaluation Checklist

- [ ] RED tagging test passes with correct mark attributes
- [ ] Mark is visible in `editor.getJSON()` output

---

### T093: Implement Unlinked Paste Fallback

**PRD Reference:** Sprint 2, Task 3 (Unlinked paste fallback — substring matching)
**Depends on:** T090
**Blocks:** Nothing
**User Stories:** US-11
**Estimated scope:** 1 hour

#### Description

When no copy record matches a paste, run substring matching against the AI knowledge pool. If >80% of the pasted text appears verbatim in any AI pool entry, tag the paste as RED with lower confidence.

#### Acceptance Criteria

- [ ] When copy record matching returns null, AI pool substring matching runs
- [ ] Matching: check if the pasted text (or 80%+ of it) appears as a substring in any AI pool entry
- [ ] Matched pastes are tagged RED with `confidence < 1.0` (e.g., 0.8)
- [ ] The matched AI pool entry's `messageId` is stored in the attribution metadata
- [ ] Non-matching pastes are tagged GREEN (original content)
- [ ] Test with known AI pool entries verifies correct matching and confidence

#### Files to Create/Modify

- `packages/editor/src/attribution/unlinked-matcher.ts` — (create) AI pool substring matching
- `packages/editor/src/__tests__/unlinked-matcher.test.ts` — (create) Unlinked matching tests

#### Implementation Notes

For each AI pool entry, check if the pasted text is a substring (case-insensitive). If not an exact substring, compute the longest common substring and check if it covers >80% of the pasted text length. This is the simple fallback — not the n-gram matching from Phase 5. Performance: iterate over AI pool entries loaded into memory. For large pools, consider indexing by first few words.

#### Evaluation Checklist

- [ ] Exact substring match test passes (confidence < 1.0)
- [ ] 80%+ partial match test passes
- [ ] Below-threshold match results in GREEN tag

---

### T094: Implement Character-Level Levenshtein Distance

**PRD Reference:** Sprint 2, Task 4 (Edit tracking — edit distance computation)
**Depends on:** T092
**Blocks:** T095
**User Stories:** US-12
**Estimated scope:** 1 hour

#### Description

Implement character-level Levenshtein distance computation that returns a normalized distance (0.0 to 1.0) between two strings. This is the core metric for edit-distance-based attribution.

#### Acceptance Criteria

- [ ] Function: `computeEditDistance(original: string, current: string): number` returns 0.0-1.0
- [ ] Distance 0.0 = identical strings, 1.0 = completely different
- [ ] Normalized by the length of the longer string
- [ ] Handles edge cases: empty strings, single characters, very long strings
- [ ] Performance: computes in <50ms for strings up to 5000 characters
- [ ] Unit tests with known string pairs verify correct distances

#### Files to Create/Modify

- `packages/editor/src/attribution/levenshtein.ts` — (create) Levenshtein distance implementation
- `packages/editor/src/__tests__/levenshtein.test.ts` — (create) Distance computation tests

#### Implementation Notes

Standard dynamic programming Levenshtein with space optimization (two-row approach instead of full matrix). Normalize: `distance / Math.max(original.length, current.length)`. Test cases:
- `("hello", "hello")` → 0.0
- `("hello", "hxllo")` → 0.2
- `("abc", "xyz")` → 1.0
- `("The quick brown fox", "The slow brown fox")` → should reflect word-level change

For strings >5000 chars, consider early termination if distance already exceeds 0.7 (GREEN threshold).

#### Evaluation Checklist

- [ ] All distance tests pass with correct normalized values
- [ ] Performance test: 5000-char strings compute in <50ms

---

### T095: Implement Edit Distance Tracking Per RED Span

**PRD Reference:** Sprint 2, Task 4 (Track every edit within a RED-tagged span)
**Depends on:** T094
**Blocks:** T096
**User Stories:** US-12
**Estimated scope:** 1 hour

#### Description

Track edits within RED-tagged spans and recompute the Levenshtein distance from the original paste content. Use debounced re-scoring to avoid performance hits during rapid typing.

#### Acceptance Criteria

- [ ] On each edit within a RED span, the current text is compared to `originalPasteContent`
- [ ] Edit distance is updated in the attribution mark's `editDistance` attribute
- [ ] Re-scoring is debounced: only triggers after 500ms of no edits within that span
- [ ] Only the edited span is re-scored, not the entire document
- [ ] Test: edit a RED span → verify editDistance updates correctly

#### Files to Create/Modify

- `packages/editor/src/attribution/edit-tracker.ts` — (create) Edit tracking and re-scoring logic
- `packages/editor/src/hooks/useEditTracking.ts` — (create) React hook for edit tracking lifecycle
- `packages/editor/src/__tests__/edit-tracker.test.ts` — (create) Edit tracking tests

#### Implementation Notes

Use TipTap's `onTransaction` to detect edits. For each transaction, check if any changes fall within a span that has an `attribution` mark with `color: 'red'` or `color: 'yellow'`. If so, extract the current text of that span and schedule a debounced re-score. To find the current text of a span: use `editor.state.doc.textBetween(from, to)`. Track pending re-scores in a Map keyed by span position.

#### Evaluation Checklist

- [ ] Edit tracking tests pass: edit RED span → distance updated
- [ ] Debounce works: rapid edits → single re-score

---

### T096: Implement State Transitions (RED→YELLOW→GREEN)

**PRD Reference:** Sprint 2, Task 4 (State transitions at 20% and 70%)
**Depends on:** T095
**Blocks:** Nothing
**User Stories:** US-12
**Estimated scope:** 30 min

#### Description

Implement color state transitions based on edit distance thresholds. When edit distance crosses 20%, transition RED→YELLOW. When it crosses 70%, transition to GREEN.

#### Acceptance Criteria

- [ ] Edit distance < 0.20 → span stays RED
- [ ] Edit distance >= 0.20 and < 0.70 → span transitions to YELLOW
- [ ] Edit distance >= 0.70 → span transitions to GREEN
- [ ] Transitions update the `color` attribute of the attribution mark
- [ ] YELLOW→GREEN transition via edit distance IS allowed (this is edit-distance mode, not idea overlap)
- [ ] Original paste content is preserved in metadata even after GREEN transition
- [ ] Test: verify correct transitions at boundary values (0.19, 0.20, 0.69, 0.70)

#### Files to Create/Modify

- `packages/editor/src/attribution/transitions.ts` — (create) State transition logic
- `packages/editor/src/attribution/edit-tracker.ts` — (modify) Call transition logic after re-score
- `packages/editor/src/__tests__/transitions.test.ts` — (create) Transition tests at boundaries

#### Implementation Notes

Simple threshold check:
```typescript
function getColorFromEditDistance(distance: number): 'red' | 'yellow' | 'green' {
  if (distance >= 0.70) return 'green';
  if (distance >= 0.20) return 'yellow';
  return 'red';
}
```
After computing the new distance in the edit tracker, call this function and update the mark if the color changed. Use `editor.chain().setTextSelection({ from, to }).updateAttributes('attribution', { color, editDistance }).run()`.

Note: The PRD's "YELLOW→GREEN not possible" rule applies to YELLOW assigned by idea overlap detection (Phase 5), not to edit-distance-based transitions. Edit-distance YELLOW can become GREEN through further editing.

#### Evaluation Checklist

- [ ] Boundary value tests pass (0.19→RED, 0.20→YELLOW, 0.69→YELLOW, 0.70→GREEN)
- [ ] Original paste content preserved after all transitions

---

### T097: Implement Attribution Overlay Toggle Button

**PRD Reference:** Sprint 2, Task 5 (Toggle button: "Show Attribution")
**Depends on:** Nothing
**Blocks:** T098
**User Stories:** US-13
**Estimated scope:** 30 min

#### Description

Add a toggle button to the editor UI that enables/disables the attribution overlay. The overlay is OFF by default and does not persist across sessions.

#### Acceptance Criteria

- [ ] "Show Attribution" toggle button visible in the editor UI (toolbar or floating button)
- [ ] Toggle state starts OFF on every session
- [ ] Clicking toggles between ON and OFF
- [ ] Toggle state is passed to the overlay rendering system (T098)
- [ ] Button uses manuscript aesthetic styling (wired-toggle or similar)
- [ ] Test: toggle button renders and changes state on click

#### Files to Create/Modify

- `packages/editor/src/components/AttributionToggle.tsx` — (create) Toggle button component
- `packages/editor/src/components/Editor.tsx` — (modify) Include toggle in editor UI
- `packages/editor/src/hooks/useAttributionOverlay.ts` — (create) Overlay state management

#### Implementation Notes

Use a `wired-toggle` or `wired-checkbox` from wired-elements. State managed via `useState(false)`. Pass the boolean down to the overlay rendering layer. Position the toggle in the toolbar area or as a floating action button.

#### Evaluation Checklist

- [ ] Toggle button renders with correct default state (OFF)
- [ ] Click toggles state

---

### T098: Implement Span Highlighting (Green/Yellow/Red Backgrounds)

**PRD Reference:** Sprint 2, Task 5 (Attribution overlay highlighting)
**Depends on:** T097
**Blocks:** T099, T100
**User Stories:** US-13
**Estimated scope:** 1 hour

#### Description

When the attribution overlay is ON, render colored background highlights on attributed text spans. GREEN for original, YELLOW for AI-influenced, RED for direct paste.

#### Acceptance Criteria

- [ ] When overlay is ON, spans with `attribution` marks show colored backgrounds
- [ ] GREEN spans: light green background
- [ ] YELLOW spans: yellow background (intensity varies — see T099)
- [ ] RED spans: light red background
- [ ] When overlay is OFF, no colored backgrounds are visible
- [ ] Underlying text content is unchanged regardless of overlay state
- [ ] Test: apply marks, toggle overlay, verify CSS classes appear/disappear

#### Files to Create/Modify

- `packages/editor/src/styles/attribution.css` — (create) Attribution overlay CSS
- `packages/editor/src/editor/marks/attribution.ts` — (modify) Add renderHTML that outputs data attributes for CSS targeting
- `packages/editor/src/__tests__/attribution-overlay.test.ts` — (create) Overlay rendering tests

#### Implementation Notes

Two approaches: (1) Use TipTap decorations that are added/removed based on toggle state, or (2) always render `data-attribution-color` attributes on spans and use a CSS class on the editor container to show/hide highlighting.

Approach 2 is simpler:
```css
.editor-container.show-attribution [data-attribution-color="red"] {
  background-color: rgba(255, 100, 100, 0.3);
}
.editor-container.show-attribution [data-attribution-color="yellow"] {
  background-color: rgba(255, 200, 50, 0.3);
}
.editor-container.show-attribution [data-attribution-color="green"] {
  background-color: rgba(100, 200, 100, 0.2);
}
```

Toggle the `show-attribution` class on the editor container div.

#### Evaluation Checklist

- [ ] Colored backgrounds appear when overlay is ON
- [ ] No backgrounds when overlay is OFF
- [ ] Document content unchanged by toggle

---

### T099: Implement Yellow Gradient Based on Edit Distance

**PRD Reference:** Sprint 2, Task 5 (Yellow gradient: darker at 20%, lighter at 70%)
**Depends on:** T098
**Blocks:** Nothing
**User Stories:** US-13
**Estimated scope:** 30 min

#### Description

YELLOW spans should show a gradient intensity — darker yellow near the 20% edit distance threshold, fading lighter as it approaches 70%.

#### Acceptance Criteria

- [ ] Yellow background opacity/intensity varies based on `editDistance` attribute
- [ ] At 20% edit distance → darkest yellow (most opaque)
- [ ] At 69% edit distance → lightest yellow (least opaque)
- [ ] Gradient is smooth and visually perceptible
- [ ] Test: spans with different edit distances show different yellow intensities

#### Files to Create/Modify

- `packages/editor/src/styles/attribution.css` — (modify) Add gradient CSS
- `packages/editor/src/editor/marks/attribution.ts` — (modify) Output edit distance as CSS custom property

#### Implementation Notes

In the mark's `renderHTML`, output the edit distance as a CSS custom property on the span:
```typescript
renderHTML({ HTMLAttributes }) {
  return ['span', {
    ...HTMLAttributes,
    'data-attribution-color': HTMLAttributes.color,
    style: `--edit-distance: ${HTMLAttributes.editDistance || 0}`,
  }, 0];
}
```
In CSS, compute opacity from edit distance:
```css
.show-attribution [data-attribution-color="yellow"] {
  /* Opacity from 0.4 (at 20%) to 0.1 (at 70%) */
  background-color: rgba(255, 200, 50, calc(0.4 - (var(--edit-distance, 0.2) - 0.2) * 0.6));
}
```
Alternatively, use inline styles computed in the mark's render function.

#### Evaluation Checklist

- [ ] Yellow intensity visually varies with edit distance
- [ ] Gradient is smooth between 20% and 70%

---

### T100: Implement Summary Bar with Percentage Breakdown

**PRD Reference:** Sprint 2, Task 5 (Summary bar: percentage breakdown)
**Depends on:** T098
**Blocks:** Nothing
**User Stories:** US-13
**Estimated scope:** 1 hour

#### Description

Add a summary bar that displays the percentage breakdown of green/yellow/red content in the document. The bar shows when the attribution overlay is ON.

#### Acceptance Criteria

- [ ] Summary bar appears when attribution overlay is toggled ON
- [ ] Bar shows colored segments proportional to content percentages
- [ ] Text labels show percentages (e.g., "72% green | 18% yellow | 10% red")
- [ ] Percentages are computed from character count of each attribution color
- [ ] Bar updates as document content changes
- [ ] Unattributed text (no mark) is counted as GREEN
- [ ] Test: document with known attribution → verify correct percentages

#### Files to Create/Modify

- `packages/editor/src/components/SummaryBar.tsx` — (create) Summary bar component
- `packages/editor/src/attribution/calculator.ts` — (create) Attribution percentage calculation
- `packages/editor/src/components/Editor.tsx` — (modify) Include summary bar when overlay is ON
- `packages/editor/src/__tests__/calculator.test.ts` — (create) Percentage calculation tests

#### Implementation Notes

To compute percentages, iterate over the TipTap document's content and check each text node for `attribution` marks. Sum character counts by color. Unattributed text counts as green. Render as a horizontal bar with colored segments using CSS `flex` or `grid`. Style with manuscript aesthetic — maybe a rough.js bar or hand-drawn segment boundaries.

```typescript
function computeAttributionRatios(doc: JSONContent): { green: number; yellow: number; red: number } {
  // Walk the document tree, sum characters by attribution color
}
```

#### Evaluation Checklist

- [ ] Percentage calculation tests pass with known documents
- [ ] Summary bar renders with correct segment proportions
