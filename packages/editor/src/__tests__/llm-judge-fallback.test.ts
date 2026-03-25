import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withFallback,
  isLLMJudgeAvailable,
  resetLLMJudgeAvailability,
  onLLMJudgeFallback,
} from '../attribution/llm-judge/fallback';
import { LLMJudgeError } from '../attribution/llm-judge/api-client';

describe('LLM judge fallback', () => {
  beforeEach(() => {
    resetLLMJudgeAvailability();
  });

  afterEach(() => {
    resetLLMJudgeAvailability();
  });

  it('is available by default', () => {
    expect(isLLMJudgeAvailable()).toBe(true);
  });

  it('returns LLM result when API call succeeds', async () => {
    const llmResult = 'llm-result';
    const fallbackResult = 'fallback-result';

    const { result, usedFallback } = await withFallback(
      async () => llmResult,
      async () => fallbackResult,
    );

    expect(result).toBe(llmResult);
    expect(usedFallback).toBe(false);
    expect(isLLMJudgeAvailable()).toBe(true);
  });

  it('falls back to edit-distance on API failure', async () => {
    const fallbackResult = 'fallback-result';

    const { result, usedFallback } = await withFallback(
      async () => {
        throw new LLMJudgeError('API down', 'api-error');
      },
      async () => fallbackResult,
    );

    expect(result).toBe(fallbackResult);
    expect(usedFallback).toBe(true);
    expect(isLLMJudgeAvailable()).toBe(false);
  });

  it('uses fallback for subsequent calls after first failure', async () => {
    let llmCallCount = 0;

    // First call — fails
    await withFallback(
      async () => {
        llmCallCount++;
        throw new LLMJudgeError('failed', 'api-error');
      },
      async () => 'fallback',
    );

    // Second call — should NOT call LLM (session flag is set)
    await withFallback(
      async () => {
        llmCallCount++;
        return 'llm';
      },
      async () => 'fallback',
    );

    expect(llmCallCount).toBe(1); // Only called once
  });

  it('notifies listeners on fallback', async () => {
    const listener = vi.fn();
    const unsubscribe = onLLMJudgeFallback(listener);

    await withFallback(
      async () => {
        throw new LLMJudgeError('API error', 'api-error');
      },
      async () => 'fallback',
    );

    expect(listener).toHaveBeenCalledWith(expect.stringContaining('API error'));
    unsubscribe();
  });

  it('removes listener on unsubscribe', async () => {
    const listener = vi.fn();
    const unsubscribe = onLLMJudgeFallback(listener);
    unsubscribe();

    await withFallback(
      async () => {
        throw new LLMJudgeError('error', 'api-error');
      },
      async () => 'fallback',
    );

    expect(listener).not.toHaveBeenCalled();
  });
});
