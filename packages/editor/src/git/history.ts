/**
 * T162: Load document state at a specific commit
 */

import git from 'isomorphic-git';
import { getFS, GIT_DIR } from './fs';
import type { JSONContent } from '@tiptap/core';

export async function readDocumentAtCommit(
  commitOid: string,
  docId: string,
): Promise<JSONContent | null> {
  const fs = getFS();
  try {
    const { blob } = await git.readBlob({
      fs,
      dir: GIT_DIR,
      oid: commitOid,
      filepath: `${docId}.json`,
    });
    const text = new TextDecoder().decode(blob);
    return JSON.parse(text) as JSONContent;
  } catch {
    return null;
  }
}
