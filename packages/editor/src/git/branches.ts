/**
 * T134, T135: Branch CRUD operations
 */

import git from 'isomorphic-git';
import type { JSONContent } from '@tiptap/core';
import { getFS, GIT_DIR } from './fs';
import { ensureRepoInitialized, getCurrentBranch } from './repo';

export interface BranchInfo {
  name: string;
  isActive: boolean;
}

export async function listBranches(): Promise<BranchInfo[]> {
  const fs = getFS();
  const [branches, current] = await Promise.all([
    git.listBranches({ fs, dir: GIT_DIR }),
    getCurrentBranch(),
  ]);

  return branches.map((name) => ({
    name,
    isActive: name === current,
  }));
}

export async function createBranch(name?: string): Promise<string> {
  await ensureRepoInitialized();
  const fs = getFS();

  let branchName = name;
  if (!branchName) {
    // Auto-generate branch name
    const existing = await git.listBranches({ fs, dir: GIT_DIR });
    let counter = 1;
    while (existing.includes(`branch-${counter}`)) {
      counter++;
    }
    branchName = `branch-${counter}`;
  }

  await git.branch({ fs, dir: GIT_DIR, ref: branchName });
  return branchName;
}

export async function checkoutBranch(
  branchName: string,
  docId: string,
): Promise<JSONContent | null> {
  const fs = getFS();

  await git.checkout({ fs, dir: GIT_DIR, ref: branchName });

  // Read the document from the checked-out branch
  const filePath = GIT_DIR + `/${docId}.json`;
  try {
    const content = (await fs.promises.readFile(filePath, 'utf8')) as string;
    return JSON.parse(content) as JSONContent;
  } catch {
    return null;
  }
}

export async function renameBranch(oldName: string, newName: string): Promise<void> {
  const fs = getFS();

  // isomorphic-git doesn't have a rename command directly
  // Create new branch at same commit, then delete old
  const currentBranch = await getCurrentBranch();
  const isActive = currentBranch === oldName;

  // Get the current HEAD of the old branch
  const oid = await git.resolveRef({ fs, dir: GIT_DIR, ref: oldName });

  // Create new branch
  await git.branch({ fs, dir: GIT_DIR, ref: newName, object: oid });

  if (isActive) {
    await git.checkout({ fs, dir: GIT_DIR, ref: newName });
  }

  // Delete old branch
  await git.deleteBranch({ fs, dir: GIT_DIR, ref: oldName });
}

export async function deleteBranch(name: string): Promise<void> {
  const fs = getFS();
  await git.deleteBranch({ fs, dir: GIT_DIR, ref: name });
}
