import { useEffect, useState } from 'react';
import type { ConnectionState } from '../components/ConnectionStatus';
import { syncFromExtension, isExtensionAvailable } from '../sync/extension-sync';

export function useExtensionSync() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');

  useEffect(() => {
    if (!isExtensionAvailable()) {
      setConnectionState('disconnected');
      return;
    }

    // Initial sync
    syncFromExtension()
      .then(() => setConnectionState('connected'))
      .catch(() => setConnectionState('disconnected'));

    // Incremental sync via storage change listener
    const handleChange = () => {
      syncFromExtension().catch(() => {
        // non-fatal
      });
    };

    try {
      chrome.storage.onChanged.addListener(handleChange);
    } catch {
      setConnectionState('disconnected');
    }

    return () => {
      try {
        chrome.storage.onChanged.removeListener(handleChange);
      } catch {
        // ignore
      }
    };
  }, []);

  return { connectionState };
}
