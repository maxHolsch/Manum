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
  matchedAiEntries: Array<{
    aiMessageId: string;
    overlapScore: number;
    method: string;
    aiTimestamp: number;
  }> | null;
  ideaOverlapScore: number | null;
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
      matchedAiEntries: { default: null },
      ideaOverlapScore: { default: null },
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
            ideaOverlapScore: el.getAttribute('data-attribution-idea-overlap-score')
              ? parseFloat(el.getAttribute('data-attribution-idea-overlap-score')!)
              : null,
            matchedAiEntries: el.getAttribute('data-attribution-matched-ai-entries')
              ? JSON.parse(el.getAttribute('data-attribution-matched-ai-entries')!)
              : null,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const styleAttrs: Record<string, string> = {};
    if (
      HTMLAttributes['color'] === 'yellow' &&
      HTMLAttributes['editDistance'] !== null &&
      HTMLAttributes['editDistance'] !== undefined
    ) {
      const dist = HTMLAttributes['editDistance'] as number;
      const clamped = Math.max(0.2, Math.min(0.7, dist));
      const opacity = (0.4 - ((clamped - 0.2) / 0.5) * 0.3).toFixed(3);
      styleAttrs['style'] = `--attribution-yellow-opacity: ${opacity}`;
    }
    return [
      'span',
      mergeAttributes(
        {
          'data-attribution-color': HTMLAttributes['color'],
          'data-attribution-confidence': HTMLAttributes['confidence'],
          'data-attribution-scoring-mode': HTMLAttributes['scoringMode'],
          'data-attribution-paste-event-id': HTMLAttributes['pasteEventId'],
          'data-attribution-original-paste': HTMLAttributes['originalPasteContent'],
          'data-attribution-edit-distance': HTMLAttributes['editDistance'],
          'data-attribution-created-at': HTMLAttributes['createdAt'],
          'data-attribution-idea-overlap-score': HTMLAttributes['ideaOverlapScore'],
          'data-attribution-matched-ai-entries': HTMLAttributes['matchedAiEntries']
            ? JSON.stringify(HTMLAttributes['matchedAiEntries'])
            : null,
        },
        styleAttrs,
      ),
      0,
    ];
  },
});
