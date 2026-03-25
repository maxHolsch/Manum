// Storage key constants — single source of truth for all chrome.storage keys.

export const STORAGE_KEYS = {
  AI_POOL: 'manum_ai_pool',
  COPY_RECORDS: 'manum_copy_records',
  TAB_EVENTS: 'manum_tab_events',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
