import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  evaluateSimilarity,
  LLMJudgeError,
  createTokenBucket,
  consumeToken,
} from '../attribution/llm-judge/api-client';
import { buildEvaluationPrompt, parseEvaluationResponse } from '../attribution/llm-judge/prompt';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('buildEvaluationPrompt', () => {
  it('includes user text and AI text in the prompt', () => {
    const prompt = buildEvaluationPrompt('user wrote this', 'ai said that');
    expect(prompt).toContain('user wrote this');
    expect(prompt).toContain('ai said that');
  });

  it('includes the expected JSON format instruction', () => {
    const prompt = buildEvaluationPrompt('a', 'b');
    expect(prompt).toContain('"score"');
    expect(prompt).toContain('"classification"');
  });
});

describe('parseEvaluationResponse', () => {
  it('parses a valid response', () => {
    const responseText =
      '{"score": 0.7, "classification": "yellow", "reasoning": "Some overlap detected"}';
    const result = parseEvaluationResponse(responseText);
    expect(result.score).toBe(0.7);
    expect(result.classification).toBe('yellow');
    expect(result.reasoning).toBe('Some overlap detected');
  });

  it('extracts JSON from surrounding text', () => {
    const responseText =
      'Sure, here is my analysis:\n{"score": 0.3, "classification": "green", "reasoning": "Independent"}\nHope that helps!';
    const result = parseEvaluationResponse(responseText);
    expect(result.score).toBe(0.3);
    expect(result.classification).toBe('green');
  });

  it('defaults to green classification for invalid values', () => {
    const responseText = '{"score": 0.5, "classification": "invalid", "reasoning": ""}';
    const result = parseEvaluationResponse(responseText);
    expect(result.classification).toBe('green');
  });

  it('throws for missing JSON', () => {
    expect(() => parseEvaluationResponse('no json here')).toThrow();
  });
});

describe('token bucket rate limiter', () => {
  it('allows up to 10 requests initially', () => {
    const bucket = createTokenBucket();
    for (let i = 0; i < 10; i++) {
      expect(consumeToken(bucket)).toBe(true);
    }
    expect(consumeToken(bucket)).toBe(false);
  });

  it('refills over time', () => {
    vi.useFakeTimers();
    const bucket = createTokenBucket();
    bucket.tokens = 0;
    bucket.lastRefill = Date.now();

    // Advance by 6 seconds (1 token refill)
    vi.advanceTimersByTime(6000);
    expect(consumeToken(bucket)).toBe(true);
    vi.useRealTimers();
  });
});

describe('evaluateSimilarity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorageMock.getItem.mockReset();
  });

  it('throws LLMJudgeError when no API key', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    await expect(evaluateSimilarity('text', 'ai text')).rejects.toThrow(LLMJudgeError);
  });

  it('calls Anthropic API with correct format', async () => {
    localStorageMock.getItem.mockReturnValue('test-api-key');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: '{"score": 0.8, "classification": "yellow", "reasoning": "Similar ideas"}',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await evaluateSimilarity('user text here', 'ai text here');
    expect(result.score).toBe(0.8);
    expect(result.classification).toBe('yellow');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key',
        }),
      }),
    );
  });

  it('throws LLMJudgeError on API failure', async () => {
    localStorageMock.getItem.mockReturnValue('test-api-key');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      }),
    );

    await expect(evaluateSimilarity('text', 'ai')).rejects.toThrow(LLMJudgeError);
  });
});
