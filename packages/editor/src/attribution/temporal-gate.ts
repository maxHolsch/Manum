import type { AIPoolEntry } from '@manum/shared';
import { getDB } from '../storage/db';

/**
 * T121: Temporal Gating — AI Pool Query Filtering
 *
 * Only return AI pool entries whose timestamp predates the user text's
 * `createdAt` timestamp. This ensures users get credit for ideas they
 * had before the AI expressed them.
 */

export async function queryAIPoolBeforeTimestamp(beforeTimestamp: number): Promise<AIPoolEntry[]> {
  const db = await getDB();

  // Use the timestamp index to get entries ordered by time
  const allEntries = await db.getAllFromIndex('ai_pool', 'timestamp');

  // Filter: only entries where ai_timestamp < user text's createdAt
  return allEntries.filter((entry) => entry.timestamp < beforeTimestamp);
}

/**
 * Given an array of AI pool entries (already fetched), filter by timestamp.
 * Useful in tests and when entries are already loaded.
 */
export function filterByTimestamp(entries: AIPoolEntry[], beforeTimestamp: number): AIPoolEntry[] {
  return entries.filter((entry) => entry.timestamp < beforeTimestamp);
}
