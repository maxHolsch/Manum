/**
 * T129: LLM Judge fallback to edit-distance mode
 */

import { LLMJudgeError } from './api-client';

export type ScoringMode = 'edit-distance' | 'llm-judge';

// Session-level flag — resets on page reload
let llmJudgeAvailable = true;

export function isLLMJudgeAvailable(): boolean {
  return llmJudgeAvailable;
}

export function resetLLMJudgeAvailability(): void {
  llmJudgeAvailable = true;
}

export type FallbackListener = (reason: string) => void;
const fallbackListeners: FallbackListener[] = [];

export function onLLMJudgeFallback(listener: FallbackListener): () => void {
  fallbackListeners.push(listener);
  return () => {
    const idx = fallbackListeners.indexOf(listener);
    if (idx !== -1) fallbackListeners.splice(idx, 1);
  };
}

function notifyFallback(reason: string): void {
  for (const listener of fallbackListeners) {
    listener(reason);
  }
  // Also dispatch a DOM event for React components to pick up
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manum:llm-fallback', { detail: { reason } }));
  }
}

/**
 * Execute an LLM judge call with automatic fallback on failure.
 * If the call fails, sets the session flag and notifies listeners.
 */
export async function withFallback<T>(
  llmCall: () => Promise<T>,
  fallbackCall: () => Promise<T>,
): Promise<{ result: T; usedFallback: boolean }> {
  if (!llmJudgeAvailable) {
    const result = await fallbackCall();
    return { result, usedFallback: true };
  }

  try {
    const result = await llmCall();
    return { result, usedFallback: false };
  } catch (e) {
    const reason = e instanceof LLMJudgeError ? e.message : String(e);
    console.warn('[Manum] LLM judge unavailable, falling back to edit-distance mode:', reason);

    llmJudgeAvailable = false;
    notifyFallback(reason);

    const result = await fallbackCall();
    return { result, usedFallback: true };
  }
}
