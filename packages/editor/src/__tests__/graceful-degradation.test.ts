import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { resetDB } from '../storage/db';

let testDbSeq = 0;

// Ensure no chrome API is available
beforeEach(() => {
  testDbSeq++;
  resetDB(`manum_test_degrade_${testDbSeq}`);
  delete (globalThis as Record<string, unknown>).chrome;
});

afterEach(() => {
  resetDB();
  delete (globalThis as Record<string, unknown>).chrome;
});

describe('Graceful degradation without extension', () => {
  it('isExtensionAvailable returns false without chrome', async () => {
    const { isExtensionAvailable } = await import('../sync/extension-sync');
    expect(isExtensionAvailable()).toBe(false);
  });

  it('syncFromExtension resolves without error when chrome unavailable', async () => {
    const { syncFromExtension } = await import('../sync/extension-sync');
    await expect(syncFromExtension()).resolves.toBeUndefined();
  });

  it('document CRUD still works without chrome', async () => {
    const { createDocument, listDocuments, updateDocument, deleteDocument } =
      await import('../storage/documents');
    const doc = await createDocument('Test');
    expect(doc.id).toBeDefined();

    const list = await listDocuments();
    expect(list).toHaveLength(1);

    const updated = await updateDocument(doc.id, { title: 'Updated' });
    expect(updated!.title).toBe('Updated');

    await deleteDocument(doc.id);
    const list2 = await listDocuments();
    expect(list2).toHaveLength(0);
  });
});
