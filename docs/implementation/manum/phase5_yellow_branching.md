# Phase 5: YELLOW Attribution & Git Branching

## Prerequisites

- Phase 4 complete: RED attribution works (paste detection, edit tracking, overlay, summary bar)
- Levenshtein distance computation available (T094)
- Attribution mark system functional (T063, T092)
- IndexedDB persistence layer operational (T068)
- Extension-editor sync working (T071)

## Infrastructure Updates Required

### IU-2: Export Edit Tracker Scoring Interface

**File:** `packages/editor/src/attribution/edit-tracker.ts`

The YELLOW scoring system needs to set attribution marks using the same interface as the RED edit tracker. Extract the mark-updating logic into a shared function.

```typescript
// Extract from edit-tracker.ts:
export function updateAttributionMark(
  editor: Editor,
  from: number,
  to: number,
  attrs: Partial<AttributionMarkAttrs>
): void {
  editor.chain().setTextSelection({ from, to }).updateAttributes('attribution', attrs).run();
}
```

**Tests:** Existing edit tracker tests should still pass after extraction.

### IU-3: Add Scoring Mode to Attribution Mark

**File:** `packages/editor/src/editor/marks/attribution.ts`

The attribution mark needs a `matchedAiEntries` attribute array for YELLOW matches and an `ideaOverlapScore` for the n-gram/LLM combined score.

```typescript
// Add to mark attributes:
matchedAiEntries: { default: null },   // Array of { aiMessageId, overlapScore, method, aiTimestamp }
ideaOverlapScore: { default: null },    // 0-1 combined overlap score
```

**Tests:** Verify new attributes persist in JSON round-trip.

## Phase Goal

User text is checked for idea overlap with AI responses (YELLOW attribution), temporal gating ensures fairness, an optional LLM judge provides semantic scoring, and documents support git-based branching with preview and merge capabilities.

## Phase Evaluation Criteria

- User types text similar to an AI response (AI first) → text flagged YELLOW with overlap score
- User types text before AI says something similar → text stays GREEN (temporal gating)
- YELLOW text from idea overlap does NOT transition to GREEN (permanent overlap)
- LLM judge mode toggle: switching to LLM mode re-scores and provides semantic similarity results
- LLM judge fallback: disable API → verify edit-distance mode activates with notification
- Git repo initialized in IndexedDB on first document save
- Auto-save creates a git commit with correct metadata
- Branch creation: create branch → verify it appears in branch list
- Branch switching: switch branches → editor shows correct document state
- Selection branching: highlight paragraph → branch it → L-shaped markers appear
- Branch preview: scroller shows tabs for branches modifying a section
- Branch merge: non-conflicting merge succeeds; conflicting merge shows conflict UI
- `pnpm --filter editor test` passes all Phase 5 tests
- All quality gates green (lint, types, tests)

---

## Tasks

### T120: Implement Temporal Gating — Timestamp Tracking

**PRD Reference:** Sprint 3, Task 3 (Temporal gating); Attribution Model — Temporal Gating Rule
**Depends on:** Nothing
**Blocks:** T121
**User Stories:** US-14
**Estimated scope:** 30 min

#### Description

Ensure every user text span has a `created_at` timestamp recording when the text was first written. This timestamp is the basis for temporal gating — determining who had the idea first.

#### Acceptance Criteria

- [ ] When the user types new text, a `created_at` timestamp is recorded on the text span
- [ ] The timestamp is stored in the `attribution` mark's `createdAt` attribute
- [ ] Timestamps are set once and never updated (first-write time is permanent)
- [ ] Pasted text uses the paste event timestamp (already handled in T092)
- [ ] Test: type text → verify `createdAt` is set and doesn't change on subsequent edits

#### Files to Create/Modify

- `packages/editor/src/attribution/timestamp-tracker.ts` — (create) Track created_at for new text
- `packages/editor/src/__tests__/timestamp-tracker.test.ts` — (create) Timestamp tests

#### Implementation Notes

Use TipTap's `onTransaction` to detect new text insertions. When text is inserted without an existing `attribution` mark, apply a mark with `color: 'green'` and `createdAt: Date.now()`. This ensures all text has a timestamp for temporal comparison. Be careful not to override `createdAt` on existing marked text during edits.

#### Evaluation Checklist

- [ ] New typed text receives a `createdAt` timestamp
- [ ] Timestamp persists and doesn't change on edit

---

### T121: Implement Temporal Gating — AI Pool Query Filtering

**PRD Reference:** Sprint 3, Task 3 (AI pool query filtered by timestamp)
**Depends on:** T120
**Blocks:** T123
**User Stories:** US-14
**Estimated scope:** 30 min

