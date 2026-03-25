import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { resetDB } from '../storage/db';
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
} from '../storage/documents';

let testDbSeq = 0;

beforeEach(() => {
  testDbSeq++;
  resetDB(`manum_test_docs_${testDbSeq}`);
});

afterEach(() => {
  resetDB();
});

describe('Document CRUD', () => {
  it('creates a document with default values', async () => {
    const doc = await createDocument();
    expect(doc.id).toMatch(/^doc_/);
    expect(doc.title).toBe('Untitled');
    expect(doc.attributionSpans).toEqual([]);
    expect(doc.createdAt).toBeGreaterThan(0);
    expect(doc.updatedAt).toBeGreaterThan(0);
  });

  it('creates a document with custom title', async () => {
    const doc = await createDocument('My Story');
    expect(doc.title).toBe('My Story');
  });

  it('gets a document by id', async () => {
    const created = await createDocument('Test Doc');
    const fetched = await getDocument(created.id);
    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(created.id);
    expect(fetched!.title).toBe('Test Doc');
  });

  it('returns undefined for non-existent document', async () => {
    const doc = await getDocument('nonexistent_id');
    expect(doc).toBeUndefined();
  });

  it('updates a document', async () => {
    const doc = await createDocument('Original');
    const updated = await updateDocument(doc.id, { title: 'Updated' });
    expect(updated!.title).toBe('Updated');
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(doc.updatedAt);

    const fetched = await getDocument(doc.id);
    expect(fetched!.title).toBe('Updated');
  });

  it('returns undefined when updating non-existent document', async () => {
    const result = await updateDocument('nope', { title: 'x' });
    expect(result).toBeUndefined();
  });

  it('deletes a document', async () => {
    const doc = await createDocument('To Delete');
    await deleteDocument(doc.id);
    const fetched = await getDocument(doc.id);
    expect(fetched).toBeUndefined();
  });

  it('lists all documents sorted by updatedAt descending', async () => {
    const d1 = await createDocument('First');
    await new Promise((r) => setTimeout(r, 5));
    const d2 = await createDocument('Second');
    await new Promise((r) => setTimeout(r, 5));
    const d3 = await createDocument('Third');

    const list = await listDocuments();
    expect(list).toHaveLength(3);
    // Most recently updated first
    expect(list[0].id).toBe(d3.id);
    expect(list[1].id).toBe(d2.id);
    expect(list[2].id).toBe(d1.id);
  });

  it('lists empty when no documents', async () => {
    const list = await listDocuments();
    expect(list).toEqual([]);
  });
});
