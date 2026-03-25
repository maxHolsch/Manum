/**
 * T174: Settings persistence in IndexedDB
 */

import { getDB } from './db';

export type ScoringMode = 'edit-distance' | 'llm-judge';

export interface AppSettings {
  scoringMode: ScoringMode;
  apiKey: string;
  onboardingCompleted: boolean;
}

const DEFAULTS: AppSettings = {
  scoringMode: 'edit-distance',
  apiKey: '',
  onboardingCompleted: false,
};

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  try {
    const db = await getDB();
    const record = await db.get('settings', key);
    if (record === undefined) return DEFAULTS[key];
    return record.value as AppSettings[K];
  } catch {
    return DEFAULTS[key];
  }
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getAllSettings(): Promise<AppSettings> {
  const [scoringMode, apiKey, onboardingCompleted] = await Promise.all([
    getSetting('scoringMode'),
    getSetting('apiKey'),
    getSetting('onboardingCompleted'),
  ]);
  return { scoringMode, apiKey, onboardingCompleted };
}