#### Description

Filter AI pool queries so that only entries with `ai_timestamp < span.created_at` are considered matches. This ensures users get credit for ideas they had first.

#### Acceptance Criteria

- [ ] AI pool query function accepts a `beforeTimestamp` parameter
- [ ] Only AI entries with `timestamp < beforeTimestamp` are returned
- [ ] User text written before AI says something similar stays GREEN
- [ ] Test: AI entry at T=100, user text at T=50 → no match (user was first)
- [ ] Test: AI entry at T=50, user text at T=100 → match (AI was first)

#### Files to Create/Modify

- `packages/editor/src/attribution/temporal-gate.ts` — (create) Temporal filtering logic
- `packages/editor/src/__tests__/temporal-gate.test.ts` — (create) Temporal gating tests

#### Implementation Notes

Query IndexedDB AI pool store with an index on `timestamp`. Filter: `entry.timestamp < span.createdAt`. Return only entries that predate the user's text. This function will be used by both the n-gram matcher (T124) and the LLM judge (T127).

#### Evaluation Checklist

- [ ] Temporal filtering tests pass for all cases
- [ ] Entries after user text are excluded

---

### T122: Implement Text Segmentation into Sentence-Level Chunks

**PRD Reference:** Sprint 3, Task 1 (Segment user text into chunks)
**Depends on:** Nothing
**Blocks:** T123, T124
**User Stories:** US-15
**Estimated scope:** 30 min

#### Description

Implement text segmentation that breaks document text into sentence-level chunks for n-gram comparison against the AI pool.

#### Acceptance Criteria

- [ ] Function: `segmentText(text: string): Chunk[]` splits text into sentences
- [ ] Each chunk includes: `text`, `startOffset`, `endOffset` (positions in original text)
- [ ] Handles common sentence boundaries (. ! ? followed by space/newline)
- [ ] Handles abbreviations (Mr., Dr., etc.) without false splits
- [ ] Test with multi-sentence text verifies correct segmentation

#### Files to Create/Modify

- `packages/editor/src/attribution/segmenter.ts` — (create) Text segmentation logic
- `packages/editor/src/__tests__/segmenter.test.ts` — (create) Segmentation tests

#### Implementation Notes

Use a regex-based approach: split on `(?<=[.!?])\s+(?=[A-Z])` as a starting point. Handle abbreviations with a simple exception list (Mr., Mrs., Dr., etc.). Don't over-engineer — this is prose text, not code. Each chunk: `{ text: string, startOffset: number, endOffset: number }`.

#### Evaluation Checklist

- [ ] Segmentation tests pass with multi-sentence paragraphs
- [ ] Abbreviations don't cause false splits

---

### T123: Implement N-Gram Extraction and Overlap Scoring

**PRD Reference:** Sprint 3, Task 1 (3-5 word n-gram overlap scoring)
**Depends on:** T121, T122
**Blocks:** T125
**User Stories:** US-15
**Estimated scope:** 1 hour

#### Description

Extract 3-5 word n-grams from user text chunks and AI pool entries, then compute overlap scores. This is the core YELLOW attribution detection mechanism.

#### Acceptance Criteria

- [ ] Function extracts n-grams (3, 4, and 5-word windows) from a text string
- [ ] Stopwords are filtered from n-grams to reduce false positives on common phrases
- [ ] Overlap score computed: `|intersection| / |user_ngrams|` for each user chunk vs. AI entry
- [ ] Temporal gating applied: only AI entries that predate the user chunk are compared
- [ ] Score ranges from 0.0 (no overlap) to 1.0 (complete overlap)
- [ ] Test with known overlapping texts verifies correct score

#### Files to Create/Modify

- `packages/editor/src/attribution/ngram.ts` — (create) N-gram extraction and overlap scoring
- `packages/editor/src/attribution/stopwords.ts` — (create) Stopword list for filtering
- `packages/editor/src/__tests__/ngram.test.ts` — (create) N-gram and overlap tests

#### Implementation Notes

N-gram extraction:
```typescript
function extractNgrams(text: string, n: number): Set<string> {
  const words = text.toLowerCase().split(/\s+/).filter(w => !stopwords.has(w));
  const ngrams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}
```
Compute overlap for n=3, n=4, n=5 and take a weighted average (higher n-grams are stronger signals). Stopword list: common English words (the, a, an, is, are, was, were, etc.).

#### Evaluation Checklist

- [ ] N-gram extraction tests pass
- [ ] Overlap score correctly identifies similar text

---

