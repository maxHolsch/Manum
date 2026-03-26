You are a senior software architect decomposing a project into phases and tasks.

## Setup

1. The output directory is `docs/implementation/manum` — all deliverables go here
2. Read `docs/implementation/manum/features.md` for the feature registry
3. Read `docs/implementation/manum/user_stories.md` for the user stories
4. Read `.agent/analysis.json` for the full PRD analysis
5. Re-read the PRD at `.agent/prd.md` as needed

## Analysis Context

Estimated complexity: **large**
Features: 25
Constraints: 11
Risks: 8

Architecture notes:

- Two-part system: Chrome extension (capture layer) + Web app (editor + attribution engine), communicating via chrome.storage

- TipTap (ProseMirror) as the editor framework — chosen for custom mark/node extensibility needed for attribution spans and branch markers

- isomorphic-git with lightning-fs backed by IndexedDB for real git operations in the browser (branches, commits, diffs, merges)

- Attribution engine is layered: paste tracker → edit distance monitor → idea overlap detector → optional LLM judge

- Temporal gating is a core invariant: if the user wrote it before the AI said it, it stays GREEN regardless of similarity

- Yellow→Green transition is explicitly impossible per the PRD — once AI said it first, the overlap is permanent

- Two scoring modes (edit-distance vs LLM judge) are toggleable in settings, with LLM judge falling back to edit-distance on failure

- Manuscript/literary aesthetic is a core design requirement, not a nice-to-have — specific library stack mandated (rough.js, wired-elements, etc.)

- Sprint structure is sequential: capture layer → editor + RED → YELLOW + branching → visualization + analytics + polish

Technology decisions:

- **Editor Framework**: TipTap (ProseMirror-based) (PRD explicitly specifies TipTap. It's the right choice — headless and fully styleable, with excellent custom mark/node extensibility needed for attribution span marks and branch markers. ProseMirror's document model maps cleanly to the structured JSON stored in git. Slate.js has a less stable API; Lexical is newer with a smaller ecosystem.)

- **Browser Git Implementation**: isomorphic-git + lightning-fs (PRD explicitly specifies isomorphic-git. It provides real git semantics (branches, commits, diffs, three-way merge) in the browser. lightning-fs provides the filesystem abstraction backed by IndexedDB. A custom system would reimplement poorly; Automerge would be overkill for single-user and adds complexity.)

- **Build Tool**: Vite (PRD specifies Vite + React + TypeScript for the web app. Vite is the standard for modern React projects — fast dev server with HMR, optimized production builds, excellent TypeScript support. Also well-suited for building Chrome extensions with plugins like crxjs/vite-plugin.)

