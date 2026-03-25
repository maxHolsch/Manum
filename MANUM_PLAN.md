# Manum: Comprehensive Build Plan

## What Manum Is

Manum is a system that captures the complete trace of AI-assisted intellectual work and makes it legible. It answers one question: **how much of what I made was mine?**

It consists of a Chrome extension that watches AI chat sessions, and a web-based editor that tracks every keystroke, paste, branch, and revision — then attributes each span of text as green (original), yellow (AI-influenced), or red (directly pasted).

The editor adds git-style branching at the section level, a visual commit timeline, and behavioral analytics. The purpose is not surveillance but reflection: helping writers understand whether they are using AI to become better thinkers, or using it to avoid the difficult work of thinking.

### Target User

Writers, essayists, researchers, and thinkers who use AI seriously and want to maintain intellectual honesty about their process. People who have noticed the GPS problem applied to thinking — they navigate ideas more reliably with AI, but couldn't reproduce the map without it, and can't always say which ideas in it are theirs.

---

## Architecture Overview

```
CHROME EXTENSION (Capture Layer)          WEB APP (Editor + Engine)
─────────────────────────────────         ─────────────────────────
Content Script (claude.ai)                TipTap Editor (React)
│                                         │
├─ AI response capture                    ├─ Keystroke logger
├─ Copy event capture                     ├─ Paste event handler
├─ Tab focus/blur tracking                ├─ Attribution engine
│                                         ├─ Git branching (isomorphic-git)
└───────► chrome.storage ◄────────────────┘ ├─ Commit timeline
         (shared state)                     ├─ Analytics dashboard
                                            └─ Settings panel
```

**Tech stack:**
- Chrome Extension: Manifest V3, content scripts, service worker, offscreen documents
- Web App: React, TipTap (ProseMirror), isomorphic-git, IndexedDB
- Attribution: Edit-distance scoring (simple mode) + Claude Haiku API (LLM mode), toggleable in settings
- Design: Manuscript/literary aesthetic — warm parchment tones, typewriter fonts (Special Elite, Courier Prime, Caveat)

**Visual / UI library stack:**

| Purpose | Library | Why Not the Mainstream Option |
|---------|---------|-------------------------------|
| Hand-drawn shapes | `rough.js` | Instead of clean SVG/CSS borders |
| Hand-drawn annotations | `rough-notation` | Instead of CSS `background-color` highlights |
| Sketchy UI components | `wired-elements` | Instead of shadcn/Radix/Material |
| Hand-drawn charts | `chart.xkcd` + `react-rough-fiber` | Instead of recharts/chart.js |
| Freehand connector lines | `perfect-freehand` | Instead of SVG `<line>` elements |
| CSS sketchy borders | `rough-paint` (Houdini) | Instead of `border: 1px solid` |
| Paper textures | `css-doodle` + `feTurbulence` SVG filters | Instead of image assets |
| Marker highlights | SVGBox pen-brushes + SVG displacement filters | Instead of `background-color: yellow` |
| CSS framework | `PaperCSS` or none (custom) | Instead of Tailwind/Bootstrap |
| Typewriter body font | `Special Elite` (Google Fonts) | Instead of system monospace |
| Handwriting font | `Caveat` (Google Fonts) | Instead of sans-serif UI font |
| Monospace metadata font | `Courier Prime` (Google Fonts) | Instead of system Courier |
| Editor framework | TipTap (headless, fully styleable) | Chosen for custom mark/node extensibility |

---

## Attribution Model

### The Three Colors

| Color | Meaning | Detection Method |
|-------|---------|-----------------|
| **Green** | Original — you wrote it before the AI discussed it | Default state. Typed text with no AI pool overlap above threshold |
| **Yellow** | AI-influenced — you paraphrased, restructured, or the idea was AI-surfaced first | Edit distance 20-70% from source, or LLM judges "same idea, different expression" |
| **Red** | Directly pasted from AI chatbot | Edit distance <20% from a copy event, or exact substring match |

### Two Scoring Modes (Settings Toggle)

**Mode 1: Edit Distance (Simple, Default)**
- Red: edit distance from source < 20% of characters changed
- Yellow: edit distance 20-70% changed (with gradient shading — darker yellow near 20%, lighter near 70%)
- Green: > 70% changed, or no matching AI pool entry predates it

