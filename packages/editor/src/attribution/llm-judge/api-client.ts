/**
 * T127: Anthropic API client for LLM Judge mode
 */

import { buildEvaluationPrompt, parseEvaluationResponse } from './prompt';
import type { LLMJudgeResponse } from './prompt';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 256;

// Rate limiter: 10 requests per minute (token bucket)
interface TokenBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillIntervalMs: number;
}

function createTokenBucket(): TokenBucket {
  return {
    tokens: 10,
    lastRefill: Date.now(),
    maxTokens: 10,
    refillIntervalMs: 6000, // 1 token per 6 seconds = 10 per minute
  };
}

function consumeToken(bucket: TokenBucket): boolean {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / bucket.refillIntervalMs);

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens--;
    return true;
  }
  return false;
}

const rateLimiter = createTokenBucket();

export function getApiKey(): string | null {
  try {
    return localStorage.getItem('manum_anthropic_api_key');
  } catch {
    return null;
  }
}

export class LLMJudgeError extends Error {
  constructor(
    message: string,
    public readonly code: 'no-api-key' | 'rate-limited' | 'api-error' | 'parse-error',
  ) {
    super(message);
    this.name = 'LLMJudgeError';
  }
}

export async function evaluateSimilarity(
  userChunk: string,
  aiEntry: string,
): Promise<LLMJudgeResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new LLMJudgeError('No Anthropic API key configured', 'no-api-key');
  }

  if (!consumeToken(rateLimiter)) {
    throw new LLMJudgeError('Rate limit exceeded (10 req/min)', 'rate-limited');
  }

  const prompt = buildEvaluationPrompt(userChunk, aiEntry);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    throw new LLMJudgeError(`API request failed: ${response.status} ${errorText}`, 'api-error');
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text: string }> };
  const textContent = data.content?.find((c) => c.type === 'text')?.text ?? '';

  try {
    return parseEvaluationResponse(textContent);
  } catch (e) {
    throw new LLMJudgeError(`Failed to parse LLM response: ${String(e)}`, 'parse-error');
  }
}

// Export for testing
export { createTokenBucket, consumeToken };
