/**
 * T139 + T140: Three-way merge algorithm and conflict resolution
 */

import git from 'isomorphic-git';
import type { JSONContent } from '@tiptap/core';
import { getFS, GIT_DIR } from './fs';
import { getCurrentBranch } from './repo';
import { ensureRepoInitialized } from './repo';

const AUTHOR = { name: 'Manum', email: 'manum@local' };

export interface MergeConflict {
  paragraphIndex: number;
  currentContent: JSONContent;
  incomingContent: JSONContent;
  ancestorContent: JSONContent | null;
}

export interface MergeResult {
  success: boolean;
  mergedContent: JSONContent | null;
  conflicts: MergeConflict[];
  commitOid: string | null;
}

async function readDocumentAtOid(oid: string, docId: string): Promise<JSONContent | null> {
  const fs = getFS();
  try {
    const { blob } = await git.readBlob({
      fs,
      dir: GIT_DIR,
      oid,
      filepath: `${docId}.json`,
    });
    return JSON.parse(new TextDecoder().decode(blob)) as JSONContent;
  } catch {
    return null;
  }
}

function getParagraphs(doc: JSONContent): JSONContent[] {
  return doc.content?.filter((n) => n.type === 'paragraph' || n.type === 'heading') ?? [];
}

function paragraphToText(para: JSONContent): string {
  const parts: string[] = [];
  function traverse(node: JSONContent): void {
    if (node.type === 'text' && node.text) parts.push(node.text);
    if (node.content) for (const child of node.content) traverse(child);
  }
  traverse(para);
  return parts.join('');
}

/**
 * Three-way merge at the paragraph level.
 * Returns merged content and any conflicts.
 */
export async function threeWayMerge(docId: string, incomingBranch: string): Promise<MergeResult> {
  await ensureRepoInitialized();
  const fs = getFS();

  const currentBranch = await getCurrentBranch();
  const currentOid = await git.resolveRef({ fs, dir: GIT_DIR, ref: currentBranch });
  const incomingOid = await git.resolveRef({ fs, dir: GIT_DIR, ref: incomingBranch });

  // Find merge base (common ancestor)
  let ancestorOid: string | null = null;
  try {
    const bases = await git.findMergeBase({ fs, dir: GIT_DIR, oids: [currentOid, incomingOid] });
    ancestorOid = bases[0] ?? null;
  } catch {
    // No common ancestor — treat as no ancestor
  }

  const [currentDoc, incomingDoc, ancestorDoc] = await Promise.all([
    readDocumentAtOid(currentOid, docId),
    readDocumentAtOid(incomingOid, docId),
    ancestorOid ? readDocumentAtOid(ancestorOid, docId) : Promise.resolve(null),
  ]);

  if (!currentDoc || !incomingDoc) {
    return { success: false, mergedContent: null, conflicts: [], commitOid: null };
  }

  const currentParas = getParagraphs(currentDoc);
  const incomingParas = getParagraphs(incomingDoc);
  const ancestorParas = ancestorDoc ? getParagraphs(ancestorDoc) : [];

  const mergedParas: JSONContent[] = [];
  const conflicts: MergeConflict[] = [];

  const maxLen = Math.max(currentParas.length, incomingParas.length, ancestorParas.length);

  for (let i = 0; i < maxLen; i++) {
    const current = currentParas[i] ?? null;
    const incoming = incomingParas[i] ?? null;
    const ancestor = ancestorParas[i] ?? null;

    const currentText = current ? paragraphToText(current) : null;
    const incomingText = incoming ? paragraphToText(incoming) : null;
    const ancestorText = ancestor ? paragraphToText(ancestor) : null;

    if (currentText === incomingText) {
      // No change on either branch
      if (current) mergedParas.push(current);
    } else if (currentText === ancestorText && incoming) {
      // Only incoming changed
      mergedParas.push(incoming);
    } else if (incomingText === ancestorText && current) {
      // Only current changed
      mergedParas.push(current);
    } else if (current && incoming) {
      // Both changed — conflict
      conflicts.push({
        paragraphIndex: i,
        currentContent: current,
        incomingContent: incoming,
        ancestorContent: ancestor,
      });
      // Tentatively keep current (user will resolve)
      mergedParas.push(current);
    } else if (current) {
      mergedParas.push(current);
    } else if (incoming) {
      mergedParas.push(incoming);
    }
  }

  const mergedContent: JSONContent = {
    type: 'doc',
    content: mergedParas,
  };

  if (conflicts.length > 0) {
    return {
      success: false,
      mergedContent,
      conflicts,
      commitOid: null,
    };
  }

  // No conflicts — create merge commit
  const commitOid = await createMergeCommit(docId, mergedContent, currentBranch, incomingBranch);

  return {
    success: true,
    mergedContent,
    conflicts: [],
    commitOid,
  };
}

async function createMergeCommit(
  docId: string,
  content: JSONContent,
  currentBranch: string,
  incomingBranch: string,
): Promise<string> {
  const fs = getFS();
  const filePath = `${docId}.json`;
  const fullPath = GIT_DIR + `/${filePath}`;

  await fs.promises.writeFile(fullPath, JSON.stringify(content, null, 2));
  await git.add({ fs, dir: GIT_DIR, filepath: filePath });

  const oid = await git.commit({
    fs,
    dir: GIT_DIR,
    message: `Merge branch '${incomingBranch}' into ${currentBranch}`,
    author: AUTHOR,
  });

  return oid;
}

/**
 * Resolve conflicts by applying user choices and creating a merge commit.
 */
export async function resolveConflicts(
  docId: string,
  mergedContent: JSONContent,
  resolutions: Map<number, 'current' | 'incoming'>,
  conflicts: MergeConflict[],
  incomingBranch: string,
): Promise<string> {
  const paragraphs = [...(mergedContent.content ?? [])];

  // Apply resolutions
  for (const conflict of conflicts) {
    const resolution = resolutions.get(conflict.paragraphIndex) ?? 'current';
    const chosenContent =
      resolution === 'incoming' ? conflict.incomingContent : conflict.currentContent;
    paragraphs[conflict.paragraphIndex] = chosenContent;
  }

  const resolvedContent: JSONContent = {
    type: 'doc',
    content: paragraphs,
  };

  const currentBranch = await getCurrentBranch();
  return createMergeCommit(docId, resolvedContent, currentBranch, incomingBranch);
}