**Mode 2: LLM Judge (Haiku)**
- Sends user span + candidate AI pool entries to Claude Haiku
- Haiku returns a similarity score (0-1) and a classification (green/yellow/red)
- More expensive, more accurate on semantic paraphrasing
- Falls back to edit-distance mode if API is unavailable

### The Temporal Gating Rule

If the user writes something BEFORE the AI says something similar, the user's text stays green. The AI knowledge pool only matches entries with timestamps *before* the user's text. If you had the idea first, it's yours.

### State Transitions

- Red -> Yellow: user edits a paste enough that edit distance > 20%
- Red -> Green: user rewrites so thoroughly that edit distance > 70%
- Yellow -> Green: **not possible** — once the AI said it first, the overlap is permanent
- Green -> Yellow: AI says something similar after? **No change** — temporal priority protects the user

### Data Schema

```typescript
interface AttributionSpan {
  start: number                    // position in document
  end: number
  color: 'green' | 'yellow' | 'red'
  confidence: number               // 0-1
  scoring_mode: 'edit-distance' | 'llm-judge'
  paste_event_id?: string          // RED: link to paste event
  original_paste_content?: string
  edit_distance_from_paste?: number
  matched_ai_entries?: {           // YELLOW: matched pool entries
    ai_message_id: string
    overlap_score: number
    method: string
    ai_timestamp: number
  }[]
  created_at: number               // when user wrote/pasted
  last_modified: number
}
```

---

## Git-Based Editor

### Core Concepts

Built on **isomorphic-git** (real git, not a reimplementation) with TipTap as the editor layer.

### Branching

- **Branch from tree**: Plus button creates a branch of the current document state
- **Branch from selection**: Highlight a section, create a branch of just that section
- **Branch markers**: Branched sections are marked with L-shaped indicators on both sides
- **Branch preview**: Horizontal scroller at the bottom of a branched section to preview other branches
- **Merge**: Double-click the branch number to attempt merging that branch into the current branch

### Commit Timeline

