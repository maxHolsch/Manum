import { useEffect, useState } from 'react';
import { ManumEditor } from './components/Editor';
import { DocumentList } from './components/DocumentList';
import { BottomNav, type AppMode } from './components/BottomNav';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/analytics/Dashboard';
import { getSetting } from './storage/settings-store';
import type { DocumentRecord } from './storage/documents';

type View = 'list' | 'editor';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);
  const [mode, setMode] = useState<AppMode>('write');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    void getSetting('onboardingCompleted').then((completed) => {
      if (!completed) setShowOnboarding(true);
      setOnboardingChecked(true);
    });
  }, []);

  const openDocument = (doc: DocumentRecord) => {
    setActiveDocument(doc);
    setView('editor');
    setMode('write');
  };

  const handleBack = () => {
    setView('list');
    setActiveDocument(null);
    setMode('write');
  };

  if (!onboardingChecked) return null;

  return (
    <>
      {showOnboarding && (
        <Onboarding
          isConnected={false}
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      <div
        className="manum-app paper-texture has-nav"
        style={{ minHeight: '100vh', backgroundColor: 'var(--color-parchment)' }}
      >
        {view === 'editor' && activeDocument ? (
          <>
            {mode === 'write' && (
              <ManumEditor
                document={activeDocument}
                onBack={handleBack}
                mode={mode}
                onModeChange={setMode}
              />
            )}
            {mode === 'branch' && (
              <ManumEditor
                document={activeDocument}
                onBack={handleBack}
                mode={mode}
                onModeChange={setMode}
              />
            )}
            {mode === 'insights' && <Dashboard docId={activeDocument.id} />}
          </>
        ) : (
          <DocumentList onOpen={openDocument} onNew={openDocument} />
        )}

        {view === 'editor' && activeDocument && <BottomNav mode={mode} onModeChange={setMode} />}
      </div>
    </>
  );
}
