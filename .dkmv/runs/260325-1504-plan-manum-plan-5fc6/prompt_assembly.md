You are a senior software architect assembling the final implementation documents.

## Setup

1. The output directory is `docs/implementation/manum` — all deliverables go here
2. Read ALL documents in `docs/implementation/manum/`: features.md, user*stories.md, and every phaseN*\*.md
3. Read `.agent/analysis.json` for the full PRD analysis
4. Read the PRD at `.agent/prd.md`

## Phases Summary

Phase count: 6
Total tasks: 92
Task ID range: T010-T181
Phase documents:

- phase1_foundation.md

- phase2_capture.md

- phase3_editor_core.md

- phase4_red_attribution.md

- phase5_yellow_branching.md

- phase6_visualization_polish.md

## Step 8: Create the Master Task List → tasks.md

Write `<output_dir>/tasks.md` with this structure:

```markdown
# {Project} — Master Task List

## How to Use This Document

- Tasks are numbered T{NNN}-T{NNN} sequentially
- [P] = parallelizable with other [P] tasks in same phase
- Check off tasks as completed: `- [x] T001 ...`
- Dependencies noted as "depends: T001, T003"
- Each phase has a detailed doc in `phaseN_*.md`

## Progress Summary

- **Total tasks:** {N}
- **Completed:** 0
- **In progress:** 0
- **Blocked:** 0
- **Remaining:** {N}

---

## Phase {N} — {Name} (depends: {prerequisite})

> Detailed specs: [phaseN\_{name}.md](phaseN_{name}.md)

### Task {N}.1: {Group Name} ({Feature ID})

- [ ] T{NNN} {Description} (depends: {T-IDs or "nothing"})
- [ ] T{NNN} [P] {Description} (depends: T{NNN})
- [ ] T{NNN} {Description} (depends: T{NNN}, T{NNN})

### Task {N}.2: {Group Name} ({Feature ID})

- [ ] T{NNN} {Description} (depends: T{NNN})
```

### tasks.md Heuristics

- tasks.md is the "start here" document — provides the bird's-eye view
- Group tasks within phases using sub-headers
- Progress Summary is updated by the agent after each session
- Link to phase docs in each phase section

## Step 9: Initialize Progress Tracking → progress.md

Write `<output_dir>/progress.md`:

```markdown
# {Project} Implementation Progress

## Current Status

- **Phase:** 0 (not started)
- **Tasks completed:** 0 / {N}
- **Test coverage:** N/A
- **Last session:** N/A

## Session Log

<!-- Agents: Add a new session entry after each implementation session. -->

### Session {N} — {YYYY-MM-DD}

**Goal:** Implement Phase {N} — {Phase Name}
**Completed:** {T-IDs completed}
**Infrastructure Updates Applied:** {IU-IDs, or "None"}
**Blockers:** {Any blockers, or "None"}
**Discoveries:**

- {Non-obvious finding 1}
  **Changes:**
- {File-level summary}
  **Coverage:** {test coverage %}
  **Quality:** {ruff, mypy, pytest status}
  **Next:** Phase {N} review pass

### Session {N+1} — {YYYY-MM-DD}

**Goal:** Review Phase {N} implementation
**Issues Found:** {count}
**Fixes Applied:**

- {Fix description}
  **Tests Added:** {count}
  **Regressions:** {count, or "None"}
  **Coverage:** {updated %}
  **Quality:** {status}
  **Next:** {Next phase or another review pass}
```

### The Phase Completion Loop

Each phase follows an implement → review → fix cycle. Include the following guidance
in progress.md so agents understand the expected workflow:

```
┌─────────────────────┐
│ Implement Phase N    │  Session K: build all tasks
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Review Phase N       │  Session K+1: read phase doc, run all checks,
│                      │  compare output against evaluation criteria
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │ Issues?    │
     └─────┬─────┘
       Yes │         No
           ▼          ▼
┌──────────────┐  ┌──────────────────┐
│ Fix issues   │  │ Proceed to       │
│ + re-review  │  │ Phase N+1        │
└──────┬───────┘  └──────────────────┘
       │
       └──► (back to Review)
```

**What happens in a review session:**

