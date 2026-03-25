import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { getSetting, setSetting, getAllSettings } from '../storage/settings-store';
import { resetDB } from '../storage/db';

describe('settings store', () => {
  beforeEach(() => {
    resetDB(`test-settings-${Math.random()}`);
  });

  it('returns default scoring mode', async () => {
    const mode = await getSetting('scoringMode');
    expect(mode).toBe('edit-distance');
  });

  it('saves and retrieves scoring mode', async () => {
    await setSetting('scoringMode', 'llm-judge');
    const mode = await getSetting('scoringMode');
    expect(mode).toBe('llm-judge');
  });

  it('saves and retrieves API key', async () => {
    await setSetting('apiKey', 'sk-test-123');
    const key = await getSetting('apiKey');
    expect(key).toBe('sk-test-123');
  });

  it('returns default onboardingCompleted as false', async () => {
    const completed = await getSetting('onboardingCompleted');
    expect(completed).toBe(false);
  });

  it('saves and retrieves onboarding flag', async () => {
    await setSetting('onboardingCompleted', true);
    const completed = await getSetting('onboardingCompleted');
    expect(completed).toBe(true);
  });

  it('getAllSettings returns all values', async () => {
    await setSetting('scoringMode', 'llm-judge');
    await setSetting('apiKey', 'my-key');
    await setSetting('onboardingCompleted', true);

    const settings = await getAllSettings();
    expect(settings.scoringMode).toBe('llm-judge');
    expect(settings.apiKey).toBe('my-key');
    expect(settings.onboardingCompleted).toBe(true);
  });
});
