/**
 * T174, T175, T176: Settings panel
 */

import { useEffect, useState } from 'react';
import { getSetting, setSetting, type ScoringMode } from '../storage/settings-store';
import {
  estimateStorageSize,
  exportAllData,
  downloadAsJSON,
  cleanupOldData,
} from '../storage/export';

interface SettingsProps {
  onClose: () => void;
  onScoringModeChange?: (mode: ScoringMode) => void;
}

export function Settings({ onClose, onScoringModeChange }: SettingsProps) {
  const [scoringMode, setScoringMode] = useState<ScoringMode>('edit-distance');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [storageSize, setStorageSize] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const [mode, key, size] = await Promise.all([
        getSetting('scoringMode'),
        getSetting('apiKey'),
        estimateStorageSize(),
      ]);
      setScoringMode(mode);
      setApiKey(key);
      setStorageSize(size);
    })();
  }, []);

  const handleScoringChange = async (mode: ScoringMode) => {
    setScoringMode(mode);
    await setSetting('scoringMode', mode);
    onScoringModeChange?.(mode);
    flashSaved();
  };

  const handleApiKeySave = async () => {
    await setSetting('apiKey', apiKey);
    // Persist to localStorage for LLM judge compatibility
    try {
      localStorage.setItem('manum_anthropic_api_key', apiKey);
    } catch {
      // Non-fatal if localStorage unavailable
    }
    flashSaved();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      downloadAsJSON(data, `manum-export-${Date.now()}.json`);
    } finally {
      setExporting(false);
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      await cleanupOldData();
      const size = await estimateStorageSize();
      setStorageSize(size);
    } finally {
      setCleaning(false);
    }
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      data-testid="settings-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '340px',
        height: '100vh',
        background: 'var(--color-paper, #F5F0E8)',
        borderLeft: '1px solid var(--color-border, #D4C9A8)',
        zIndex: 600,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 12px rgba(0,0,0,0.12)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--color-border, #D4C9A8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display, Special Elite)',
            margin: 0,
            color: 'var(--color-ink, #2C2C2C)',
            fontSize: '1rem',
          }}
        >
          Settings
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {saved && (
            <span
              style={{
                fontFamily: 'var(--font-meta)',
                fontSize: '0.75rem',
                color: 'var(--color-green, #52A552)',
              }}
            >
              Saved ✓
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: 'var(--color-gray)',
            }}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* T174: Scoring Mode */}
        <section>
          <h4
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.8rem',
              color: 'var(--color-gray)',
              margin: '0 0 0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Attribution Scoring
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            {(['edit-distance', 'llm-judge'] as ScoringMode[]).map((mode) => (
              <label
                key={mode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-meta)',
                  fontSize: '0.85rem',
                  color: 'var(--color-ink)',
                }}
              >
                <input
                  type="radio"
                  name="scoring-mode"
                  value={mode}
                  checked={scoringMode === mode}
                  onChange={() => void handleScoringChange(mode)}
                  data-testid={`scoring-mode-${mode}`}
                />
                {mode === 'edit-distance' ? 'Edit Distance (default)' : 'LLM Judge (Claude)'}
              </label>
            ))}
          </div>
        </section>

        {/* T175: API Key */}
        <section>
          <h4
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.8rem',
              color: 'var(--color-gray)',
              margin: '0 0 0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Anthropic API Key
          </h4>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <input
              type={apiKeyVisible ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              data-testid="api-key-input"
              style={{
                flex: 1,
                fontFamily: 'var(--font-meta)',
                fontSize: '0.8rem',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                padding: '0.35rem 0.5rem',
                borderRadius: '2px',
              }}
            />
            <button
              onClick={() => setApiKeyVisible((v) => !v)}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: '2px',
                cursor: 'pointer',
                padding: '0 0.4rem',
                fontSize: '0.75rem',
              }}
            >
              {apiKeyVisible ? 'hide' : 'show'}
            </button>
          </div>
          <button
            onClick={() => void handleApiKeySave()}
            style={{
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              padding: '0.3rem 0.75rem',
              fontFamily: 'var(--font-meta)',
              fontSize: '0.8rem',
            }}
            data-testid="save-api-key"
          >
            Save Key
          </button>
          <p
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.7rem',
              color: 'var(--color-gray)',
              margin: '0.4rem 0 0',
            }}
          >
            Required for LLM Judge mode and commit titles.
          </p>
        </section>

        {/* T176: Storage */}
        <section>
          <h4
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.8rem',
              color: 'var(--color-gray)',
              margin: '0 0 0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Storage
          </h4>
          <p
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.85rem',
              color: 'var(--color-ink)',
              margin: '0 0 0.5rem',
            }}
          >
            Estimated usage: {storageSize !== null ? formatBytes(storageSize) : '—'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => void handleCleanup()}
              disabled={cleaning}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: '2px',
                cursor: 'pointer',
                padding: '0.3rem 0.6rem',
                fontFamily: 'var(--font-meta)',
                fontSize: '0.8rem',
              }}
              data-testid="cleanup-button"
            >
              {cleaning ? 'Cleaning…' : 'Clean Up'}
            </button>
            <button
              onClick={() => void handleExport()}
              disabled={exporting}
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
                padding: '0.3rem 0.6rem',
                fontFamily: 'var(--font-meta)',
                fontSize: '0.8rem',
              }}
              data-testid="export-button"
            >
              {exporting ? 'Exporting…' : 'Export Data'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
