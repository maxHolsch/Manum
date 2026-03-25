/**
 * T130: Repository initialization and management
 */

import git from 'isomorphic-git';
import { getFS, GIT_DIR } from './fs';

let repoInitialized = false;

export async function ensureRepoInitialized(): Promise<void> {
  if (repoInitialized) return;

  const fs = getFS();

  // Ensure the directory exists
  try {
    await fs.promises.mkdir(GIT_DIR, { recursive: true } as never);
  } catch {
    // Directory may already exist
  }

  // Check if git repo already exists
  try {
    await git.resolveRef({ fs, dir: GIT_DIR, ref: 'HEAD' });
    repoInitialized = true;
    return;
  } catch {
    // Repo doesn't exist yet, initialize it
  }

  await git.init({ fs, dir: GIT_DIR, defaultBranch: 'main' });
  repoInitialized = true;
}

export function resetRepoState(): void {
  repoInitialized = false;
}

export async function getCurrentBranch(): Promise<string> {
  const fs = getFS();
  const branch = await git.currentBranch({ fs, dir: GIT_DIR });
  return branch ?? 'main';
}
