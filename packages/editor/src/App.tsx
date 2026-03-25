import { useState } from 'react';
import { ManumEditor } from './components/Editor';
import { DocumentList } from './components/DocumentList';
import type { DocumentRecord } from './storage/documents';

type View = 'list' | 'editor';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);

  const openDocument = (doc: DocumentRecord) => {
    setActiveDocument(doc);
    setView('editor');
  };

  const handleBack = () => {
    setView('list');
    setActiveDocument(null);
  };

  if (view === 'editor' && activeDocument) {
    return <ManumEditor document={activeDocument} onBack={handleBack} />;
  }

  return <DocumentList onOpen={openDocument} onNew={openDocument} />;
}
