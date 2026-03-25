// AI knowledge pool storage operations.
// Stores captured AI responses in chrome.storage.local under STORAGE_KEY.

import type { AIPoolEntry } from '@manum/shared';

export const AI_POOL_KEY = 'manum_ai_pool';

/**
 * Appends a new entry to the AI pool. Idempotent: duplicate messageIds are ignored.
 */
export async function addAIPoolEntry(entry: AIPoolEntry): Promise<void> {
  const entries = await getAIPool();

  // Idempotent: skip if messageId already present
  if (entries.some((e) => e.messageId === entry.messageId)) {
    console.debug('[Manum] AI pool: duplicate messageId skipped', entry.messageId);
    return;
  }

  entries.push(entry);
  await chrome.storage.local.set({ [AI_POOL_KEY]: entries });
  console.debug('[Manum] AI pool: stored entry', entry.messageId);
}

/**
 * Returns all current AI pool entries, or an empty array if none exist.
 */
export async function getAIPool(): Promise<AIPoolEntry[]> {
  const result = await chrome.storage.local.get(AI_POOL_KEY);
  return (result[AI_POOL_KEY] as AIPoolEntry[] | undefined) ?? [];
}

/**
 * Clears all AI pool entries (used in tests / reset flows).
 */
export async function clearAIPool(): Promise<void> {
  await chrome.storage.local.remove(AI_POOL_KEY);
}
