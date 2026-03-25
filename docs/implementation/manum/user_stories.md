# Manum User Stories

## Summary

30 user stories across 8 categories.

### Personas

| Persona | Description |
|---------|-------------|
| **Writer** | Reflective writer, essayist, or thinker who uses Claude as part of their creative process. Wants intellectual honesty about which ideas are theirs vs. AI-influenced. |
| **Researcher** | Academic researcher who uses AI to draft papers and explore ideas. Needs clear attribution for academic integrity and wants to track thinking evolution. |
| **Developer** | Developer building or maintaining Manum. Needs reliable infrastructure, testable code, and clear project structure. |

## Traceability Matrix

| US ID | Title | Feature | Task(s) | Status |
|-------|-------|---------|---------|--------|
| US-01 | Project scaffolding and dev environment | F0 | TBD | [ ] |
| US-02 | AI response capture from Claude.ai | F1 | TBD | [ ] |
| US-03 | Copy event capture from Claude.ai | F2 | TBD | [ ] |
| US-04 | Tab focus tracking | F3 | TBD | [ ] |
| US-05 | Clipboard fallback for unlinked pastes | F4 | TBD | [ ] |
| US-06 | Rich text editor for writing | F5 | TBD | [ ] |
| US-07 | Manuscript aesthetic from day one | F25 | TBD | [ ] |
| US-08 | Document auto-save and persistence | F9 | TBD | [ ] |
| US-09 | Extension-editor data synchronization | F10 | TBD | [ ] |
| US-10 | Direct paste detection (RED) | F6 | TBD | [ ] |
| US-11 | Unlinked paste fallback detection | F6 | TBD | [ ] |
| US-12 | Edit distance tracking and color transitions | F7 | TBD | [ ] |
| US-13 | Attribution overlay toggle | F8 | TBD | [ ] |
| US-14 | Temporal gating of attribution | F13 | TBD | [ ] |
| US-15 | Idea overlap detection (YELLOW) | F11 | TBD | [ ] |
| US-16 | LLM judge scoring mode | F12 | TBD | [ ] |
| US-17 | Git-based version control for documents | F14 | TBD | [ ] |
| US-18 | Branch creation from document tree | F15 | TBD | [ ] |
| US-19 | Branch creation from text selection | F15 | TBD | [ ] |
| US-20 | Branch preview for sections | F16 | TBD | [ ] |
| US-21 | Branch merging | F17 | TBD | [ ] |
| US-22 | Commit timeline visualization | F18 | TBD | [ ] |
| US-23 | LLM-generated commit summaries | F19 | TBD | [ ] |
| US-24 | Diff scrubbing through history | F20 | TBD | [ ] |
| US-25 | Behavioral analytics event capture | F21 | TBD | [ ] |
| US-26 | Analytics dashboard | F22 | TBD | [ ] |
| US-27 | Cross-project comparison | F23 | TBD | [ ] |
| US-28 | Settings and configuration | F24 | TBD | [ ] |
| US-29 | Keyboard shortcuts and navigation | F26 | TBD | [ ] |
| US-30 | First-time user onboarding | F26 | TBD | [ ] |

---

## Stories by Category

### Setup & Infrastructure (US-01)

#### US-01: Project scaffolding and dev environment

> As a **developer**, I want to have a well-structured monorepo with shared types, build tooling, and test infrastructure so I can develop the extension and editor packages efficiently.

**Acceptance Criteria:**
- [ ] Monorepo contains `packages/extension`, `packages/editor`, and `packages/shared` directories
- [ ] `packages/shared` exports TypeScript types for attribution spans, storage schemas, and event definitions
- [ ] Vite builds the editor package with React + TypeScript; output is a chrome-extension page
- [ ] Extension package builds a valid Manifest V3 extension with content script, service worker, and offscreen document entries
- [ ] Vitest runs editor tests; Jest runs extension tests; both pass with zero configuration beyond initial setup
- [ ] Pre-commit hook runs lint + unit tests and completes in under 30 seconds
- [ ] ESLint and Prettier are configured and enforced across all packages

**Feature:** F0 | **Tasks:** TBD | **Priority:** Must-have

---

### AI Capture (US-02 through US-05)

#### US-02: AI response capture from Claude.ai