### T124: Implement Keyword/Entity Overlap Detection [P]

**PRD Reference:** Sprint 3, Task 1 (Keyword/entity overlap as secondary signal)
**Depends on:** T122
**Blocks:** T125
**User Stories:** US-15
**Estimated scope:** 30 min

#### Description

Implement keyword and entity overlap detection as a secondary signal for YELLOW attribution. Identify capitalized words, technical terms, and proper nouns shared between user text and AI responses.

#### Acceptance Criteria

- [ ] Function extracts keywords/entities from text (capitalized words, technical terms)
- [ ] Overlap score: `|shared_keywords| / |user_keywords|`
- [ ] Common capitalized words at sentence starts are filtered out
- [ ] Technical terms identified by simple heuristics (camelCase, contains digits, hyphenated compounds)
- [ ] Test with texts sharing specific terms verifies keyword overlap detection

#### Files to Create/Modify

- `packages/editor/src/attribution/keywords.ts` — (create) Keyword/entity extraction and overlap
- `packages/editor/src/__tests__/keywords.test.ts` — (create) Keyword tests

#### Implementation Notes

Extract keywords: words that are capitalized (not at sentence start), contain digits, are camelCase, or are hyphenated. These are more meaningful than common words. Overlap: set intersection of user keywords and AI entry keywords, normalized by user keyword count. This is a lighter signal than n-grams — used as a secondary boost.

#### Evaluation Checklist

- [ ] Keyword extraction identifies proper nouns and technical terms
- [ ] Overlap scoring works for shared terminology

---

### T125: Implement Combined Score to Yellow Intensity Mapping

**PRD Reference:** Sprint 3, Task 1 (Map score to yellow intensity)
**Depends on:** T123, T124
**Blocks:** T126, T127
**User Stories:** US-15
**Estimated scope:** 30 min

#### Description

Combine n-gram overlap and keyword overlap scores into a single idea overlap score, then map it to YELLOW attribution with intensity gradient. Apply the result to user text spans.

#### Acceptance Criteria

- [ ] Combined score: weighted average of n-gram score (0.7 weight) and keyword score (0.3 weight)
- [ ] Score threshold for YELLOW: combined score > 0.3 triggers YELLOW attribution
- [ ] Score maps to yellow intensity: higher score = darker yellow
- [ ] YELLOW spans from idea overlap are marked with `scoringMode: 'edit-distance'`
- [ ] YELLOW from idea overlap does NOT allow transition to GREEN (permanent)
- [ ] Scoring runs automatically on document content
- [ ] Test: known overlapping text → correct combined score and YELLOW attribution

#### Files to Create/Modify

- `packages/editor/src/attribution/yellow-scorer.ts` — (create) Combined scoring and YELLOW application
- `packages/editor/src/__tests__/yellow-scorer.test.ts` — (create) Combined scoring tests

#### Implementation Notes

The scoring pipeline for each user text chunk:
1. Get temporal-gated AI entries (T121)
2. Compute n-gram overlap against each entry (T123)
3. Compute keyword overlap against each entry (T124)
4. Take the max combined score across all AI entries
5. If score > 0.3, apply YELLOW mark with `ideaOverlapScore` attribute

Important: YELLOW from idea overlap has `ideaOverlapScore` set. This distinguishes it from YELLOW from edit-distance transitions (which has `editDistance` set). The transition blocker in T096 should check: if `ideaOverlapScore` is set, NEVER transition to GREEN.

#### Evaluation Checklist

- [ ] Combined scoring test passes
- [ ] YELLOW applied at correct threshold
- [ ] YELLOW→GREEN transition blocked for idea overlap YELLOW

---

### T126: Implement Automatic YELLOW Scoring on Sync [P]

**PRD Reference:** Sprint 3, Task 1 (scoring runs automatically when new AI pool entries are synced)
**Depends on:** T125
**Blocks:** Nothing
**User Stories:** US-15
**Estimated scope:** 30 min

#### Description

Trigger YELLOW scoring automatically when new AI pool entries are synced from the extension and on document load. This ensures idea overlap is detected even after the user writes and then consults AI.

#### Acceptance Criteria

- [ ] When new AI pool entries are synced, re-score all user text chunks against the updated pool
- [ ] On document open, score all unscored chunks against the full pool
- [ ] Re-scoring is debounced (5 seconds after last sync event) to batch multiple entries
- [ ] Only unscored or affected chunks are re-evaluated (not the full document each time)
- [ ] Test: add AI pool entry → verify affected user text is re-scored

#### Files to Create/Modify

