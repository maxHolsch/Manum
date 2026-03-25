/**
 * T172: Cross-project comparison view
 */

import { useEffect, useState } from 'react';
import { getDB } from '../../storage/db';
import type { DocumentRecord } from '../../storage/documents';
import { AttributionBar } from './AttributionBar';

interface DocWithAttribution extends DocumentRecord {
  green: number;
  yellow: number;
  red: number;
}

function computeAttribution(doc: DocumentRecord): { green: number; yellow: number; red: number } {
  // Walk the JSON content and compute attribution ratios
  let green = 0,
    yellow = 0,
    red = 0,
    total = 0;

  function traverse(node: {
    type?: string;
    text?: string;
    marks?: { type: string; attrs?: { color?: string } }[];
    content?: unknown[];
  }): void {
    if (node.type === 'text' && node.text) {
      const len = node.text.length;
      total += len;
      const attrMark = node.marks?.find((m) => m.type === 'attribution');
      if (!attrMark) {
        green += len;
      } else {
        const color = attrMark.attrs?.color;
        if (color === 'red') red += len;
        else if (color === 'yellow') yellow += len;
        else green += len;
      }
    }
    if (node.content) {
      for (const child of node.content) {
        traverse(child as typeof node);
      }
    }
  }

  if (doc.content)
    traverse(doc.content as typeof traverse extends (n: infer N) => void ? N : never);

  if (total === 0) return { green: 100, yellow: 0, red: 0 };
  return {
    green: Math.round((green / total) * 100),
    yellow: Math.round((yellow / total) * 100),
    red: Math.round((red / total) * 100),
  };
}

export function ProjectComparison() {
  const [docs, setDocs] = useState<DocWithAttribution[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const db = await getDB();
        const all = await db.getAllFromIndex('documents', 'updatedAt');
        const withAttr = all.reverse().map((doc) => ({
          ...doc,
          ...computeAttribution(doc),
        }));
        setDocs(withAttr);
      } catch {
        setDocs([]);
      }
    })();
  }, []);

  if (docs.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-meta)',
          fontSize: '0.8rem',
          color: 'var(--color-gray)',
          padding: '0.5rem 0',
        }}
      >
        No documents yet.
      </div>
    );
  }

  return (
    <div data-testid="project-comparison">
      {docs.map((doc) => (
        <div key={doc.id} style={{ marginBottom: '1rem' }}>
          <div
            style={{
              fontFamily: 'var(--font-meta)',
              fontSize: '0.85rem',
              color: 'var(--color-ink)',
              marginBottom: '0.3rem',
            }}
          >
            {doc.title}
          </div>
          <AttributionBar green={doc.green} yellow={doc.yellow} red={doc.red} />
        </div>
      ))}
    </div>
  );
}
