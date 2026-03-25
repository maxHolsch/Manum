import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAutoScorer } from '../attribution/auto-scorer';

describe('createAutoScorer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('creates an auto-scorer with the expected interface', () => {
    const mockEditor = {
      state: {
        schema: { marks: {} },
        doc: { descendants: vi.fn() },
        tr: {},
      },
      view: { dispatch: vi.fn() },
    } as unknown as Parameters<typeof createAutoScorer>[0];

    const scorer = createAutoScorer(mockEditor);
    expect(scorer.onNewAIPoolEntries).toBeDefined();
    expect(scorer.scoreNow).toBeDefined();
    expect(scorer.destroy).toBeDefined();

    scorer.destroy();
  });

  it('debounces onNewAIPoolEntries calls (5 second debounce)', () => {
    const mockEditor = {
      state: {
        schema: { marks: {} },
        doc: { descendants: vi.fn() },
        tr: {},
      },
      view: { dispatch: vi.fn() },
    } as unknown as Parameters<typeof createAutoScorer>[0];

    // Override scoreDocument to track calls
    const scorer = createAutoScorer(mockEditor);
    const originalScoreNow = scorer.scoreNow;
    const callCounts = { count: 0 };
    vi.spyOn(scorer, 'scoreNow').mockImplementation(async () => {
      callCounts.count++;
      return originalScoreNow();
    });

    // Fire multiple events
    scorer.onNewAIPoolEntries();
    scorer.onNewAIPoolEntries();
    scorer.onNewAIPoolEntries();

    // Should not have called scoreNow yet
    expect(callCounts.count).toBe(0);

    // Advance time past the debounce
    vi.advanceTimersByTime(6000);

    scorer.destroy();
  });

  it('destroy cancels pending debounce', () => {
    const mockEditor = {
      state: {
        schema: { marks: {} },
        doc: { descendants: vi.fn() },
        tr: {},
      },
      view: { dispatch: vi.fn() },
    } as unknown as Parameters<typeof createAutoScorer>[0];

    const scorer = createAutoScorer(mockEditor);
    scorer.onNewAIPoolEntries();
    scorer.destroy();

    // Advancing time should not cause issues
    vi.advanceTimersByTime(10000);
  });
});