- `packages/editor/src/attribution/auto-scorer.ts` — (create) Automatic scoring trigger
- `packages/editor/src/hooks/useAutoScoring.ts` — (create) React hook for scoring lifecycle
- `packages/editor/src/__tests__/auto-scorer.test.ts` — (create) Auto-scoring tests

#### Implementation Notes

Listen to the sync module's events (or poll IndexedDB) for new AI pool entries. On new entries, identify which user text chunks could potentially match (rough filter: chunks created after the AI entry's timestamp would not match due to temporal gating — only chunks BEFORE the AI entry need rescoring). Debounce with 5-second window to avoid thrashing during bulk sync.

#### Evaluation Checklist

- [ ] Auto-scoring triggers on new AI pool entries
- [ ] Only relevant chunks are re-scored

---

### T127: Implement LLM Judge — Anthropic API Integration

**PRD Reference:** Sprint 3, Task 2 (LLM judge mode — Haiku)
**Depends on:** T125
**Blocks:** T128
**User Stories:** US-16
**Estimated scope:** 1 hour

#### Description

Implement the Anthropic API client for calling Claude Haiku to evaluate semantic similarity between user text and AI pool entries.

#### Acceptance Criteria

- [ ] API client sends requests to the Anthropic Messages API
- [ ] API key is read from local browser storage (configured in settings)
- [ ] Request format: sends user chunk + AI entry text with a similarity evaluation prompt
- [ ] Response parsing: extracts similarity score (0-1) and classification (green/yellow/red)
- [ ] Rate limiting: max 10 requests per minute
- [ ] Test with mock API verifies request format and response parsing

#### Files to Create/Modify

- `packages/editor/src/attribution/llm-judge/api-client.ts` — (create) Anthropic API client
- `packages/editor/src/attribution/llm-judge/prompt.ts` — (create) Evaluation prompt template
- `packages/editor/src/__tests__/llm-judge-api.test.ts` — (create) API client tests with mock fetch

#### Implementation Notes

Use `fetch()` directly (no SDK needed for simple Messages API calls). Prompt:
```
You are evaluating text similarity. Given a user-written text and an AI-generated text, rate their similarity from 0 to 1 and classify as green (independent), yellow (AI-influenced), or red (near-identical).

User text: "{user_chunk}"
AI text: "{ai_entry}"

Respond with JSON: { "score": 0.X, "classification": "green|yellow|red", "reasoning": "brief explanation" }
```

Use `claude-haiku-4-5-20251001` model. Rate limit with a simple token bucket (10 tokens, 1 token per 6 seconds).

#### Evaluation Checklist

- [ ] API client tests pass with mock responses
- [ ] Rate limiter restricts to 10 req/min

---

### T128: Implement LLM Judge — Batch Processing and Caching

**PRD Reference:** Sprint 3, Task 2 (Batch candidates, cache results)
**Depends on:** T127
**Blocks:** T129
**User Stories:** US-16
**Estimated scope:** 1 hour

#### Description

Implement batch processing of candidate pairs (user chunk + AI entry) and result caching to avoid redundant API calls.

#### Acceptance Criteria

- [ ] Candidate pairs are batched before sending to the API
- [ ] Results are cached keyed on content hashes (SHA-256 of user text + AI text)
- [ ] Cached results are returned immediately without API calls
- [ ] Cache is stored in IndexedDB for persistence across sessions
- [ ] Batch size is configurable (default: 5 pairs per API call)
- [ ] Test: same pair sent twice → only one API call made

#### Files to Create/Modify

- `packages/editor/src/attribution/llm-judge/batcher.ts` — (create) Batch processing logic
- `packages/editor/src/attribution/llm-judge/cache.ts` — (create) Result cache with content hashing
- `packages/editor/src/__tests__/llm-judge-cache.test.ts` — (create) Caching tests

#### Implementation Notes

Content hash: `await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userText + '|' + aiText))`. Convert to hex string for the cache key. Store cache in a dedicated IndexedDB object store (`llm_judge_cache`). For batching, accumulate pairs in a queue and flush when the batch size is reached or after a timeout.

#### Evaluation Checklist

- [ ] Cache prevents duplicate API calls
- [ ] Batching accumulates pairs correctly

---

### T129: Implement LLM Judge — Fallback to Edit-Distance Mode

**PRD Reference:** Sprint 3, Task 2 (Graceful fallback on API failure)
**Depends on:** T128
**Blocks:** Nothing
**User Stories:** US-16
**Estimated scope:** 30 min

#### Description

When the Anthropic API is unavailable (network error, invalid key, rate limited), automatically fall back to edit-distance scoring mode with a visible notification.

