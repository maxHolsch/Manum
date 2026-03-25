# ADR-0002: Layered Attribution Engine with Dual Scoring Modes

## Status
Accepted

## Context
The core product claim is accurate text attribution (green/yellow/red). Attribution must handle:
- Direct pastes (RED) — edit distance from source < 20%
- Paraphrased/influenced text (YELLOW) — edit distance 20-70% or LLM semantic similarity
- Original text (GREEN) — no significant AI overlap, or user wrote it first (temporal gating)

Two scoring modes are required: a fast local edit-distance mode and an LLM-judge mode using Claude Haiku.

## Decision
Build attribution as a **layered engine**:
1. **Paste tracker** — captures paste events, links to copy records/AI pool entries, assigns initial RED
2. **Edit distance monitor** — tracks edits within attributed spans, recomputes distance on change (debounced), handles RED→YELLOW→GREEN transitions
3. **Idea overlap detector** — n-gram + keyword matching against temporally-gated AI pool for YELLOW detection on non-pasted text
4. **LLM judge** (optional) — sends candidate pairs to Haiku for semantic similarity, with caching and graceful fallback

Each layer is a separate module with a shared `AttributionSpan` interface. Scoring mode toggle switches between layers 3 and 4 for yellow detection.

## Rationale
- Layered design allows Sprint 2 to ship RED attribution without YELLOW logic
- Sprint 3 adds YELLOW layers (n-gram + LLM) without modifying RED logic
- LLM judge is fully optional — system works without API access
- Caching LLM results prevents redundant API costs
- Debounced re-scoring prevents performance issues during rapid edits

## Consequences
- Need a well-defined `AttributionSpan` interface from Sprint 2 that persists through Sprint 3-4
- Temporal gating logic must be correct from the start — bugs here undermine the core product promise
- LLM judge results may differ from edit-distance results — user may see color changes when switching modes

## Affects
Sprint 2 (RED attribution, paste tracking, edit distance), Sprint 3 (YELLOW detection, LLM judge, temporal gating), Sprint 4 (analytics based on attribution data)
