import { useState, useCallback } from 'react';
import {
  createDocument,
  deleteDocument,
  listDocuments,
  type DocumentRecord,
} from '../storage/documents';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } finally {
      setLoading(false);
    }
  }, []);

  const addDocument = useCallback(
    async (title?: string): Promise<DocumentRecord> => {
      const doc = await createDocument(title);
      await refreshDocuments();
      return doc;
    },
    [refreshDocuments],
  );

  const removeDocument = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      await refreshDocuments();
    },
    [refreshDocuments],
  );

  return { documents, loading, refreshDocuments, addDocument, removeDocument };
}