#### Acceptance Criteria

- [ ] On API failure, scoring automatically switches to edit-distance mode
- [ ] A visible notification informs the user that LLM scoring is unavailable
- [ ] Fallback is per-session (next session will try LLM again if configured)
- [ ] API errors are logged but don't crash the editor
- [ ] Test: mock API failure → verify fallback activates and notification shown

#### Files to Create/Modify

- `packages/editor/src/attribution/llm-judge/fallback.ts` — (create) Fallback logic
- `packages/editor/src/components/Notifications.tsx` — (create) Notification component
- `packages/editor/src/__tests__/llm-judge-fallback.test.ts` — (create) Fallback tests

#### Implementation Notes

Wrap API calls in try/catch. On failure: (1) set a session flag `llmJudgeAvailable = false`, (2) dispatch a notification event, (3) re-score using the existing edit-distance + n-gram pipeline. The notification can be a simple toast that auto-dismisses after 5 seconds. Use wired-elements for the toast styling.

#### Evaluation Checklist

- [ ] Fallback test passes: API error → edit-distance mode used
- [ ] Notification displayed on fallback

---

### T130: Initialize isomorphic-git Repository in IndexedDB

**PRD Reference:** Sprint 3, Task 4 (Git integration with isomorphic-git)
**Depends on:** Nothing
**Blocks:** T131, T133
**User Stories:** US-17
**Estimated scope:** 1 hour

#### Description

Set up isomorphic-git with lightning-fs backed by IndexedDB. Initialize a git repository for document version control.

#### Acceptance Criteria

- [ ] `isomorphic-git` and `@nicolo-ribaudo/lightning-fs` (or `lightning-fs`) packages installed
- [ ] lightning-fs filesystem initialized with IndexedDB backend
- [ ] Git repository initialized via `git.init({ fs, dir })` on first document creation
- [ ] Repository persists in IndexedDB across browser restarts
- [ ] Test: init repo → verify `.git` directory exists in the virtual filesystem

#### Files to Create/Modify

- `packages/editor/src/git/fs.ts` — (create) lightning-fs filesystem setup
- `packages/editor/src/git/repo.ts` — (create) Repository initialization and management
- `packages/editor/package.json` — (modify) Add isomorphic-git and lightning-fs dependencies
- `packages/editor/src/__tests__/git-repo.test.ts` — (create) Repository tests

#### Implementation Notes

```typescript
import git from 'isomorphic-git';
import LightningFS from '@nicolo-ribaudo/lightning-fs';

const fs = new LightningFS('manum-git');
const dir = '/documents';

async function initRepo() {
  await git.init({ fs, dir });
}
```
Each document can be a separate directory or a single file within the repo. Simpler approach: one repo with one file per document (e.g., `/documents/{docId}.json`).

#### Evaluation Checklist

- [ ] Repository initializes without errors
- [ ] Repo persists across page reloads

---

### T131: Implement Auto-Commit on Save

**PRD Reference:** Sprint 3, Task 4 (Auto-commit on save)
**Depends on:** T130
**Blocks:** T132, T133
**User Stories:** US-17
**Estimated scope:** 1 hour

#### Description

Create a git commit each time the document auto-saves. The commit stores the document state as structured JSON.

#### Acceptance Criteria

- [ ] On each auto-save, the document JSON is written to the git filesystem
- [ ] A git commit is created with the updated file
- [ ] Commit message includes timestamp and basic metadata
- [ ] Commits are created only when content has actually changed
- [ ] Test: save document → verify commit exists in git log

#### Files to Create/Modify

- `packages/editor/src/git/commit.ts` — (create) Auto-commit logic
- `packages/editor/src/hooks/useAutoSave.ts` — (modify) Trigger git commit after IndexedDB save
- `packages/editor/src/__tests__/git-commit.test.ts` — (create) Commit tests

#### Implementation Notes

```typescript
async function commitDocument(docId: string, content: JSONContent) {
  const filePath = `/${docId}.json`;
  await fs.promises.writeFile(dir + filePath, JSON.stringify(content));
  await git.add({ fs, dir, filepath: filePath });
  await git.commit({
    fs, dir,
    message: `Auto-save: ${new Date().toISOString()}`,
    author: { name: 'Manum', email: 'manum@local' },
  });
}
```
Check for changes before committing: compare the file content with the last committed version to avoid empty commits.

#### Evaluation Checklist

- [ ] Auto-commit creates a commit on save
- [ ] No empty commits when content hasn't changed

---

### T132: Implement Commit Metadata