- **Edit Distance Algorithm**: Levenshtein distance (character-level) (Character-level Levenshtein aligns with the PRD's percentage-based thresholds (20%, 70% of characters changed). diff-match-patch is a strong alternative for the actual diff computation but Levenshtein gives a single normalized score. May use diff-match-patch internally for efficient computation. Jaro-Winkler is better for short strings; cosine similarity is better for semantic tasks (covered by LLM judge mode).)

- **N-gram Overlap for YELLOW Detection**: Custom n-gram extraction + scoring (The n-gram matching needed is straightforward (3-5 word windows, keyword overlap). A lightweight custom implementation avoids large NLP library dependencies. compromise.js or wink-nlp would add bundle size for minimal benefit. Keyword/entity extraction can use simple heuristics (capitalized words, technical terms).)

- **Chrome Extension Build Pipeline**: CRXJS Vite Plugin or manual Vite config (CRXJS integrates Manifest V3 extension building into Vite, which is already the web app build tool. Sharing the build tool reduces complexity. Plasmo is a higher-level framework that may conflict with the specific architecture choices in the PRD. Manual Vite config is a fallback if CRXJS has issues.)

- **Testing Framework**: Vitest (web app) + Jest (extension) (PRD specifies Vitest for the web app and Jest for extension scripts. Vitest integrates naturally with Vite. Jest is more established for Node.js-style testing of extension scripts. E2E tests use Chrome DevTools MCP as specified in the PRD.)

- **Hand-drawn UI Library Stack**: rough.js + wired-elements + chart.xkcd + react-rough-fiber + perfect-freehand + PaperCSS (PRD mandates this specific stack for the manuscript aesthetic. These libraries are all actively maintained and work together. rough.js (hand-drawn shapes) and wired-elements (sketchy UI components) are the most critical. chart.xkcd via react-rough-fiber bridges React rendering with hand-drawn charts.)

## Features & Stories Summary

Feature count: 27
Story count: 30
Feature IDs: F0, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12, F13, F14, F15, F16, F17, F18, F19, F20, F21, F22, F23, F24, F25, F26
Categories: Setup & Infrastructure, AI Capture, Writing & Editing, Attribution & Transparency, Branching & Versioning, History & Visualization, Analytics & Insights, Data Management, Navigation & Onboarding

## Step 5: Define Phases

### Process

1. **Topological sort** the feature dependency graph. Features with no dependencies come first.
2. **Group features into phases.** Each phase is a set of features that can be built together once all their dependencies are satisfied.
3. **Name each phase** descriptively: "Foundation," "Core Framework," "Components," "Integration," "Polish."
4. **Verify phase boundaries** — each phase should end with something verifiable.

### Phase Design Rules

```
Phase 0 (optional): Testing Infrastructure
  - Only if the project has zero test setup

Phase 1: Foundation
  - Project scaffolding, configuration, build system
  - Always the first "real" phase

Phase 2-N: Feature Phases
  - Group by dependency layer
  - Each phase builds on the previous
  - Parallel tasks marked [P]

Final Phase: Polish / Verification
  - Documentation, integration verification, cross-cutting concerns
```

### Phase Heuristics

- **3-7 phases is typical.** Fewer than 3 = too large (context drift risk). More than 7 = too granular (overhead).
- **Each phase ends with verifiable functionality.** "Endpoint returns 200" is verifiable. "Refactored module" alone is not.
- **Phase boundaries are quality gates.** All tests pass, linting clean, evaluation criteria met before moving on.

### Size Calibration

Use these templates to calibrate the scope of your output:

| Size       | Features | Phases | Tasks | Stories |
| ---------- | -------- | ------ | ----- | ------- |
| **Small**  | 3-5      | 3      | ~20   | 8-12    |
| **Medium** | 6-10     | 4-5    | ~50   | 15-25   |
| **Large**  | 10-15    | 5-7    | ~90+  | 25+     |

Compare your feature count from `analysis.json` against these ranges. If your task count is significantly outside the expected range for your feature count, reassess — you may be over- or under-decomposing.

## Step 6: Decompose Tasks

### Process

1. **For each feature in a phase,** identify concrete implementation steps.
2. **Assign task IDs** using the numbering convention:
   ```
   Phase 0 (if needed):  T001-T009
   Phase 1:              T010-T029
   Phase 2:              T030-T059
   Phase 3:              T060-T089
   Phase 4:              T090-T119
   Phase 5+:             Continue at next round number
   ```
   Leave gaps between phases for future insertions.
3. **Define dependencies.** Which tasks must complete before this one starts?
4. **Mark parallelizable tasks** with `[P]`.
5. **Estimate scope.** (15 min, 30 min, 1 hour, 2 hours, 3 hours). Split tasks >3 hours.
6. **Link to user stories.** Every task traces to at least one user story (infrastructure tasks may be "N/A").

### Task Decomposition Rules

- **One task = one focused change.** Modify 1-3 files. More = split it.
- **Each task is independently testable.** Verifiable without looking at future tasks.
- **Foundation before features.** Models before services, services before endpoints, endpoints before CLI.
- **Git commit per task.** Each task should produce a meaningful, atomic commit.
- **Always decompose large/open-ended tasks** (e.g., "Build auth system") into narrow, specific tasks.

### Task Reliability Tiers

| Type                      | Context Required   | Reliability | Example                                     |
| ------------------------- | ------------------ | ----------- | ------------------------------------------- |
| Type 1: Narrow            | Minimal            | High        | Create **init**.py, write test for function |
| Type 2: Context-Dependent | Codebase knowledge | Medium      | Implement endpoint matching pattern         |
| Type 3: Large/Open-Ended  | Broad, creative    | Low         | "Build auth system"                         |

**Rule: Never assign Type 3 tasks directly. Always decompose into Type 1 and Type 2.**

## Step 7: Write Phase Documents

For each phase, write `<output_dir>/phaseN_{name}.md` with this exact structure:

````markdown
# Phase {N}: {Name}

## Prerequisites

- {What must be complete before this phase begins}
- {Specific tests that must pass, tools that must work}

## Infrastructure Updates Required

<!-- Include when the phase needs small, targeted changes to existing modules
     from prior phases BEFORE the phase's tasks can begin.
     These are NOT new features — they are additions to existing code. -->

### IU-{N}: {Description}

**File:** `{path/to/file}`

{Why this change is needed. What task depends on it.}

```{language}
{Code snippet showing the exact change}
```
````

**Tests:** {What tests to add/modify}

<!-- When to use IU vs a Task:
     USE IU when: change is to a module from a prior phase, change is small (1-10 lines),
     change is a prerequisite for multiple tasks, change has no independent value.
     USE A TASK when: change is large enough to be its own deliverable (new class,
     new module, new endpoint), or it has independent testable value. -->

## Phase Goal

{One sentence: what is true at the end of this phase that wasn't true before?}

## Phase Evaluation Criteria

- {Verifiable command or check 1}
- {Verifiable command or check 2}
- All quality gates green (lint, types, tests)

---

## Tasks

### T{NNN}: {Task Title}

**PRD Reference:** Section {N}
**Depends on:** {T-IDs or "Nothing"}
**Blocks:** {T-IDs}
**User Stories:** {US-IDs or "N/A (infrastructure)"}
**Estimated scope:** {time}

#### Description

{What to build. Be specific about the deliverable.}

#### Acceptance Criteria

- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

#### Files to Create/Modify

- `{path}` — ({create|modify}) {what changes}

#### Implementation Notes

{Technical guidance: patterns to follow, gotchas, code snippets.
Reference specific PRD sections. Include enough detail that the
agent doesn't need to guess.}

#### Evaluation Checklist

- [ ] {How to verify this task is complete}
- [ ] {Test command that must pass}

```

### Rules for Writing Evaluation Criteria

The Phase Evaluation Criteria and per-task Evaluation Checklist are the most important parts of the phase document. They tell the agent exactly when a phase/task is done.

1. **Every criterion must be a command or observable check.** "Passes lint" → `uv run ruff check .` is clean. "Works correctly" is NOT a valid criterion.
2. **Include the exact commands.** `uv run pytest tests/unit/test_config.py -v` not "tests pass."
3. **Cover functional + quality.**
   - Functional: "endpoint returns 200 with expected body"
   - Quality: "ruff clean, mypy passes, no regressions"
4. **Be exhaustive for the phase; concise per task.** Phase criteria: 5-10 items. Task criteria: 2-5 items.
5. **Criteria must be achievable with the current phase's work.** Don't reference things built in future phases.

### Writing Heuristics
- **H23: Implementation Notes are your highest-leverage writing.** The more specific (function signatures, import paths, patterns), the higher the AI success rate.
- **H12: "5-15 min of reading per task" is a good target.** If a task's implementation notes take longer to read, it's either too detailed (prune) or the task is too large (split).
- **"Files to Create/Modify" prevents drift.** Agent knows exactly which files to touch.
- **Reference PRD sections directly.** "PRD Reference: Section 6/F3" lets the agent find the spec.
- **Acceptance criteria use checkboxes.** `- [ ]` format.
- **Phase evaluation criteria must be executable commands.** Not vague descriptions.
- **5-10 evaluation criteria per phase.** 2-5 checklist items per task.
- **H20: Criteria reference only current and prior work.** Never reference future phases.
- **H21: ~150-200 instructions per document is the practical limit.** Beyond this, AI compliance degrades.
- **The "could I explain this in one sentence?" test.** If a task description needs two sentences, it might be two tasks.

## Anti-Patterns to Avoid

Check your phase documents against these common mistakes:

| Anti-Pattern | Why It Fails | Fix |
|--------------|-------------|-----|
| **Copying PRD text into phase docs** | Creates divergence — two sources of truth. | Reference PRD sections: "PRD Reference: Section 6/F3" |
| **Vague evaluation criteria** | "Works correctly" is not verifiable. Agent doesn't know when done. | Use exact commands: `pytest tests/unit/test_config.py -v passes` |
| **Tasks without acceptance criteria** | Agent guesses what "done" means. Inconsistent quality. | Every task gets 2-5 checkbox items. |
| **Monolithic phases** | Context drift over long sessions degrades quality. | Split into 10-20 tasks per phase max. |
| **Missing dependencies** | Agent attempts tasks before prerequisites are complete. | Explicit `depends: T001, T003` on every task. |
| **No "Files to Create/Modify"** | Agent creates unexpected files or modifies wrong ones. | List every file affected per task. |
| **Testing as afterthought** | Tests written after all code = lower coverage, missed edge cases. | Include test tasks alongside implementation, or require tests in acceptance criteria. |
| **No progress tracking** | No institutional memory. Same bugs rediscovered. | `progress.md` with session-level discovery logging. |
| **Orphan tasks** | Tasks not linked to features/stories indicate scope creep. | Every task traces to a user story and feature. |
| **Phase docs without evaluation criteria** | No quality gate = no clear phase boundary. | Phase Evaluation Criteria section is mandatory. |

## Self-Review

Before finalizing, perform the following verification:

1. **Re-read the PRD, analysis.json, features.md, and user_stories.md.** For each feature, verify it maps to specific tasks in your phase documents. For each user story, verify at least one task addresses it.
2. **Check completeness** — does every task have acceptance criteria, "Files to Create/Modify", implementation notes, estimated scope, and an evaluation checklist? Are phase evaluation criteria executable commands, not vague descriptions?
3. **Check correctness** — are task dependencies valid (no forward references, no cycles)? Does task numbering follow the convention with gaps between phases? Do task IDs, feature IDs, and user story IDs cross-reference correctly?
4. **Verify sizing** — are there any tasks >3 hours? Any phases with >20 tasks? Any Type 3 (large/open-ended) tasks that should be decomposed further? Compare your total task count against the size calibration table.
5. **Fix genuine gaps** — if you find missing tasks, broken cross-references, vague evaluation criteria, or missing "Files to Create/Modify", fix them now.

## Finalize

After writing all phase documents:
1. Update `<output_dir>/features.md` — fill in the Tasks field with actual T-ID ranges
2. Update `<output_dir>/user_stories.md` — fill in the Task(s) column in the traceability matrix
3. Create `.agent/phases_done.txt` with content:
```

Output directory: <output_dir>
Phases: {count}
Total tasks: {count}
Phase documents: {list of filenames}
Task ID range: T{first}-T{last}

````
4. Create `.agent/phases_summary.json` — a structured summary for downstream tasks:
```json
{
  "phase_count": 4,
  "task_count": 45,
  "task_id_range": "T010-T119",
  "phase_filenames": ["phase1_foundation.md", "phase2_core.md", "phase3_integration.md", "phase4_polish.md"]
}
````

## Constraints

- Write only phaseN\_\*.md files (and update features.md/user_stories.md)
- Do NOT create tasks.md, progress.md, README.md, or GUIDE.md yet
