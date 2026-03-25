/**
 * T130: lightning-fs filesystem setup backed by IndexedDB
 */

import LightningFS from '@isomorphic-git/lightning-fs';

let _fs: LightningFS | null = null;

export function getFS(): LightningFS {
  if (!_fs) {
    _fs = new LightningFS('manum-git');
  }
  return _fs;
}

/** Reset the FS singleton — used in tests for isolation */
export function resetFS(name = 'manum-git'): void {
  _fs = new LightningFS(name);
}

export const GIT_DIR = '/documents';
