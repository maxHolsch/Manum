/**
 * T138: Fetch section content from other branches for preview
 */

import git from 'isomorphic-git';
import type { JSONContent } from '@tiptap/core';
import { getFS, GIT_DIR } from './fs';

export interface SectionPreview {
  branchName: string;
  paragraphText: string;
  paragraphContent: JSONContent | null;
}

/**
 * Read a document file at a specific branch ref without switching branches.
 */
async function readDocumentAtBranch(
  branchName: string,
  docId: string,
): Promise<JSONContent | null> {
  const fs = getFS();
  try {
    const oid = await git.resolveRef({ fs, dir: GIT_DIR, ref: branchName });
    const { blob } = await git.readBlob({
      fs,
      dir: GIT_DIR,
      oid,
      filepath: `${docId}.json`,
    });
    const text = new TextDecoder().decode(blob);
    return JSON.parse(text) as JSONContent;
  } catch {
    return null;
  }
}

/**
 * Extract a paragraph at a given index from a document JSON.
 */
function extractParagraph(doc: JSONContent, paragraphIndex: number): JSONContent | null {
  const paragraphs =
    doc.content?.filter((n) => n.type === 'paragraph' || n.type === 'heading') ?? [];
  return paragraphs[paragraphIndex] ?? null;
}

function paragraphToText(para: JSONContent): string {
  const parts: string[] = [];
  function traverse(node: JSONContent): void {
    if (node.type === 'text' && node.text) {
      parts.push(node.text);
    }
    if (node.content) {
      for (const child of node.content) traverse(child);
    }
  }
  traverse(para);
  return parts.join('');
}

/**
 * Get section previews for a paragraph across all branches that have different
 * content for that section.
 */
export async function getSectionPreviews(
  docId: string,
  paragraphIndex: number,
  branches: string[],
): Promise<SectionPreview[]> {
  const previews: SectionPreview[] = [];

  for (const branchName of branches) {
    const doc = await readDocumentAtBranch(branchName, docId);
    if (!doc) continue;

    const para = extractParagraph(doc, paragraphIndex);
    if (!para) continue;

    previews.push({
      branchName,
      paragraphText: paragraphToText(para),
      paragraphContent: para,
    });
  }

  return previews;
}
