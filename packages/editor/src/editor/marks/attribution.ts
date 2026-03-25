import { Mark, mergeAttributes } from '@tiptap/core';

export type AttributionColor = 'green' | 'yellow' | 'red';

export interface AttributionAttributes {
  color: AttributionColor;
  confidence: number;
  scoringMode: 'edit-distance' | 'llm-judge';
  pasteEventId: string | null;
  originalPasteContent: string | null;
  editDistance: number | null;
  createdAt: number | null;
}

export const AttributionMark = Mark.create<Record<string, unknown>>({
  name: 'attribution',

  addAttributes() {
    return {
      color: { default: 'green' },
      confidence: { default: 1.0 },
      scoringMode: { default: 'edit-distance' },
      pasteEventId: { default: null },
      originalPasteContent: { default: null },
      editDistance: { default: null },
      createdAt: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-attribution-color]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            color: el.getAttribute('data-attribution-color'),
            confidence: parseFloat(el.getAttribute('data-attribution-confidence') || '1.0'),
            scoringMode: el.getAttribute('data-attribution-scoring-mode') || 'edit-distance',
            pasteEventId: el.getAttribute('data-attribution-paste-event-id'),
            originalPasteContent: el.getAttribute('data-attribution-original-paste'),
            editDistance: el.getAttribute('data-attribution-edit-distance')
              ? parseFloat(el.getAttribute('data-attribution-edit-distance')!)
              : null,
            createdAt: el.getAttribute('data-attribution-created-at')
              ? parseInt(el.getAttribute('data-attribution-created-at')!, 10)
              : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-attribution-color': HTMLAttributes['color'],
        'data-attribution-confidence': HTMLAttributes['confidence'],
        'data-attribution-scoring-mode': HTMLAttributes['scoringMode'],
        'data-attribution-paste-event-id': HTMLAttributes['pasteEventId'],
        'data-attribution-original-paste': HTMLAttributes['originalPasteContent'],
        'data-attribution-edit-distance': HTMLAttributes['editDistance'],
        'data-attribution-created-at': HTMLAttributes['createdAt'],
      }),
      0,
    ];
  },
});
