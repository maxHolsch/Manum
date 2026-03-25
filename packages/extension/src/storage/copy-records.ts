// Copy record storage operations.
// Stores copy events from assistant messages in chrome.storage.local.

import type { CopyRecord } from '@manum/shared';

export const COPY_RECORDS_KEY = 'manum_copy_records';

/** Generates a simple UUID-like ID for copy records. */
function generateId(): string {
  return `copy-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Appends a new copy record. Multiple copies from the same message create separate records.
 */
export async function addCopyRecord(record: Omit<CopyRecord, 'id'>): Promise<void> {
  const records = await getCopyRecords();
  const full: CopyRecord = { ...record, id: generateId() };
  records.push(full);
  await chrome.storage.local.set({ [COPY_RECORDS_KEY]: records });
  console.debug('[Manum] Copy record stored', full.id);
}

/**
 * Returns all stored copy records.
 */
export async function getCopyRecords(): Promise<CopyRecord[]> {
  const result = await chrome.storage.local.get(COPY_RECORDS_KEY);
  return (result[COPY_RECORDS_KEY] as CopyRecord[] | undefined) ?? [];
}

/**
 * Clears all copy records.
 */
export async function clearCopyRecords(): Promise<void> {
  await chrome.storage.local.remove(COPY_RECORDS_KEY);
}
