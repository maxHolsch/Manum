/**
 * T136: Section-level branch logic
 *
 * Allows branching from a specific paragraph selection. The branch is a
 * full document branch (git doesn't support partial branches), but we track
 * which paragraph was the focus.
 */

import { createBranch } from './branches';

export interface SectionBranchMetadata {
  branchName: string;
  paragraphIndex: number;
  createdAt: number;
}

// In-memory store of section branch metadata
// In a production app, this would be persisted to IndexedDB
const sectionBranchMap = new Map<string, SectionBranchMetadata[]>();

export async function createSectionBranch(
  docId: string,
  paragraphIndex: number,
  branchName?: string,
): Promise<SectionBranchMetadata> {
  const name = await createBranch(branchName);

  const metadata: SectionBranchMetadata = {
    branchName: name,
    paragraphIndex,
    createdAt: Date.now(),
  };

  const existing = sectionBranchMap.get(docId) ?? [];
  existing.push(metadata);
  sectionBranchMap.set(docId, existing);

  return metadata;
}

export function getSectionBranches(docId: string): SectionBranchMetadata[] {
  return sectionBranchMap.get(docId) ?? [];
}

export function getBranchedParagraphIndices(docId: string): Set<number> {
  const branches = getSectionBranches(docId);
  return new Set(branches.map((b) => b.paragraphIndex));
}

export function clearSectionBranchMap(): void {
  sectionBranchMap.clear();
}