**PRD Reference:** Sprint 3, Task 4 (Commit metadata: timestamp, word count delta, attribution snapshot)
**Depends on:** T131
**Blocks:** Nothing
**User Stories:** US-17
**Estimated scope:** 30 min

#### Description

Store rich metadata with each commit: timestamp, word count delta from previous commit, and attribution color snapshot (percentages).

#### Acceptance Criteria

- [ ] Each commit message includes structured metadata (JSON in commit message or git notes)
- [ ] Metadata includes: `timestamp`, `wordCount`, `wordCountDelta`, `attributionSnapshot` (green/yellow/red percentages)
- [ ] Word count delta computed by comparing with previous commit
- [ ] Attribution snapshot uses the calculator from T100
- [ ] Test: commits with known content → verify correct metadata

#### Files to Create/Modify

- `packages/editor/src/git/metadata.ts` — (create) Commit metadata computation
- `packages/editor/src/git/commit.ts` — (modify) Include metadata in commits
- `packages/editor/src/__tests__/git-metadata.test.ts` — (create) Metadata tests

#### Implementation Notes

Store metadata as JSON in the commit message body (after the first line):
```
Auto-save: 2026-03-25T10:30:00Z

{"wordCount":450,"wordCountDelta":23,"attribution":{"green":72,"yellow":18,"red":10}}
```
Parse metadata from commit messages when reading the log. Use the `computeAttributionRatios()` function from T100.

#### Evaluation Checklist

- [ ] Metadata included in commit messages
- [ ] Word count delta computed correctly

---

### T133: Implement Git Log and Diff Operations

**PRD Reference:** Sprint 3, Task 4 (Git operations: commit, log, diff)
**Depends on:** T130, T131
**Blocks:** T134
**User Stories:** US-17
**Estimated scope:** 1 hour

#### Description

Implement git log (list commits) and git diff (compare two commits) operations using isomorphic-git.

#### Acceptance Criteria

- [ ] `getCommitLog(docId)` returns chronological list of commits with metadata
- [ ] `getCommitDiff(docId, commitA, commitB)` returns additions and deletions
- [ ] Log includes: commit hash, message, timestamp, parsed metadata
- [ ] Diff produces structured output (added lines, removed lines)
- [ ] Test: create multiple commits → verify log and diff

#### Files to Create/Modify

- `packages/editor/src/git/log.ts` — (create) Git log operations
- `packages/editor/src/git/diff.ts` — (create) Git diff operations
- `packages/editor/src/__tests__/git-operations.test.ts` — (create) Log and diff tests

#### Implementation Notes

```typescript
const log = await git.log({ fs, dir, depth: 100 });
// Parse metadata from commit messages
```
For diff: read the file at both commit SHAs, then compute a text diff. isomorphic-git doesn't provide a built-in text diff — use a simple line-by-line diff algorithm or `diff` npm package.

#### Evaluation Checklist

- [ ] Log returns commits in chronological order
- [ ] Diff correctly identifies additions and deletions

---

### T134: Implement Branch Creation from Tree

**PRD Reference:** Sprint 3, Task 5 (Branch creation from tree)
**Depends on:** T133
**Blocks:** T135, T138, T139
**User Stories:** US-18
**Estimated scope:** 1 hour

#### Description

Implement branch creation via a "+" button in the side drawer. Creates a new git branch from the current HEAD.

#### Acceptance Criteria

- [ ] "+" button in the side drawer creates a new branch from current HEAD
- [ ] Branch name auto-generated (e.g., "branch-1", "branch-2") with option to rename
- [ ] `git.branch()` creates the branch in the isomorphic-git repo
- [ ] New branch appears in the branch list immediately
- [ ] Creating a branch does not switch to it automatically
- [ ] Test: create branch → verify it exists in git refs

#### Files to Create/Modify

- `packages/editor/src/git/branches.ts` — (create) Branch CRUD operations
- `packages/editor/src/components/BranchDrawer.tsx` — (create) Side drawer branch list with "+" button
- `packages/editor/src/__tests__/git-branches.test.ts` — (create) Branch creation tests

#### Implementation Notes

```typescript
async function createBranch(name: string) {
  await git.branch({ fs, dir, ref: name });
}
async function listBranches() {
  return await git.listBranches({ fs, dir });
}
```
Auto-name: check existing branches, increment counter. The side drawer is a panel that slides in from the right (320px width per PRD).

#### Evaluation Checklist

- [ ] Branch creation test passes
- [ ] Branch appears in list after creation

---

### T135: Implement Branch List UI and Branch Switching