- Vertical timeline in the side drawer ("The Paper Drawer")
- Each commit entry shows: timestamp, title (LLM-generated), summary
- Active commit highlighted with accent color (#4A5E8A)
- Scrubbing through commits highlights additions in green, removals in red (diff from previous commit)
- LLM generates metadata for each commit (summary, what changed conceptually)

### Underlying Implementation

- Each "save" or auto-save creates a git commit via isomorphic-git
- Document state stored as structured JSON (TipTap document model)
- Branches map to actual git branches
- Diffs computed via git diff between commits
- IndexedDB as the backing store for isomorphic-git (via lightning-fs)

---

## Behavioral Analytics

### Events to Capture

| Event | What It Measures |
|-------|-----------------|
| Edit events (keystrokes, insertions) | Writing velocity, burst patterns |
| Paste events | AI dependency frequency |
| Deletion events | Revision behavior, self-editing patterns |
| Insertion events | Where new content appears relative to existing |
| Scroll away from cursor | Rereading behavior, reference checking |
| Active time (continuous typing) | Deep work sessions vs. fragmented |
| Tab switches (away from editor) | Context switching frequency |
| AI agent usage (chat tab active) | Time spent consulting AI vs. writing |
| Branch creation frequency | Exploration behavior |
| Branch sizes (word count per branch) | Depth of exploration |

### Analytics Display

- Summary ratio: e.g., "72% green | 18% yellow | 10% red"
- Cross-project comparison (ratios over time, across documents)
- Session timeline showing active writing vs. AI consultation vs. idle
- Attribution overlay is OFF by default, toggled via button

---

## UI Design Direction

Manuscript/literary aesthetic derived from Figma mockups. Key principles:

- **Color palette**: Warm parchment (#FBF3E3, #FFF8EF, #E1D9CA), dark ink (#080200, #1E1B12), muted blue accent (#4A5E8A), warm grays (#80756D, #D2C4BA)
- **Typography**: Special Elite (body text, headings), Courier Prime (metadata, timestamps, labels), Caveat (handwritten notes, branch labels, timeline entries)
- **Layout**: Centered editor column (768px max-width), right side drawer for timeline/branches (320px), floating bottom nav bar with blur backdrop
- **Texture**: Subtle paper grain overlay at 5% opacity, slight rotations (-0.5deg to 1.5deg) on cards and side panel for handcrafted feel
- **Branch cards**: Index-card style with tape overlay, slight rotations, drop shadows, handwritten font for content
- **Active branch**: Blue border (#4A5E8A) with gold accent (#E5C276), merge icon in corner

---

## Sprint Plan

### Sprint 1: Capture Layer (Chrome Extension MVP)

**Goal**: Chrome extension that captures AI responses and copy events from Claude.ai, stores them with timestamps.

#### Tasks

1. **Manifest V3 scaffolding**
   - manifest.json with permissions: host (claude.ai), clipboardRead, tabs, storage, offscreen
   - Content script entry for claude.ai
   - Service worker for background coordination
   - Offscreen document for clipboard access

2. **AI response extraction content script**
   - MutationObserver on Claude.ai conversation container
   - Detect new assistant message elements via stable selectors (data-* attributes, ARIA roles)
   - Debounce for streaming completion (wait for message to stop growing)
   - Extract full response text with message ID and timestamp
   - Store in chrome.storage.local as AI knowledge pool entries

3. **Copy event listener**
   - Listen for 'copy' events on Claude.ai pages
   - Capture selected text, source message ID, timestamp
   - Store as pending copy record in chrome.storage.local

4. **Tab tracking**
   - chrome.tabs.onActivated listener in service worker
   - document.visibilitychange listener in content scripts
   - Log tab switches with timestamps (editor tab vs. AI tab vs. other)

5. **Offscreen document for clipboard**
   - chrome.offscreen.createDocument() setup
   - Message passing between service worker and offscreen document
   - navigator.clipboard.readText() fallback for unlinked pastes

6. **Storage schema and management**
   - Define chrome.storage.local schema for: AI pool, copy records, tab events
   - Implement storage cleanup (cap at reasonable size, LRU eviction)
   - Request unlimitedStorage permission

#### Tests for Sprint 1

**Unit Tests:**
- DOM selector tests: mock Claude.ai DOM structures, verify selectors find assistant messages
- MutationObserver callback: mock DOM mutations, verify correct text extraction
- Streaming debounce: simulate token-by-token message growth, verify capture waits for completion
- Copy event handler: mock copy event with selection, verify storage record created
- Storage schema validation: verify records have required fields (timestamp, text, IDs)
- Storage cleanup: fill storage past threshold, verify LRU eviction works
- Tab event logging: mock tab activation events, verify timestamps recorded

**Integration Tests:**
- Content script injection: load extension in test browser, navigate to a mock page matching claude.ai permissions, verify content script runs
- Storage round-trip: write from content script, read from service worker, verify data integrity
- Offscreen document lifecycle: create, message, verify clipboard read, destroy
- Message passing: content script -> service worker -> offscreen document -> back, verify full chain

**Black-Box User Scenario Tests (via Chrome DevTools MCP):**

All E2E scenarios use DevTools MCP to control a live Chrome instance with the extension loaded (`--chrome-arg=--load-extension=...`). The agent can use `navigate_page` to go to Claude.ai (or a mock), `evaluate_script` to inspect chrome.storage and DOM state, `take_screenshot` for visual verification, and `list_console_messages` to catch errors.

- **Scenario A: "User reads AI response"**
  1. `navigate_page` to Claude.ai (or mock page serving Claude-like DOM)
  2. AI produces a streaming response (mock via injected DOM mutations)
  3. `evaluate_script` to read chrome.storage.local — verify response appears in AI knowledge pool with correct text and timestamp
  4. Verify: no false captures of user messages (check pool entries match only assistant role)

- **Scenario B: "User copies from AI"**
  1. AI response is present in DOM
  2. `evaluate_script` to select text range + `press_key` Ctrl+C to trigger copy event
  3. `evaluate_script` to read chrome.storage.local — verify copy record with correct selected text, source message ID, timestamp
  4. Verify: copy record matches the *selected* text, not the full response

- **Scenario C: "User switches tabs"**
  1. `navigate_page` to Claude.ai tab
  2. `new_page` + `select_page` to switch to editor tab
  3. `new_page` + `select_page` to switch to unrelated tab
  4. `select_page` back to Claude.ai
  5. `evaluate_script` to read tab event log from storage — verify all four tab-switch events with correct timestamps

- **Scenario D: "Multiple conversations"**
  1. `navigate_page` to conversation A on Claude.ai, inject mock AI response
  2. `navigate_page` to conversation B (SPA route change), inject mock AI response
  3. `evaluate_script` to verify both responses captured, correctly attributed to different conversations
  4. `list_console_messages` to verify no duplicate observer warnings

- **Scenario E: "Extension restart resilience"**
  1. Capture several AI responses via scenarios above
  2. `evaluate_script` to simulate service worker termination (chrome.runtime.reload or navigate away and back)
  3. `evaluate_script` to verify previously stored data persists in chrome.storage
  4. `navigate_page` to Claude.ai again — verify observers re-attach (inject new response, check it's captured)

---

### Sprint 2: Editor Core + RED Attribution

**Goal**: TipTap-based editor that detects pastes from AI, tags them red, and shows attribution overlay on toggle.

#### Tasks

1. **React + TipTap editor setup**
   - Project scaffolding (Vite + React + TypeScript)
   - TipTap editor with section-based document model
   - Basic toolbar (bold, italic, headings — minimal)
   - Manuscript aesthetic: Special Elite font, parchment background, centered 768px column

2. **Paste event capture in editor**
   - Listen for 'paste' events on TipTap editor
   - Extract clipboardData.getData('text/plain')
   - Cross-reference chrome.storage.local for matching copy records
   - If matched: tag pasted span as RED with source link and original text

3. **Unlinked paste fallback**
   - If no copy record matches, run substring matching against AI knowledge pool
   - Threshold: if >80% of pasted text appears verbatim in any AI pool entry, tag as RED
   - Store the match with lower confidence score

4. **Edit tracking on RED spans**
   - Track every edit within a RED-tagged span
   - Compute running edit distance from original paste
   - State transitions: RED -> YELLOW at 20% change, RED -> GREEN at 70% change
   - Re-score on every edit (debounced to avoid performance hit)

5. **Attribution overlay UI**
   - Toggle button: "Show Attribution" — off by default
   - When on: highlight spans with background colors (green/yellow/red with appropriate opacity)
   - Yellow spans show gradient: darker yellow (near 20% edit distance) to lighter yellow (near 70%)
   - Summary bar: "72% green | 18% yellow | 10% red" with colored segments

6. **Persistence layer**
   - IndexedDB for documents, attribution spans, AI knowledge pool (local copy)
   - Auto-save on edit (debounced, every 2 seconds of inactivity)
   - Document list view (simple, for MVP)

7. **Extension <-> Web App communication**
   - chrome.storage polling or chrome.runtime.sendMessage from editor page
   - Sync AI knowledge pool from extension to editor's IndexedDB
   - Sync copy records for paste matching

#### Tests for Sprint 2

**Unit Tests:**
- TipTap document model: create section, verify structure
- Paste event handler: mock paste with clipboard data, verify RED tagging
- Copy record matching: given a paste text and storage records, verify correct match found
- Unlinked paste detection: paste text not in copy records but present in AI pool, verify fallback match
- Edit distance calculation: known string pairs, verify correct distance scores
- State transition logic: RED span edited by X%, verify color changes at 20% and 70% thresholds
- Attribution overlay rendering: given spans with colors, verify correct CSS classes applied
- Summary ratio calculation: given document with mixed spans, verify percentages
- Auto-save debounce: rapid edits, verify only one save triggered after inactivity

**Integration Tests:**
- IndexedDB round-trip: save document with attribution spans, reload, verify all data intact
- Extension-to-editor sync: write AI pool entry in chrome.storage, verify it appears in editor's IndexedDB
- Full paste flow: copy record in storage -> paste in editor -> verify RED tag -> verify source link

**Black-Box User Scenario Tests (via Chrome DevTools MCP):**

Editor E2E tests use DevTools MCP to drive the editor in a real browser. `navigate_page` to the editor URL, `type_text` / `press_key` to simulate writing, `evaluate_script` to inspect TipTap document model and IndexedDB state, `take_screenshot` to capture visual attribution states.

- **Scenario F: "User pastes AI text directly"**
  1. `evaluate_script` to seed chrome.storage with a copy record (simulating prior copy from Claude.ai)
  2. `navigate_page` to editor, `click` into editor area
  3. `press_key` Ctrl+V to paste (with clipboard pre-loaded via `evaluate_script`)
  4. `evaluate_script` to inspect TipTap document model — verify pasted span tagged RED with correct source link
  5. `click` the attribution toggle button, `take_screenshot` — verify RED highlighting visible
  6. `evaluate_script` to read summary ratio — verify it reflects RED content

- **Scenario G: "User edits a paste lightly"**
  1. Set up RED paste per Scenario F
  2. `click` into the pasted span, `type_text` to change 2-3 words (~10% edit distance)
  3. `evaluate_script` — verify span remains RED
  4. `type_text` to change more words (~30% edit distance)
  5. `evaluate_script` — verify span transitions to YELLOW

- **Scenario H: "User rewrites a paste heavily"**
  1. Set up RED paste per Scenario F
  2. Select pasted text via `evaluate_script`, `type_text` to rewrite most of the paragraph (~75% edit distance)
  3. `evaluate_script` — verify span transitions to GREEN
  4. `evaluate_script` — verify original paste content still recorded in span metadata

- **Scenario I: "User pastes non-AI text"**
  1. Ensure chrome.storage has no matching copy records or AI pool entries
  2. `press_key` Ctrl+V to paste arbitrary text
  3. `evaluate_script` — verify pasted text is GREEN (no AI attribution)

- **Scenario J: "User types original text"**
  1. `navigate_page` to editor with empty document
  2. `type_text` several paragraphs of original content
  3. `evaluate_script` — verify all text is GREEN
  4. `evaluate_script` to read summary — verify 100% green

- **Scenario K: "Attribution overlay toggle"**
  1. Create mixed content (some pasted RED, some typed GREEN) via previous scenarios
  2. `take_screenshot` — verify no highlighting visible (overlay OFF by default)
  3. `click` the "Show Attribution" toggle
  4. `take_screenshot` — verify highlighting appears on attributed spans
  5. `click` toggle again, `take_screenshot` — verify highlighting disappears
  6. `evaluate_script` — verify underlying document content unchanged in both states

---

### Sprint 3: YELLOW Attribution + Git Branching

**Goal**: Idea-overlap detection for yellow scoring, and section-level branching in the editor.

#### Tasks

1. **N-gram matching engine (edit-distance mode)**
   - Segment user text into chunks (sentence-level)
   - For each chunk, compare against AI pool entries where AI timestamp < user timestamp
   - 3-5 word n-gram overlap scoring
   - Keyword/entity overlap as secondary signal
   - Combine signals into a single overlap score
   - Map score to yellow intensity (gradient)

2. **LLM judge mode (Haiku)**
   - Settings panel toggle: "Scoring Mode: Simple | AI-Assisted"
   - When AI-Assisted: batch candidate pairs (user chunk + AI pool entry) to Haiku
   - Prompt: "Rate similarity 0-1. Is this the same idea expressed differently, or genuinely independent?"
   - Parse response into score and classification
   - Cache results to avoid redundant API calls
   - Graceful fallback to edit-distance mode on API failure

3. **Temporal gating implementation**
   - Each user text span has a created_at timestamp
   - AI pool query: only return entries where ai_timestamp < span.created_at
   - If user wrote it first, AI pool match is excluded — text stays GREEN

4. **Git integration with isomorphic-git**
   - Initialize git repo in IndexedDB (via lightning-fs)
   - Auto-commit on save (document state as JSON)
   - Commit metadata: timestamp, word count delta, attribution snapshot

5. **Branch creation (from tree)**
   - Plus button in the side drawer creates a new branch from current HEAD
   - Branch name auto-generated (e.g., "branch-1", "branch-2") with option to rename
   - Side drawer shows list of branches with active branch highlighted

6. **Branch creation (from selection)**
   - User highlights a section of text
   - Context menu or floating button: "Branch this section"
   - Creates a new branch containing only the document state at that point
   - The branched section in the original is marked with L-shaped indicators

7. **Branch preview scroller**
   - Branched sections show a horizontal scroller at the bottom
   - Scroller tabs correspond to branches that modify that section
   - Clicking a tab shows a preview of how that section reads on the other branch
   - Active branch tab highlighted with accent color

8. **Branch merge**
   - Double-click branch number to initiate merge
   - Three-way merge on text content (common ancestor, current branch, incoming branch)
   - Simple cases: auto-merge and commit
   - Conflict cases: show both versions with accept/reject controls per section

#### Tests for Sprint 3

**Unit Tests:**
- N-gram extraction: known text, verify correct n-grams produced
- N-gram overlap scoring: two texts with known overlap, verify score
- Temporal gating: AI entry before user text (should match), AI entry after (should not match)
- LLM judge prompt construction: verify prompt format sent to Haiku
- LLM judge response parsing: mock API responses, verify score extraction
- LLM judge fallback: simulate API failure, verify edit-distance mode activates
- LLM judge caching: same pair sent twice, verify only one API call
- Git commit creation: save document, verify commit exists in repo
- Branch creation: create branch, verify git ref exists
- Branch listing: create multiple branches, verify list is correct
- Three-way merge: known ancestor/ours/theirs texts, verify merge output
- Merge conflict detection: overlapping edits, verify conflict marked

**Integration Tests:**
- Full yellow detection pipeline: AI pool populated -> user types similar text after -> verify YELLOW
- Temporal priority: user types text -> AI later says similar thing -> verify stays GREEN
- Git branch round-trip: create branch, switch to it, edit, switch back, verify both states preserved
- Merge flow: branch, edit on branch, edit on main, merge, verify combined result
- Scoring mode switch: score document in edit-distance mode, switch to LLM mode, verify re-scoring

**Black-Box User Scenario Tests:**
- **Scenario L: "AI suggests, user paraphrases"**
  1. AI response contains: "The market is shifting toward decentralized architectures"
  2. User later types: "Markets are moving toward decentralized systems"
  3. Verify: text is YELLOW (idea overlap detected, AI said it first)
  4. Verify: AI pool match shown with timestamp proving AI was first

- **Scenario M: "User has idea first"**
  1. User types: "We should consider event sourcing for the audit log"
  2. Later, AI suggests: "Event sourcing would be ideal for audit trails"
  3. Verify: user's text remains GREEN (temporal priority)

- **Scenario N: "User creates a branch"**
  1. User is writing a paragraph
  2. User clicks "+" to create a branch
  3. Verify: new branch appears in side drawer
  4. User writes different content on the branch
  5. User switches back to main
  6. Verify: original content is there, branch content is separate

- **Scenario O: "User branches a section"**
  1. User highlights a paragraph
  2. User clicks "Branch this section"
  3. Verify: L-shaped markers appear on both sides of the section
  4. Verify: scroller appears at bottom of section
  5. User edits the section on the new branch
  6. User scrolls to preview — verify both versions visible

- **Scenario P: "User merges a branch"**
  1. User creates branch, edits paragraph on branch
  2. User switches to main, double-clicks branch number
  3. Verify: if no conflict, merge happens and content updates
  4. Verify: commit appears in timeline

- **Scenario Q: "Merge conflict"**
  1. User creates branch from section
  2. User edits section on branch
  3. User also edits same section on main
  4. User attempts merge
  5. Verify: conflict UI appears with both versions
  6. User accepts one version
  7. Verify: merge completes, conflict resolved

- **Scenario R: "Scoring mode comparison"**
  1. User writes a document with mixed attribution
  2. User views attribution in edit-distance mode — note percentages
  3. User switches to LLM judge mode in settings
  4. Verify: re-scoring happens (may take a moment for API calls)
  5. Verify: some spans may change color (LLM catches semantic similarity that edit-distance misses)

---

### Sprint 4: Visualization + Analytics + Polish

**Goal**: Commit timeline, diff scrubbing, behavioral analytics dashboard, and cross-project comparison.

#### Tasks

1. **Commit timeline visualizer**
   - Vertical timeline in the side drawer
   - Each entry: timestamp, title, summary, branch indicator
   - Active commit highlighted with glow effect
   - Wobbly hand-drawn line connecting entries (SVG)
   - Click to navigate to that commit's state

2. **LLM-generated commit metadata**
   - On each commit, send diff to Haiku
   - Generate: short title, 1-sentence summary, conceptual description of what changed
   - Store as commit metadata in git notes or alongside commit
   - Fallback: auto-generated title from word count delta + timestamp

3. **Diff scrubbing view**
   - Scrub slider or click timeline entries to view any commit
   - Green text: additions (present in this commit, not in previous)
   - Red text: deletions (present in previous, not in this commit)
   - Clean diff rendering using the editor's own styling

4. **Behavioral analytics collection**
   - Event bus that captures all tracked events (see analytics table above)
   - Aggregate into session summaries: active time, paste count, branch count, etc.
   - Store in IndexedDB per document per session

5. **Analytics dashboard**
   - Attribution summary ratio with colored bar
   - Session timeline: visual bar showing writing (blue) vs. AI consultation (orange) vs. idle (gray)
   - Editing patterns: words written/deleted per session, paste frequency
   - Branch statistics: number of branches, average branch size

6. **Cross-project comparison**
   - Document list with attribution ratios per document
   - Trend chart: how green/yellow/red ratios change over time across projects
   - "Am I becoming more or less dependent on AI?" as a trackable metric

7. **Settings panel**
   - Scoring mode toggle: Edit Distance | LLM Judge
   - Connected AI platforms: Claude.ai (connected/disconnected status)
   - Storage usage and cleanup
   - Export data (documents, attribution data, analytics)

8. **Polish and UX**
   - Manuscript aesthetic refinements from Figma direction
   - Side drawer open/close animation
   - Bottom nav bar (Write | Branch | Insights modes)
   - Keyboard shortcuts for common actions
   - Onboarding flow for first-time users

#### Tests for Sprint 4

**Unit Tests:**
- Timeline rendering: given commits, verify correct ordering and formatting
- LLM commit summary: mock Haiku response, verify metadata extracted
- LLM commit fallback: API fails, verify auto-generated title used
- Diff computation: two document states, verify correct additions/deletions
- Analytics aggregation: stream of events, verify correct session summary
- Cross-project ratios: multiple documents with known attribution, verify comparison math
- Settings persistence: change scoring mode, reload, verify setting retained

**Integration Tests:**
- Timeline navigation: click timeline entry, verify editor shows that commit's state
- Diff scrubbing: navigate between commits, verify green/red highlighting updates
- Analytics event capture: perform actions in editor (type, paste, branch, switch tabs), verify all events recorded
- Export: create document with attribution, export, verify data integrity
- Full settings round-trip: change scoring mode -> re-score document -> verify new results

**Black-Box User Scenario Tests:**
- **Scenario S: "User reviews their writing history"**
  1. User has written a document over multiple sessions
  2. User opens timeline in side drawer
  3. Verify: commits listed chronologically with meaningful titles
  4. User clicks an earlier commit
  5. Verify: editor shows document as it was at that point
  6. User scrubs forward
  7. Verify: additions highlighted green, deletions highlighted red

- **Scenario T: "User checks their AI dependency"**
  1. User has written multiple documents (some AI-heavy, some original)
  2. User opens analytics/insights view
  3. Verify: each document shows its green/yellow/red ratio
  4. Verify: trend chart shows pattern over time
  5. User compares two documents side by side

- **Scenario U: "Complete writing session"**
  1. User opens editor, starts new document
  2. User types an introduction (GREEN)
  3. User switches to Claude.ai, asks a question
  4. User copies part of AI response, pastes into editor (RED)
  5. User edits the paste significantly (RED -> YELLOW)
  6. User types an original conclusion (GREEN)
  7. User branches a section, writes alternative
  8. User merges the better version back
  9. User toggles attribution overlay
  10. Verify: correct green/yellow/red highlighting
  11. Verify: timeline shows all commits
  12. Verify: analytics show tab switches, paste events, branch events
  13. Verify: summary ratio is accurate

- **Scenario V: "Extension disconnected gracefully"**
  1. User is writing in editor
  2. Chrome extension is disabled/uninstalled
  3. Verify: editor continues to work (writing, branching, saving)
  4. Verify: paste detection falls back to no-attribution (all GREEN)
  5. Verify: clear indication that capture layer is disconnected
  6. User re-enables extension
  7. Verify: connection restored, new captures resume

---

## Testing Strategy Overview

### Test Pyramid

```
         ┌───────────┐
         │  Black-Box │  Scenarios A-V (22 scenarios)
         │  User E2E  │  Full user journeys, real browser
         ├───────────┤
         │Integration │  Cross-component data flow
         │   Tests    │  Extension <-> Editor <-> Git <-> IndexedDB
         ├───────────┤
         │   Unit     │  Individual functions, pure logic
         │   Tests    │  Attribution engine, git ops, storage, UI components
         └───────────┘
```

### Testing Tools

- **Unit**: Vitest (for the web app), Jest (for extension scripts)
- **Integration**: Vitest + mock chrome APIs (webextension-polyfill, sinon-chrome)
- **E2E / Black-Box**: Chrome DevTools MCP (`chrome-devtools-mcp`) — gives Claude direct control of a live Chrome instance with the extension loaded. Tools available: `navigate_page`, `click`, `fill`, `type_text`, `evaluate_script`, `take_screenshot`, `list_console_messages`, `get_console_message`, `list_network_requests`, `press_key`, `wait_for`. This replaces Puppeteer/Playwright for E2E testing and allows the agent to interactively verify extension behavior, DOM state, and cross-tab flows during development.
- **Extension loading for E2E**: Launch Chrome via DevTools MCP with `--chrome-arg=--load-extension=/path/to/extension` to test content scripts, storage, and popup in a real browser
- **Visual regression**: `take_screenshot` after each major UI state to compare against baselines

### Continuous Feedback Loops

1. **Pre-commit**: Unit tests + lint (< 30 seconds)
2. **PR check**: Full unit + integration suite
3. **Nightly**: E2E black-box scenarios with real Chrome instance
4. **Per-sprint**: Manual walkthrough of all new scenarios by a human tester

### Key Testing Principles

- **Attribution accuracy is the core product claim** — test it more than anything else. Every scoring edge case (boundary at 20%, boundary at 70%, temporal ties, empty text, single-word pastes) needs a dedicated test.
- **DOM fragility is the biggest risk** — Claude.ai will change their markup. Tests should catch selector breakage quickly. Mock DOM structures should be versioned and updated when the real DOM changes.
- **Git operations must be bulletproof** — data loss in the editor is unacceptable. Every branch, merge, and commit operation needs round-trip verification.
- **Offline/disconnected states** — the editor must always work, even if the extension is broken or the Haiku API is down. Test degraded modes explicitly.

---

## Open Questions — Resolved

1. **Section granularity for branching**: **Paragraph.** A section is a paragraph-level TipTap node. No arbitrary range selection for now.

2. **Merge UX details**: **Branch picker in bottom-right corner of the section.** When a paragraph has multiple branches, a small fish-eye/lens-shaped picker appears in the bottom-right corner showing branch numbers — user selects which branch to merge from there. On the branch viewer (horizontal scroller), all branches are already visible so selection is trivial.

3. **AI pool growth**: **Deferred.** Not addressing pool eviction for now — let it grow. Will revisit if storage becomes a real problem.

4. **Multi-platform expansion**: **Claude.ai only.** No ChatGPT content script planned. Single-platform for the foreseeable future.

5. **Collaborative use**: **Single-user only.** No multi-user sync, no shared pools, no collaboration features.

---

## Sprint Milestones

| Sprint | Duration | Deliverable | Key Metric |
|--------|----------|-------------|------------|
| 1 | 2-3 weeks | Chrome extension capturing AI responses + copies from Claude.ai | AI pool populated correctly in >95% of test scenarios |
| 2 | 3-4 weeks | Working editor with RED attribution and overlay toggle | Paste detection accuracy >99%, state transitions correct |
| 3 | 3-4 weeks | YELLOW detection + branching/merging | Both scoring modes functional, branch/merge round-trips clean |
| 4 | 3-4 weeks | Timeline, analytics, polish | All 22 black-box scenarios passing, manuscript aesthetic complete |
