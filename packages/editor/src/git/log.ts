/**
 * T133: Git log operations
 */

import git from 'isomorphic-git';
import { getFS, GIT_DIR } from './fs';
import { parseCommitMetadata } from './metadata';
import type { CommitMetadata } from './metadata';

export interface CommitLogEntry {
  oid: string;
  message: string;
  timestamp: number;
  author: string;
  metadata: CommitMetadata | null;
}

export async function getCommitLog(_docId: string, depth = 100): Promise<CommitLogEntry[]> {
  const fs = getFS();

  try {
    const log = await git.log({ fs, dir: GIT_DIR, depth });
    return log.map((entry) => ({
      oid: entry.oid,
      message: entry.commit.message,
      timestamp: entry.commit.author.timestamp * 1000, // convert to ms
      author: entry.commit.author.name,
      metadata: parseCommitMetadata(entry.commit.message),
    }));
  } catch {
    return [];
  }
}
