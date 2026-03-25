# Manum — Implementation Guide

## What We're Implementing

Manum is a Chrome extension + web editor that tracks AI-assisted writing and attributes each span of text as green (original), yellow (AI-influenced), or red (directly pasted). It adds git-style branching, a commit timeline, and behavioral analytics — all with a hand-drawn manuscript aesthetic. See the [PRD](prd.md) for full details.

- **PRD:** `.agent/prd.md` (read-only — do not modify)
- **Implementation docs:** `docs/implementation/manum/`
- **ADRs:** Referenced in `.agent/analysis.json` (ADR-0001 through ADR-0003)

## Document Map

- `tasks.md` — Master task list. Start here for the current phase.
- `features.md` — Feature registry with dependencies.
- `user_stories.md` — User stories with acceptance criteria.
- `phase1_foundation.md` — Phase 1: Foundation & project scaffolding.
- `phase2_capture.md` — Phase 2: Chrome extension capture layer.
- `phase3_editor_core.md` — Phase 3: TipTap editor, aesthetic, persistence, sync.
- `phase4_red_attribution.md` — Phase 4: RED attribution & edit tracking.
- `phase5_yellow_branching.md` — Phase 5: YELLOW attribution & git branching.
- `phase6_visualization_polish.md` — Phase 6: Visualization, analytics & polish.
- `progress.md` — Session log. Update after every session.

## Relevant ADRs

- ADR-0001: Dual Storage Architecture — chrome.storage.local for extension capture, IndexedDB for editor persistence; sync is one-way (extension → editor).
- ADR-0002: Layered Attribution Engine — Paste tracker → edit distance → idea overlap → optional LLM judge; two scoring modes toggleable in settings.
- ADR-0003: Extension-to-Editor Communication — Editor runs as chrome-extension:// page with direct chrome.storage access; polling fallback for dev mode.

## Implementation Process

Work through phases sequentially (1 → 6). For each phase:

### 1. Read the Phase Document

Open `phaseN_*.md`. Read Prerequisites, Phase Goal, and Phase Evaluation Criteria before touching any code. If there are Infrastructure Updates Required, implement those first.

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

Second pass (ideally a separate session/agent):
- Re-read phase doc, verify nothing missed
- Run full test suite to catch regressions
- Check linting and type checking

### 5. Update Progress

Add session entry to `progress.md` with tasks completed, blockers, discoveries, coverage, quality.

### 6. Proceed to Next Phase

Only when all tasks checked off, evaluation criteria pass, quality gates green.

## Quality Gates

Every phase must pass:

- Linting clean (`pnpm lint` — zero warnings)
- Type checking passes (`tsc --noEmit` across all packages)
- All tests pass (`pnpm -r test` — no regressions)
- Coverage target met (aim for >80% on attribution logic)
- Pre-commit hook completes in under 30 seconds

## Conventions

- **Monorepo:** pnpm workspaces with `packages/extension`, `packages/editor`, `packages/shared`
- **Package names:** `@manum/editor`, `@manum/extension`, `@manum/shared`
- **Commit messages:** Conventional commits — `feat(scope): description`, `fix(scope): description`, `test(scope): description`
- **Test files:** Co-located in `src/__tests__/` within each package
- **Editor tests:** Vitest with jsdom environment
- **Extension tests:** Jest with ts-jest
- **E2E tests:** Chrome DevTools MCP (Scenarios A-V in PRD)
- **Styling:** Manuscript aesthetic from Phase 3 onward — Special Elite, Courier Prime, Caveat fonts; warm parchment palette; rough.js, wired-elements, chart.xkcd
- **Editor page:** Runs as `chrome-extension://` page (user decision q1)
- **Edit distance:** Character-level Levenshtein (user decision q3)
- **LLM judge:** Direct Anthropic API calls from browser (user decision q4)

## DO NOT CHANGE

- **PRD:** `.agent/prd.md` is read-only. Do not modify.
- **Attribution thresholds:** RED < 20% edit distance, YELLOW 20-70%, GREEN > 70%. These are core product claims.
- **Temporal gating rule:** If user wrote it before AI said it, text stays GREEN. Non-negotiable.
- **YELLOW→GREEN impossible for idea overlap:** Once AI said it first, overlap is permanent. (Edit-distance YELLOW from RED spans CAN transition to GREEN.)
- **Scoring modes:** Edit-distance (default) and LLM judge (opt-in). Both must be available; LLM must fall back to edit-distance on failure.
- **Manifest V3:** Extension must use Manifest V3. No background pages.
- **Library stack:** rough.js, wired-elements, chart.xkcd, perfect-freehand, PaperCSS, css-doodle — mandated by PRD.
- **Phase documents:** `features.md`, `user_stories.md`, and `phaseN_*.md` are produced by prior planning tasks. Do not modify them.
