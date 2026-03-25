import { openDB, type IDBPDatabase } from 'idb';
import type { AIPoolEntry, CopyRecord } from '@manum/shared';
import type { DocumentRecord } from './documents';

export const DB_NAME = 'manum_db';
export const DB_VERSION = 1;

export interface ManumDB {
  documents: {
    key: string;
    value: DocumentRecord;
    indexes: { updatedAt: number };
  };
  ai_pool: {
    key: string;
    value: AIPoolEntry;
    indexes: { timestamp: number };
  };
  copy_records: {
    key: string;
    value: CopyRecord;
    indexes: { timestamp: number };
  };
}

function openManumDB(name: string): Promise<IDBPDatabase<ManumDB>> {
  return openDB<ManumDB>(name, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' });
        docStore.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('ai_pool')) {
        const aiStore = db.createObjectStore('ai_pool', { keyPath: 'messageId' });
        aiStore.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('copy_records')) {
        const copyStore = db.createObjectStore('copy_records', { keyPath: 'id' });
        copyStore.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

let _db: Promise<IDBPDatabase<ManumDB>> | null = null;
let _dbName: string = DB_NAME;

export function getDB(): Promise<IDBPDatabase<ManumDB>> {
  if (!_db) {
    _db = openManumDB(_dbName);
  }
  return _db;
}

/** Reset the db singleton. In tests, pass a unique name to get a fresh isolated database. */
export function resetDB(name?: string): void {
  _db = null;
  _dbName = name ?? DB_NAME;
}
