import type { AIPoolEntry, CopyRecord } from '@manum/shared';
import { getDB } from '../storage/db';

const STORAGE_KEYS = {
  AI_POOL: 'manum_ai_pool',
  COPY_RECORDS: 'manum_copy_records',
} as const;

export function isExtensionAvailable(): boolean {
  try {
    return typeof chrome !== 'undefined' && chrome.storage !== undefined;
  } catch {
    return false;
  }
}

async function readFromChromeStorage(): Promise<{
  aiPool: AIPoolEntry[];
  copyRecords: CopyRecord[];
}> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([STORAGE_KEYS.AI_POOL, STORAGE_KEYS.COPY_RECORDS], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve({
          aiPool: (result[STORAGE_KEYS.AI_POOL] as AIPoolEntry[]) ?? [],
          copyRecords: (result[STORAGE_KEYS.COPY_RECORDS] as CopyRecord[]) ?? [],
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function syncFromExtension(): Promise<void> {
  if (!isExtensionAvailable()) return;

  try {
    const { aiPool, copyRecords } = await readFromChromeStorage();
    const db = await getDB();

    // Upsert AI pool entries (idempotent)
    const tx1 = db.transaction('ai_pool', 'readwrite');
    await Promise.all(aiPool.map((entry) => tx1.store.put(entry)));
    await tx1.done;

    // Upsert copy records (idempotent)
    const tx2 = db.transaction('copy_records', 'readwrite');
    await Promise.all(copyRecords.map((record) => tx2.store.put(record)));
    await tx2.done;
  } catch {
    // Graceful degradation: sync failure is non-fatal
  }
}
