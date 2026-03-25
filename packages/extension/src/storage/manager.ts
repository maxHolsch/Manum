// Storage management utilities.
// Provides typed access to all storage areas, size estimation, and LRU eviction.

import type { AIPoolEntry, CopyRecord, TabEvent } from '@manum/shared';
import { STORAGE_KEYS } from './keys.js';

/** Maximum AI pool entries before LRU eviction kicks in. */
export const AI_POOL_MAX_ENTRIES = 10_000;

// ---------------------------------------------------------------------------
// Typed getters / setters
// ---------------------------------------------------------------------------

export async function getAIPoolEntries(): Promise<AIPoolEntry[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AI_POOL);
  return (result[STORAGE_KEYS.AI_POOL] as AIPoolEntry[] | undefined) ?? [];
}

export async function setAIPoolEntries(entries: AIPoolEntry[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.AI_POOL]: entries });
}

export async function getCopyRecordEntries(): Promise<CopyRecord[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.COPY_RECORDS);
  return (result[STORAGE_KEYS.COPY_RECORDS] as CopyRecord[] | undefined) ?? [];
}

export async function setCopyRecordEntries(records: CopyRecord[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.COPY_RECORDS]: records });
}

export async function getTabEventEntries(): Promise<TabEvent[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TAB_EVENTS);
  return (result[STORAGE_KEYS.TAB_EVENTS] as TabEvent[] | undefined) ?? [];
}

export async function setTabEventEntries(events: TabEvent[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.TAB_EVENTS]: events });
}

// ---------------------------------------------------------------------------
// Size estimation
// ---------------------------------------------------------------------------

/**
 * Estimates total storage usage in bytes (sum of JSON-serialized sizes).
 */
export async function estimateStorageSize(): Promise<number> {
  const [pool, copies, tabs] = await Promise.all([
    getAIPoolEntries(),
    getCopyRecordEntries(),
    getTabEventEntries(),
  ]);

  return JSON.stringify(pool).length + JSON.stringify(copies).length + JSON.stringify(tabs).length;
}

// ---------------------------------------------------------------------------
// LRU eviction for AI pool
// ---------------------------------------------------------------------------

/**
 * Evicts the oldest AI pool entries if the total exceeds `maxEntries`.
 * Sorted by timestamp ascending — oldest entries are removed first.
 * This runs in the background and does not block writes.
 */
export async function evictAIPoolIfNeeded(
  maxEntries: number = AI_POOL_MAX_ENTRIES,
): Promise<number> {
  const entries = await getAIPoolEntries();
  if (entries.length <= maxEntries) return 0;

  // Sort oldest-first, keep only the newest `maxEntries`
  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const evicted = sorted.length - maxEntries;
  const kept = sorted.slice(evicted);

  await setAIPoolEntries(kept);
  console.debug('[Manum] Storage manager: evicted', evicted, 'old AI pool entries');
  return evicted;
}