**PRD Reference:** Sprint 3, Tasks 5-6 (Branch list, switching)
**Depends on:** T134
**Blocks:** T136, T137
**User Stories:** US-18
**Estimated scope:** 1 hour

#### Description

Create the branch list UI in the side drawer with active branch highlighting. Implement branch switching (checkout) that updates the editor to show the selected branch's document state.

#### Acceptance Criteria

- [ ] Branch list shows all branches with the active branch highlighted
- [ ] Active branch uses accent color (#4A5E8A) highlight
- [ ] Clicking a branch switches to it (git checkout)
- [ ] Editor content updates to show the selected branch's document state
- [ ] Branch rename is available via double-click or edit button
- [ ] Test: switch branches → verify editor shows correct content

#### Files to Create/Modify

- `packages/editor/src/components/BranchDrawer.tsx` — (modify) Add branch list and switching
- `packages/editor/src/git/branches.ts` — (modify) Add checkout and rename operations
- `packages/editor/src/__tests__/branch-switching.test.ts` — (create) Branch switching tests

#### Implementation Notes

```typescript
async function checkout(branchName: string) {
  await git.checkout({ fs, dir, ref: branchName });
  const content = await fs.promises.readFile(dir + `/${docId}.json`, 'utf8');
  return JSON.parse(content);
}
```
After checkout, reload the editor content with `editor.commands.setContent(content)`. Save the current branch state before switching.

#### Evaluation Checklist

- [ ] Branch switching loads correct document content
- [ ] Active branch is visually highlighted

---

### T136: Implement Selection-Based Branch Creation

**PRD Reference:** Sprint 3, Task 6 (Branch from selection)
**Depends on:** T135
**Blocks:** T137
**User Stories:** US-19
**Estimated scope:** 1 hour

#### Description

Allow users to highlight a paragraph and create a branch specifically for that section. The branched section is marked with L-shaped indicators.

#### Acceptance Criteria

- [ ] When a paragraph is selected, a "Branch this section" action appears (floating button or context menu)
- [ ] Action creates a new branch from the current HEAD
- [ ] The branched section is identified by its paragraph index in the document
- [ ] Section metadata is stored with the branch (which paragraph was branched)
- [ ] Test: select paragraph → branch it → verify branch created with section metadata

#### Files to Create/Modify

- `packages/editor/src/components/BranchAction.tsx` — (create) Floating "Branch this section" button
- `packages/editor/src/git/section-branch.ts` — (create) Section-level branch logic
- `packages/editor/src/__tests__/section-branch.test.ts` — (create) Section branching tests

#### Implementation Notes

Detect paragraph selection using TipTap's `editor.state.selection`. Check if the selection covers a complete paragraph node. When branching, store the paragraph's position (node index) as branch metadata. The branch is still a full document branch (git doesn't support partial-file branches), but the UI tracks which section was the focus.

#### Evaluation Checklist

- [ ] Section branching creates a branch with section metadata
- [ ] Only paragraph-level selections trigger the action

---

### T137: Implement L-Shaped Branch Markers in Editor

**PRD Reference:** Sprint 3, Task 6 (L-shaped markers on branched sections)
**Depends on:** T136
**Blocks:** Nothing
**User Stories:** US-19
**Estimated scope:** 30 min

#### Description

Render L-shaped visual indicators on both sides of branched sections in the editor. These markers show which paragraphs have alternative versions on other branches.

#### Acceptance Criteria

- [ ] Branched paragraphs display L-shaped markers on left and right edges
- [ ] Markers are rendered as CSS decorations or TipTap decorations
- [ ] Markers are non-editable and don't affect text content
- [ ] Markers use the accent color (#4A5E8A) or a subtle visual indicator
- [ ] Markers appear/disappear as branches are created/deleted

#### Files to Create/Modify

- `packages/editor/src/editor/decorations/branch-markers.ts` — (create) TipTap decoration for branch markers
- `packages/editor/src/styles/branch-markers.css` — (create) Branch marker CSS

#### Implementation Notes

Use TipTap's Decoration API to add visual decorations around paragraphs that have branch metadata. The decoration should add CSS classes to the paragraph's wrapping element. CSS: use `::before` and `::after` pseudo-elements for the L-shaped corners.

#### Evaluation Checklist

- [ ] Branch markers render on branched paragraphs
- [ ] Markers don't affect editing behavior

---

### T138: Implement Branch Preview Horizontal Scroller

**PRD Reference:** Sprint 3, Task 7 (Branch preview scroller)
**Depends on:** T134, T135
**Blocks:** Nothing
**User Stories:** US-20
**Estimated scope:** 1 hour

#### Description

For branched sections, show a horizontal scroller at the bottom with tabs for each branch that modifies that section. Clicking a tab shows a read-only preview of the section on that branch.

#### Acceptance Criteria

- [ ] Branched sections display a horizontal scroller at the bottom
- [ ] Each tab corresponds to a branch that has different content for that section
- [ ] Clicking a tab shows a read-only preview of the section on that branch
- [ ] Active branch tab is highlighted with accent color (#4A5E8A)
- [ ] Previewing does not change the current branch or document state
- [ ] Test: create branches with different section content → verify preview shows correct text

#### Files to Create/Modify

- `packages/editor/src/components/BranchPreview.tsx` — (create) Branch preview scroller component
- `packages/editor/src/git/section-preview.ts` — (create) Fetch section content from other branches
- `packages/editor/src/__tests__/branch-preview.test.ts` — (create) Preview tests

#### Implementation Notes

For each branched section, check which branches have different content for that paragraph (compare paragraph content across branches). Read section content from a branch without switching: use `git.readBlob()` to read the file at a specific ref, then parse the JSON to extract the paragraph. Render the scroller as a flex container with overflow-x scroll.

#### Evaluation Checklist

- [ ] Preview scroller shows correct branch tabs
- [ ] Click preview shows correct section content

---

### T139: Implement Three-Way Merge for Branch Merging

**PRD Reference:** Sprint 3, Task 8 (Branch merge — three-way merge)
**Depends on:** T134, T135
**Blocks:** T140
**User Stories:** US-21
**Estimated scope:** 2 hours

#### Description

Implement three-way merge for merging branches. Find the common ancestor, compare both branches, auto-merge non-conflicting changes, and detect conflicts for overlapping edits.

#### Acceptance Criteria

- [ ] Three-way merge computes: common ancestor, current branch content, incoming branch content
- [ ] Non-conflicting changes (different paragraphs edited) are auto-merged
- [ ] Conflicting changes (same paragraph edited on both branches) are flagged as conflicts
- [ ] Merge result includes: merged content + list of conflicts
- [ ] On successful auto-merge, a merge commit is created
- [ ] Test: non-conflicting merge → verify auto-merged content
- [ ] Test: conflicting merge → verify conflicts detected

#### Files to Create/Modify

- `packages/editor/src/git/merge.ts` — (create) Three-way merge algorithm
- `packages/editor/src/__tests__/git-merge.test.ts` — (create) Merge tests

#### Implementation Notes

Work at the paragraph level (not character level). Parse both document JSONs, identify paragraph-level changes relative to the common ancestor. If different paragraphs changed → merge both changes. If the same paragraph changed in both branches → conflict.

For finding the common ancestor: use `git.findMergeBase({ fs, dir, oids: [headOid, branchOid] })`.

Paragraph comparison: iterate through the document's `content` array (paragraphs), compare by text content.

#### Evaluation Checklist

- [ ] Auto-merge test passes for non-conflicting changes
- [ ] Conflict detection test passes for same-paragraph edits

---

### T140: Implement Merge Conflict UI

**PRD Reference:** Sprint 3, Task 8 (Conflict UI with accept/reject controls)
**Depends on:** T139
**Blocks:** Nothing
**User Stories:** US-21
**Estimated scope:** 1 hour

#### Description

When a merge has conflicts, display a conflict resolution UI showing both versions of each conflicting section with accept/reject controls.

#### Acceptance Criteria

- [ ] Conflict UI renders when merge detects conflicting changes
- [ ] Each conflict shows: "Current" version and "Incoming" version side-by-side or stacked
- [ ] Accept/reject buttons for each conflicting section
- [ ] "Accept Current" keeps the current branch's version; "Accept Incoming" takes the other branch's version
- [ ] After resolving all conflicts, a merge commit is created
- [ ] The merged branch can be deleted after successful merge
- [ ] Test: conflict resolution → verify correct final document state

#### Files to Create/Modify

- `packages/editor/src/components/MergeConflict.tsx` — (create) Conflict resolution UI
- `packages/editor/src/git/merge.ts` — (modify) Add conflict resolution and merge commit
- `packages/editor/src/__tests__/merge-conflict.test.ts` — (create) Conflict resolution tests

#### Implementation Notes

Render conflicts as cards (manuscript aesthetic) with the two versions. Use wired-elements buttons for accept/reject. After all conflicts are resolved, combine the merged paragraphs, write the file, and create a merge commit. For styling, show current in blue tint and incoming in orange tint.

#### Evaluation Checklist

- [ ] Conflict UI renders with both versions
- [ ] Resolution produces correct merged document
