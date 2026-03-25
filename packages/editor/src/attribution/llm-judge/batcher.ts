/**
 * T128: Batch processing for LLM Judge API calls
 */

import type { LLMJudgeResponse } from './prompt';
import { evaluateSimilarity } from './api-client';
import { computeContentHash, getCachedResult, setCachedResult } from './cache';

export interface BatchPair {
  userText: string;
  aiText: string;
}

export interface BatchResult {
  pair: BatchPair;
  hash: string;
  result: LLMJudgeResponse | null;
  error: string | null;
  fromCache: boolean;
}

const DEFAULT_BATCH_SIZE = 5;
const FLUSH_TIMEOUT_MS = 2000;

export interface Batcher {
  add: (pair: BatchPair) => Promise<LLMJudgeResponse | null>;
  flush: () => Promise<BatchResult[]>;
  destroy: () => void;
}

export function createBatcher(batchSize = DEFAULT_BATCH_SIZE): Batcher {
  const queue: Array<{
    pair: BatchPair;
    resolve: (result: LLMJudgeResponse | null) => void;
    reject: (err: Error) => void;
  }> = [];

  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const processQueue = async (): Promise<BatchResult[]> => {
    if (queue.length === 0) return [];

    const batch = queue.splice(0, batchSize);
    const results: BatchResult[] = [];

    for (const item of batch) {
      const hash = await computeContentHash(item.pair.userText, item.pair.aiText);

      // Check cache first
      const cached = await getCachedResult(hash);
      if (cached) {
        const batchResult: BatchResult = {
          pair: item.pair,
          hash,
          result: cached,
          error: null,
          fromCache: true,
        };
        results.push(batchResult);
        item.resolve(cached);
        continue;
      }

      // Call API
      try {
        const result = await evaluateSimilarity(item.pair.userText, item.pair.aiText);
        await setCachedResult(hash, result);
        const batchResult: BatchResult = {
          pair: item.pair,
          hash,
          result,
          error: null,
          fromCache: false,
        };
        results.push(batchResult);
        item.resolve(result);
      } catch (e) {
        const batchResult: BatchResult = {
          pair: item.pair,
          hash,
          result: null,
          error: String(e),
          fromCache: false,
        };
        results.push(batchResult);
        item.resolve(null);
      }
    }

    // Process remaining if any
    if (queue.length > 0) {
      const remaining = await processQueue();
      results.push(...remaining);
    }

    return results;
  };

  const scheduleFlush = (): void => {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void processQueue();
    }, FLUSH_TIMEOUT_MS);
  };

  const add = (pair: BatchPair): Promise<LLMJudgeResponse | null> => {
    return new Promise((resolve, reject) => {
      queue.push({ pair, resolve, reject });
      if (queue.length >= batchSize) {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        void processQueue();
      } else {
        scheduleFlush();
      }
    });
  };

  const flush = (): Promise<BatchResult[]> => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    return processQueue();
  };

  const destroy = (): void => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };

  return { add, flush, destroy };
}