1. Re-read the phase document's evaluation criteria
2. Run every evaluation command — record which pass and fail
3. Run the _full_ test suite (not just the phase's tests) — catch regressions
4. Check linting and type checking
5. Read through code changes for logic errors tests don't catch
6. Log all issues found, fix them, log fixes in progress.md
7. If any issues were structural (not just typos), do another review pass

**Typical pattern:** 1-3 review sessions per phase. Budget for them.

**H24: Use a different agent/session for reviews** when possible. Fresh context catches what the builder missed.

## Step 10: Write the README → README.md

Write `<output_dir>/README.md`:

```markdown
# Implementation Documents — {Project/Version}

- `tasks.md` — Start here. Master task list with checkboxes.
- `features.md` — Feature registry ({F-range}) with dependency diagram.
- `user_stories.md` — All {N} user stories with traceability.
- `phase1_{name}.md` — Phase 1: {description}.
- `phase2_{name}.md` — Phase 2: {description}.
- ...
- `progress.md` — Session log and metrics.

Source of truth: `{path/to/prd.md}` (read-only)
```

### README Heuristics

- README is the agent's entry point for orientation
- "Source of truth" declaration is mandatory
- Keep it short — one line per document, no prose

## Step 11: Include Supporting Documents

1. Copy the PRD into the output directory (or reference its path). Mark it `(read-only)`.
2. If the PRD defines data formats, schemas, or API contracts, extract them into dedicated reference docs.
3. Don't duplicate what's in the PRD — phase docs reference PRD sections.

## Step 12: Create the Implementation Guide → GUIDE.md

Write `<output_dir>/GUIDE.md` with this structure:

```markdown
# {Project} — Implementation Guide

## What We're Implementing

{1-3 sentence summary. Link to the PRD.}

- **PRD:** `{prd_path}` (read-only — do not modify)
- **Implementation docs:** `<output_dir>/`
- **ADRs:** `{adr_path}` (if applicable)

## Document Map

- `tasks.md` — Master task list. Start here for the current phase.
- `features.md` — Feature registry with dependencies.
- `user_stories.md` — User stories with acceptance criteria.
- `phase1_{name}.md` through `phaseN_{name}.md` — Detailed task specs per phase.
- `progress.md` — Session log. Update after every session.

## Relevant ADRs

- ADR-{NNN}: {Title} — {One-line summary}

## Implementation Process

Work through phases sequentially. For each phase:

### 1. Read the Phase Document

Open `phaseN_{name}.md`. Read Prerequisites, Phase Goal, and Phase Evaluation Criteria before touching any code. If there are Infrastructure Updates Required, implement those first.

### 2. Implement Tasks in Order

Work through each task (T-IDs) sequentially. For each task:

- Read Description, Acceptance Criteria, Files to Create/Modify, and Implementation Notes
- **Verify implementation notes against actual code** — trust the code, not the doc
- Implement the task
- Check off Acceptance Criteria in the phase doc
- Check off the task in `tasks.md`

### 3. Verify the Phase

After all tasks complete:

- Run every command in Phase Evaluation Criteria
- All must pass. Fix issues before proceeding.

### 4. Review Pass

Second pass:

- Re-read phase doc, verify nothing missed
- Run full test suite to catch regressions
- Check linting and type checking

### 5. Update Progress

Add session entry to `progress.md` with tasks completed, blockers, discoveries, coverage, quality.

### 6. Proceed to Next Phase

Only when all tasks checked off, evaluation criteria pass, quality gates green.

## Quality Gates

Every phase must pass:

- Linting clean (zero warnings)
- Type checking passes
- All tests pass, no regressions
- Coverage target met

## Conventions

{Project-specific conventions: commit messages, branch naming, test file naming, etc.}

## DO NOT CHANGE

{List files/modules/APIs that are stable and must not be modified}
```

### GUIDE.md Heuristics

- Goes in the implementation directory, not the project root
- Keep under 200 lines — concise briefing, not a PRD copy
- "DO NOT CHANGE" section is critical — AI agents can't infer boundaries from omission
- The 6-step phase process is the core loop

## Self-Review

Before finalizing, perform the following verification:

1. **Re-read all phase documents and cross-reference with tasks.md.** Every task in every phase document must appear in tasks.md, and vice versa. Verify task IDs, descriptions, and dependency annotations match.
2. **Check completeness** — does tasks.md have an accurate progress summary with correct total count? Does GUIDE.md have all required sections (Document Map, Quality Gates, Conventions, DO NOT CHANGE)? Does README.md list every document in the output directory?
3. **Check correctness** — are all cross-references accurate (task IDs, feature IDs, phase document filenames)? Does the Document Map in GUIDE.md match the actual files created? Are phase links in tasks.md correct?
4. **Verify traceability** — pick 3 random tasks from tasks.md and trace them back through the phase doc, user story, feature, and PRD section. If any link is broken, investigate and fix.
5. **Fix genuine gaps** — if you find mismatched counts, broken cross-references, missing documents, or inaccurate metadata, fix them now.

## Finalize

After writing all documents, create `.agent/assembly_done.txt`:

```
Output directory: <output_dir>
Documents created:
- <output_dir>/tasks.md ({N} tasks)
- <output_dir>/progress.md
- <output_dir>/README.md
- <output_dir>/GUIDE.md
- <output_dir>/{prd_name}.md (copy/reference)
```

## Constraints

- Write only tasks.md, progress.md, README.md, GUIDE.md, and PRD copy to the output directory
- Do NOT modify phase documents, features.md, or user_stories.md
- All cross-references must be accurate
