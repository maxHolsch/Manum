export interface AIPoolEntry {
  messageId: string;
  text: string;
  timestamp: number;
  conversationId: string;
}

export interface CopyRecord {
  id: string;
  selectedText: string;
  sourceMessageId: string;
  timestamp: number;
}

export interface TabEvent {
  tabType: 'editor' | 'claude' | 'other';
  timestamp: number;
  url: string;
}

export interface StorageSchema {
  aiPool: AIPoolEntry[];
  copyRecords: CopyRecord[];
  tabEvents: TabEvent[];
}
