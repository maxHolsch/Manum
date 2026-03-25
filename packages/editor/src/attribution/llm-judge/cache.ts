/**
 * T128: LLM Judge result cache with content hashing
 */

import type { LLMJudgeResponse } from './prompt';
import { getDB } from '../../storage/db';

export async function computeContentHash(userText: string, aiText: string): Promise<string> {
  const input = userText + '|' + aiText;
  const buffer = new TextEncoder().encode(input);

  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback for environments without crypto.subtle (e.g., some test envs)
    return btoa(input.slice(0, 64)).replace(/[^a-z0-9]/gi, '');
  }
}

interface CacheEntry {
  hash: string;
  result: LLMJudgeResponse;
  createdAt: number;
}

// In-memory cache as primary; IndexedDB as secondary (persistent)
const memoryCache = new Map<string, LLMJudgeResponse>();

export async function getCachedResult(hash: string): Promise<LLMJudgeResponse | null> {
  // Check memory cache first
  const memResult = memoryCache.get(hash);
  if (memResult) return memResult;

  // Try IndexedDB
  try {
    const db = await getDB();
    const tx = db.transaction('llm_judge_cache' as never, 'readonly');
    const store = tx.objectStore('llm_judge_cache' as never);
    const entry = await (store.get(hash) as Promise<CacheEntry | undefined>);
    if (entry) {
      memoryCache.set(hash, entry.result);
      return entry.result;
    }
  } catch {
    // Cache read failure is non-fatal
  }

  return null;
}

export async function setCachedResult(hash: string, result: LLMJudgeResponse): Promise<void> {
  memoryCache.set(hash, result);

  try {
    const db = await getDB();
    const tx = db.transaction('llm_judge_cache' as never, 'readwrite');
    const store = tx.objectStore('llm_judge_cache' as never);
    await (store.put({ hash, result, createdAt: Date.now() }) as Promise<unknown>);
    await tx.done;
  } catch {
    // Cache write failure is non-fatal
  }
}

export function clearMemoryCache(): void {
  memoryCache.clear();
}