> As a **writer**, I want the extension to automatically capture AI responses from my Claude.ai conversations so my editor can later identify which text originated from AI.

**Acceptance Criteria:**
- [ ] When an AI assistant message finishes streaming on claude.ai, the full response text is stored in chrome.storage.local within 2 seconds
- [ ] Each captured response includes a unique message ID, full text content, and timestamp
- [ ] Only assistant messages are captured — user messages MUST NOT appear in the AI knowledge pool
- [ ] Streaming responses are debounced: capture occurs only after the message stops growing
- [ ] DOM selectors for Claude.ai are isolated in a single module that can be updated without changing capture logic
- [ ] Captured data persists across page navigations within claude.ai

**Feature:** F1 | **Tasks:** TBD | **Priority:** Must-have

#### US-03: Copy event capture from Claude.ai

> As a **writer**, I want the extension to record when I copy text from a Claude.ai response so the editor can later match my pastes to their AI source.

**Acceptance Criteria:**
- [ ] When the user copies text on a claude.ai page, a copy record is created in chrome.storage.local
- [ ] The copy record contains the selected text, the source message ID, and a timestamp
- [ ] The copy record captures only the selected portion, not the full AI response
- [ ] Multiple copy events from the same message create separate records
- [ ] Copy records are available for paste matching by the editor within 1 second of the copy event

**Feature:** F2 | **Tasks:** TBD | **Priority:** Must-have

#### US-04: Tab focus tracking

> As a **writer**, I want my tab switches between Claude.ai and the editor to be logged so I can later see how I split my time between writing and consulting AI.

**Acceptance Criteria:**
- [ ] Tab switches are logged with timestamps when the user moves between Claude.ai, the editor, and other tabs
- [ ] Both chrome.tabs.onActivated (service worker) and document.visibilitychange (content script) events are captured
- [ ] Tab event logs distinguish between editor tab, Claude.ai tab, and other tabs
- [ ] Tab events persist in chrome.storage.local for later consumption by the analytics system

**Feature:** F3 | **Tasks:** TBD | **Priority:** Should-have

#### US-05: Clipboard fallback for unlinked pastes

> As a **writer**, I want the extension to provide clipboard access as a fallback so that pastes not matched to a copy record can still be checked against AI responses.

**Acceptance Criteria:**
- [ ] An offscreen document is created using chrome.offscreen.createDocument()
- [ ] The offscreen document can read clipboard text via navigator.clipboard.readText()
- [ ] Message passing works: service worker requests clipboard content, offscreen document returns it
- [ ] The offscreen document is created only when needed and cleaned up after use

**Feature:** F4 | **Tasks:** TBD | **Priority:** Should-have

---

### Writing & Editing (US-06 through US-08)

#### US-06: Rich text editor for writing

> As a **writer**, I want a distraction-free rich text editor that feels like writing on paper so I can focus on my ideas rather than the tool.

**Acceptance Criteria:**
- [ ] TipTap editor renders inside a chrome-extension:// page with a centered 768px max-width column
- [ ] Editor supports bold, italic, and heading formatting via toolbar buttons and keyboard shortcuts
- [ ] Document model is section-based with paragraph-level TipTap nodes as the atomic unit
- [ ] Custom TipTap marks exist for attribution spans (can store color, confidence, source metadata)
- [ ] Editor accepts paste events and exposes clipboard data for attribution processing
- [ ] Editor functions correctly as a standalone page even when no extension APIs are available

**Feature:** F5 | **Tasks:** TBD | **Priority:** Must-have

#### US-07: Manuscript aesthetic from day one

> As a **writer**, I want the editor to have a warm, handcrafted manuscript feel from the start so the tool feels intentional and literary rather than clinical.

