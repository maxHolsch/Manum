import { useEffect } from 'react';
import type { DocumentRecord } from '../storage/documents';
import { useDocuments } from '../hooks/useDocuments';
import { WiredButton } from './ui/WiredButton';

interface DocumentListProps {
  onOpen: (doc: DocumentRecord) => void;
  onNew: (doc: DocumentRecord) => void;
}

export function DocumentList({ onOpen, onNew }: DocumentListProps) {
  const { documents, loading, refreshDocuments, addDocument, removeDocument } = useDocuments();

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const handleNew = async () => {
    const doc = await addDocument('Untitled');
    onNew(doc);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this document?')) {
      await removeDocument(id);
    }
  };

  return (
    <div
      className="document-list"
      style={{
        maxWidth: 768,
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-body)', color: 'var(--color-ink)', margin: 0 }}>
          Manum
        </h1>
        <WiredButton onClick={() => void handleNew()}>+ New Document</WiredButton>
      </div>

      {loading && (
        <p style={{ color: 'var(--color-gray)', fontFamily: 'var(--font-meta)' }}>Loading\u2026</p>
      )}

      {!loading && documents.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--color-gray)',
            fontFamily: 'var(--font-meta)',
            padding: '4rem 0',
          }}
        >
          <p>No documents yet.</p>
          <WiredButton onClick={() => void handleNew()}>Create your first document</WiredButton>
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {documents.map((doc) => (
          <li
            key={doc.id}
            onClick={() => onOpen(doc)}
            style={{
              padding: '1rem',
              marginBottom: '0.75rem',
              background: 'var(--color-paper)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{doc.title}</div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-gray)',
                  fontFamily: 'var(--font-meta)',
                }}
              >
                {new Date(doc.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <WiredButton onClick={() => void handleDelete(doc.id)} title="Delete document">
              \u2715
            </WiredButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
