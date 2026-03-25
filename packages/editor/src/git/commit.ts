/**
 * T131 + T132: Auto-commit on save with metadata
 */

import git from 'isomorphic-git';
import type { JSONContent } from '@tiptap/core';
import { getFS, GIT_DIR } from './fs';
import { ensureRepoInitialized } from './repo';
import { buildCommitMessage, parseCommitMetadata } from './metadata';
import type { CommitMetadata } from './metadata';

const AUTHOR = { name: 'Manum', email: 'manum@local' };

function getFilePath(docId: string): string {
  return `/${docId}.json`;
}

async function readLastCommitWordCount(_docId: string): Promise<number> {
  const fs = getFS();
  try {
    const log = await git.log({ fs, dir: GIT_DIR, depth: 1 });
    if (log.length === 0) return 0;
    const metadata = parseCommitMetadata(log[0].commit.message);
    return metadata?.wordCount ?? 0;
  } catch {
    return 0;
  }
}

async function hasChanges(docId: string, newContent: string): Promise<boolean> {
  const fs = getFS();
  const filePath = getFilePath(docId);

  try {
    const log = await git.log({ fs, dir: GIT_DIR, depth: 1 });
    if (log.length === 0) return true;

    const commitOid = log[0].oid;
    const { blob } = await git.readBlob({
      fs,
      dir: GIT_DIR,
      oid: commitOid,
      filepath: filePath.slice(1), // remove leading /
    });
    const lastContent = new TextDecoder().decode(blob);
    return lastContent !== newContent;
  } catch {
    return true;
  }
}

export interface CommitResult {
  oid: string;
  metadata: CommitMetadata;
}

export async function commitDocument(
  docId: string,
  content: JSONContent,
): Promise<CommitResult | null> {
  await ensureRepoInitialized();

  const fs = getFS();
  const filePath = getFilePath(docId);
  const contentStr = JSON.stringify(content, null, 2);

  // Check for changes to avoid empty commits
  if (!(await hasChanges(docId, contentStr))) {
    return null;
  }

  // Write file to virtual filesystem
  await fs.promises.writeFile(GIT_DIR + filePath, contentStr);

  // Stage the file
  await git.add({ fs, dir: GIT_DIR, filepath: filePath.slice(1) });

  // Get previous word count for delta computation
  const previousWordCount = await readLastCommitWordCount(docId);

  // Build commit message with metadata
  const { message, metadata } = buildCommitMessage(content, previousWordCount);

  // Create the commit
  const oid = await git.commit({
    fs,
    dir: GIT_DIR,
    message,
    author: AUTHOR,
  });

  return { oid, metadata };
}
