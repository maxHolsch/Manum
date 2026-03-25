import { openDB, type IDBPDatabase } from 'idb';
import type { AIPoolEntry, CopyRecord } from '@manum/shared';
import type { DocumentRecord } from './documents';

export const DB_NAME = 'manum_db';
export const DB_VERSION = 2;

export interface SessionSummary {
  id: string;
  documentId: string;
  startTime: number;
  endTime: number;
  activeTime: number;
  editCount: number;
  pasteCount: number;
  deleteCount: number;
  tabSwitches: number;
  branchCreations: number;
}

export interface CommitMetadataRecord {
  oid: string;
  title: string;
  summary: string;
  conceptual: string | null;
  generatedAt: number;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

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
  analytics_sessions: {
    key: string;
    value: SessionSummary;
    indexes: { documentId: string; startTime: number };
  };
  commit_metadata: {
    key: string;
    value: CommitMetadataRecord;
    indexes: { generatedAt: number };
  };
  settings: {
    key: string;
    value: SettingRecord;
  };
}

function openManumDB(name: string): Promise<IDBPDatabase<ManumDB>> {
  return openDB<ManumDB>(name, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
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
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('analytics_sessions')) {
          const sessStore = db.createObjectStore('analytics_sessions', { keyPath: 'id' });
          sessStore.createIndex('documentId', 'documentId');
          sessStore.createIndex('startTime', 'startTime');
        }
        if (!db.objectStoreNames.contains('commit_metadata')) {
          const cmStore = db.createObjectStore('commit_metadata', { keyPath: 'oid' });
          cmStore.createIndex('generatedAt', 'generatedAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
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
