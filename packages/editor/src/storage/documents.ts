import type { JSONContent } from '@tiptap/react';
import type { AttributionSpan } from '@manum/shared';
import { getDB } from './db';

export interface DocumentRecord {
  id: string;
  title: string;
  content: JSONContent;
  attributionSpans: AttributionSpan[];
  createdAt: number;
  updatedAt: number;
}

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function createDocument(
  title: string = 'Untitled',
  content: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] },
): Promise<DocumentRecord> {
  const db = await getDB();
  const now = Date.now();
  const doc: DocumentRecord = {
    id: generateId(),
    title,
    content,
    attributionSpans: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.add('documents', doc);
  return doc;
}

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  const db = await getDB();
  return db.get('documents', id);
}

export async function updateDocument(
  id: string,
  data: Partial<Omit<DocumentRecord, 'id' | 'createdAt'>>,
): Promise<DocumentRecord | undefined> {
  const db = await getDB();
  const existing = await db.get('documents', id);
  if (!existing) return undefined;
  const updated: DocumentRecord = {
    ...existing,
    ...data,
    id,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  };
  await db.put('documents', updated);
  return updated;
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const db = await getDB();
  const all = await db.getAll('documents');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
