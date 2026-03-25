import type { AIPoolEntry, CopyRecord, TabEvent } from './storage.js';

export type ExtensionMessageType =
  | 'AI_POOL_UPDATED'
  | 'COPY_RECORDED'
  | 'TAB_EVENT'
  | 'SYNC_REQUEST'
  | 'SYNC_RESPONSE';

export interface AIPoolUpdatedMessage {
  type: 'AI_POOL_UPDATED';
  payload: AIPoolEntry;
}

export interface CopyRecordedMessage {
  type: 'COPY_RECORDED';
  payload: CopyRecord;
}

export interface TabEventMessage {
  type: 'TAB_EVENT';
  payload: TabEvent;
}

export interface SyncRequestMessage {
  type: 'SYNC_REQUEST';
}

export interface SyncResponseMessage {
  type: 'SYNC_RESPONSE';
  payload: {
    aiPool: AIPoolEntry[];
    copyRecords: CopyRecord[];
  };
}

export type ExtensionMessage =
  | AIPoolUpdatedMessage
  | CopyRecordedMessage
  | TabEventMessage
  | SyncRequestMessage
  | SyncResponseMessage;