**Acceptance Criteria:**
- [ ] Body text uses Special Elite font; metadata and timestamps use Courier Prime; handwritten elements use Caveat
- [ ] Background uses warm parchment tones (#FBF3E3, #FFF8EF) with subtle paper grain overlay at 5% opacity
- [ ] UI controls (buttons, toggles, inputs) use wired-elements for a sketchy, hand-drawn appearance
- [ ] Borders and decorative shapes use rough.js for hand-drawn rendering
- [ ] Paper texture is generated via css-doodle + feTurbulence SVG filters (no image assets)
- [ ] Cards and panels have slight rotations (-0.5deg to 1.5deg) for a handcrafted feel

**Feature:** F25 | **Tasks:** TBD | **Priority:** Must-have

#### US-08: Document auto-save and persistence

> As a **writer**, I want my documents to auto-save as I write so I never lose work, and I want to manage multiple documents from a list view.

**Acceptance Criteria:**
- [ ] Documents are stored in IndexedDB with their full content, attribution spans, and metadata
- [ ] Auto-save triggers after 2 seconds of edit inactivity (debounced)
- [ ] Rapid edits do not trigger multiple saves — only one save occurs after the debounce period
- [ ] A document list view displays all saved documents with titles and last-modified dates
- [ ] Documents can be opened, created, and deleted from the list view
- [ ] Data persists across browser restarts

**Feature:** F9 | **Tasks:** TBD | **Priority:** Must-have

---

### Attribution & Transparency (US-09 through US-16)

#### US-09: Extension-editor data synchronization

> As a **writer**, I want my AI conversation data to automatically sync from the extension to the editor so attribution works without manual steps.

**Acceptance Criteria:**
- [ ] AI knowledge pool entries sync from chrome.storage.local to editor's IndexedDB
- [ ] Copy records sync from chrome.storage.local to editor's IndexedDB
- [ ] Sync occurs via chrome.storage.onChanged for near-real-time updates (extension-page has direct access)
- [ ] A visible connection status indicator shows whether the extension data source is connected
- [ ] When extension APIs are unavailable, the editor continues to function — all new text is treated as GREEN
- [ ] Previously synced data remains available in IndexedDB even if the extension is disconnected

**Feature:** F10 | **Tasks:** TBD | **Priority:** Must-have

#### US-10: Direct paste detection (RED)

> As a **writer**, I want text I paste from Claude.ai to be automatically tagged as AI-sourced (RED) so I can see exactly which parts of my document came directly from AI.

**Acceptance Criteria:**
- [ ] When text is pasted into the editor, it is cross-referenced against copy records in IndexedDB
- [ ] If a matching copy record is found, the pasted span is tagged RED with a link to the source AI message
- [ ] The original paste content is stored in the span metadata for later edit-distance comparison
- [ ] The paste timestamp is recorded as the span's created_at
- [ ] Non-AI pastes (no matching copy record or AI pool entry) are tagged GREEN

**Feature:** F6 | **Tasks:** TBD | **Priority:** Must-have

#### US-11: Unlinked paste fallback detection

> As a **writer**, I want pastes that don't match a copy record to still be checked against AI responses so AI text pasted from other sources is still detected.

**Acceptance Criteria:**
- [ ] When no copy record matches a paste, substring matching runs against the AI knowledge pool
- [ ] If >80% of the pasted text appears verbatim in any AI pool entry, the span is tagged RED
- [ ] Unlinked matches are stored with a lower confidence score than direct copy-record matches
- [ ] The offscreen clipboard fallback is used when paste event clipboard data is insufficient
- [ ] The threshold (80%) is applied consistently across all unlinked paste checks

**Feature:** F6 | **Tasks:** TBD | **Priority:** Should-have

#### US-12: Edit distance tracking and color transitions

> As a **writer**, I want RED-tagged text to transition to YELLOW and then GREEN as I edit it so I can see my contribution growing in real time.

**Acceptance Criteria:**
- [ ] Edits within a RED-tagged span trigger Levenshtein distance recomputation against the original paste
- [ ] At 20% character-level edit distance, the span transitions from RED to YELLOW
- [ ] At 70% character-level edit distance, the span transitions from RED/YELLOW to GREEN
- [ ] Re-scoring is debounced to avoid performance degradation during rapid typing
- [ ] Only the edited span is re-scored, not the entire document
- [ ] The original paste content is preserved in metadata even after transition to GREEN

**Feature:** F7 | **Tasks:** TBD | **Priority:** Must-have

#### US-13: Attribution overlay toggle

> As a **writer**, I want to toggle an attribution overlay on and off so I can see my document's AI provenance when I want to reflect, and hide it when I want to focus on writing.

**Acceptance Criteria:**
- [ ] A "Show Attribution" toggle button is visible in the editor UI
- [ ] Attribution overlay is OFF by default
- [ ] When ON, spans are highlighted: GREEN background for original, YELLOW for AI-influenced, RED for direct paste
- [ ] YELLOW spans show a gradient intensity: darker yellow near 20% edit distance, lighter near 70%
- [ ] A summary bar displays the percentage breakdown (e.g., "72% green | 18% yellow | 10% red")
- [ ] Toggling the overlay does not modify the underlying document content
- [ ] The toggle state does not persist across sessions (always starts OFF)

**Feature:** F8 | **Tasks:** TBD | **Priority:** Must-have

#### US-14: Temporal gating of attribution

> As a **writer**, I want text I wrote before the AI said something similar to stay GREEN so I get credit for ideas that were mine first.

**Acceptance Criteria:**
- [ ] Every user text span has a created_at timestamp recorded when the text is first written
- [ ] AI pool matching only considers entries where ai_timestamp < span.created_at
- [ ] If the user typed text before the AI said something similar, the text remains GREEN regardless of similarity score
- [ ] Once text is marked YELLOW (AI said it first), it MUST NOT transition to GREEN via temporal re-evaluation
- [ ] Temporal gating applies to both edit-distance and LLM judge scoring modes

**Feature:** F13 | **Tasks:** TBD | **Priority:** Must-have

#### US-15: Idea overlap detection (YELLOW)

> As a **researcher**, I want the editor to detect when my writing paraphrases or restructures ideas that AI surfaced first so I can be transparent about intellectual influence.

**Acceptance Criteria:**
- [ ] User text is segmented into sentence-level chunks for comparison
- [ ] Each chunk is compared against temporally-gated AI pool entries using 3-5 word n-gram overlap
- [ ] Keyword and entity overlap (capitalized words, technical terms) is used as a secondary signal
- [ ] Combined overlap scores are mapped to a YELLOW intensity gradient
- [ ] Common phrases are filtered out via stopword-aware n-gram exclusion to reduce false positives
- [ ] Scoring runs automatically when new AI pool entries are synced

**Feature:** F11 | **Tasks:** TBD | **Priority:** Must-have

#### US-16: LLM judge scoring mode

> As a **researcher**, I want an optional AI-assisted scoring mode that uses Claude Haiku to catch semantic paraphrasing that simple text matching would miss.

**Acceptance Criteria:**
- [ ] A scoring mode toggle in settings switches between "Edit Distance" (default) and "LLM Judge"
- [ ] In LLM Judge mode, candidate pairs (user chunk + AI pool entry) are batched and sent to Claude Haiku via direct Anthropic API call
- [ ] Haiku returns a 0-1 similarity score and a green/yellow/red classification for each pair
- [ ] Results are cached keyed on content hashes — identical pairs are not re-sent
- [ ] If the Anthropic API is unavailable, scoring falls back to edit-distance mode with a visible notification
- [ ] API key is stored locally in browser storage (acceptable for single-user local tool)
- [ ] API calls are rate-limited to control costs

**Feature:** F12 | **Tasks:** TBD | **Priority:** Should-have

---

### Branching & Versioning (US-17 through US-21)

#### US-17: Git-based version control for documents

> As a **writer**, I want every save of my document to create a version snapshot so I can always go back to any previous state.

**Acceptance Criteria:**
- [ ] A git repository is initialized in IndexedDB via isomorphic-git + lightning-fs on first document creation
- [ ] Each auto-save creates a git commit with the document state stored as structured JSON
- [ ] Commit metadata includes timestamp, word count delta from previous commit, and attribution color snapshot
- [ ] Git log returns a chronological list of all commits for a document
- [ ] Git diff between any two commits produces correct additions and deletions

**Feature:** F14 | **Tasks:** TBD | **Priority:** Must-have

#### US-18: Branch creation from document tree

> As a **writer**, I want to create a branch of my entire document so I can explore an alternative direction without losing my current version.

**Acceptance Criteria:**
- [ ] A plus button in the side drawer creates a new branch from the current HEAD commit
- [ ] Branch names are auto-generated (e.g., "branch-1") with an option to rename
- [ ] The side drawer shows a list of all branches with the active branch highlighted
- [ ] Switching branches updates the editor to show that branch's document state
- [ ] The original branch's content is unaffected when editing on a new branch

**Feature:** F15 | **Tasks:** TBD | **Priority:** Must-have

#### US-19: Branch creation from text selection

> As a **writer**, I want to branch a specific paragraph so I can try rewriting just that section while keeping the rest of my document intact.

**Acceptance Criteria:**
- [ ] When the user selects a paragraph, a "Branch this section" action is available (context menu or floating button)
- [ ] Activating the action creates a new branch containing the full document state at that point
- [ ] The branched section in the original document is marked with L-shaped indicators on both sides
- [ ] Branching is limited to paragraph-level TipTap nodes (no arbitrary text range selection)
- [ ] The user can edit the branched section independently on the new branch

**Feature:** F15 | **Tasks:** TBD | **Priority:** Must-have

#### US-20: Branch preview for sections

> As a **writer**, I want to preview how a section reads on different branches so I can compare alternatives before deciding which to keep.

**Acceptance Criteria:**
- [ ] Branched sections display a horizontal scroller at the bottom
- [ ] Each tab in the scroller corresponds to a branch that modifies that section
- [ ] Clicking a tab shows a read-only preview of the section content on that branch
- [ ] The active branch tab is highlighted with accent color (#4A5E8A)
- [ ] Previewing does not change the current branch or document state

**Feature:** F16 | **Tasks:** TBD | **Priority:** Should-have

#### US-21: Branch merging

> As a **writer**, I want to merge a branch back into my main document so I can incorporate the best version of a section.

**Acceptance Criteria:**
- [ ] Double-clicking a branch number (or using the branch picker) initiates a merge
- [ ] Non-conflicting changes are auto-merged and a merge commit is created
- [ ] Conflicting changes (overlapping edits in the same section) display a conflict UI with both versions
- [ ] The conflict UI provides accept/reject controls per conflicting section
- [ ] After resolving all conflicts, a merge commit is created
- [ ] The merged branch can be deleted after successful merge

**Feature:** F17 | **Tasks:** TBD | **Priority:** Must-have

---

### History & Visualization (US-22 through US-24)

#### US-22: Commit timeline visualization

> As a **writer**, I want to see a visual timeline of my document's history in a side drawer so I can understand how my writing evolved over time.

**Acceptance Criteria:**
- [ ] A side drawer ("The Paper Drawer") opens to show a vertical commit timeline
- [ ] Each timeline entry displays timestamp, title, summary, and branch indicator
- [ ] The active commit is highlighted with accent color (#4A5E8A) and glow effect
- [ ] Timeline entries are connected by hand-drawn SVG connector lines (perfect-freehand)
- [ ] Clicking a timeline entry navigates the editor to that commit's document state
- [ ] The timeline updates in real-time as new commits are created

**Feature:** F18 | **Tasks:** TBD | **Priority:** Must-have

#### US-23: LLM-generated commit summaries

> As a **writer**, I want each version of my document to have a meaningful title and summary so I can quickly find the version I'm looking for.

**Acceptance Criteria:**
- [ ] On each commit, the diff is sent to Claude Haiku to generate a short title and 1-sentence summary
- [ ] The generated metadata includes a conceptual description of what changed (not just "added 50 words")
- [ ] Metadata is stored alongside the commit and displayed in the timeline
- [ ] If the Haiku API is unavailable, a fallback title is auto-generated from word count delta + timestamp
- [ ] Previously generated metadata is not re-fetched on subsequent views

**Feature:** F19 | **Tasks:** TBD | **Priority:** Should-have

#### US-24: Diff scrubbing through history

> As a **researcher**, I want to scrub through my document's history and see what changed between versions so I can trace the evolution of my arguments.

**Acceptance Criteria:**
- [ ] A scrub slider or timeline click allows viewing any commit's document state
- [ ] Additions (text in current commit but not previous) are highlighted green
- [ ] Deletions (text in previous commit but not current) are highlighted red
- [ ] Diff highlighting uses the editor's own styling and manuscript aesthetic
- [ ] Navigation between commits is smooth without full page reloads

**Feature:** F20 | **Tasks:** TBD | **Priority:** Should-have

---

### Analytics & Insights (US-25 through US-27)

#### US-25: Behavioral analytics event capture

> As a **writer**, I want my writing behavior to be silently tracked so the analytics dashboard can show me meaningful patterns about my process.

**Acceptance Criteria:**
- [ ] An event bus captures: edit events, paste events, deletions, scroll-away-from-cursor, active time, tab switches, AI usage, branch creation, and branch sizes
- [ ] Events are aggregated into per-document per-session summaries
- [ ] Session summaries are stored in IndexedDB
- [ ] Event capture does not noticeably impact editor performance (no visible lag or frame drops)
- [ ] Events include timestamps for timeline reconstruction

**Feature:** F21 | **Tasks:** TBD | **Priority:** Should-have

#### US-26: Analytics dashboard

> As a **writer**, I want a dashboard that shows me how I write — my AI dependency, my editing patterns, and my use of branches — so I can reflect on my creative process.

**Acceptance Criteria:**
- [ ] An attribution summary ratio bar shows green/yellow/red percentages with colored segments
- [ ] A session timeline visualizes writing (blue) vs. AI consultation (orange) vs. idle (gray) periods
- [ ] Editing pattern charts show words written/deleted per session and paste frequency
- [ ] Branch statistics show number of branches created and average branch size
- [ ] Charts use hand-drawn style via chart.xkcd + react-rough-fiber
- [ ] Dashboard is accessible from the bottom nav bar (Insights mode)

**Feature:** F22 | **Tasks:** TBD | **Priority:** Should-have

#### US-27: Cross-project comparison

> As a **researcher**, I want to compare my AI dependency across different documents and over time so I can track whether I'm becoming more or less reliant on AI.

**Acceptance Criteria:**
- [ ] A document list view shows per-document attribution ratios (green/yellow/red percentages)
- [ ] A trend chart shows how green/yellow/red ratios change over time across all documents
- [ ] The visualization supports answering "Am I becoming more or less dependent on AI?"
- [ ] Charts use the hand-drawn chart.xkcd aesthetic consistent with the rest of the UI

**Feature:** F23 | **Tasks:** TBD | **Priority:** Could-have

---

### Data Management (US-28)

#### US-28: Settings and configuration

> As a **writer**, I want a settings panel where I can configure scoring mode, check extension connectivity, manage storage, and export my data.

**Acceptance Criteria:**
- [ ] Scoring mode toggle switches between Edit Distance (default) and LLM Judge
- [ ] Connected AI platforms section shows Claude.ai connection status (connected/disconnected)
- [ ] An input field accepts the Anthropic API key for LLM judge mode (stored locally)
- [ ] Storage usage is displayed with a cleanup action to free space
- [ ] Data export produces a JSON file containing documents, attribution data, and analytics
- [ ] Settings persist across sessions in IndexedDB

**Feature:** F24 | **Tasks:** TBD | **Priority:** Should-have

---

### Navigation & Onboarding (US-29 through US-30)

#### US-29: Keyboard shortcuts and navigation

> As a **writer**, I want keyboard shortcuts for common actions and a clear navigation system so I can work efficiently without reaching for the mouse.

**Acceptance Criteria:**
- [ ] Bottom nav bar provides Write, Branch, and Insights mode switching
- [ ] Bottom nav bar has blur backdrop consistent with manuscript aesthetic
- [ ] Keyboard shortcuts exist for: toggle attribution overlay, create branch, open/close side drawer, save, switch modes
- [ ] Side drawer opens and closes with smooth animation
- [ ] All navigation transitions maintain document scroll position and cursor state

**Feature:** F26 | **Tasks:** TBD | **Priority:** Should-have

#### US-30: First-time user onboarding

> As a **writer** new to Manum, I want a guided introduction that explains what the tool does and how attribution works so I can start using it effectively without reading documentation.

**Acceptance Criteria:**
- [ ] First launch triggers an onboarding flow that explains: what Manum does, how attribution colors work, how branching works
- [ ] Onboarding uses the manuscript aesthetic (hand-drawn elements, warm tones)
- [ ] The onboarding flow can be skipped and accessed again from settings
- [ ] After onboarding, the user lands in the editor with a new empty document
- [ ] The onboarding flow covers extension installation/connection status

**Feature:** F26 | **Tasks:** TBD | **Priority:** Could-have
