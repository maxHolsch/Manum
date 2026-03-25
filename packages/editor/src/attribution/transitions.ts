import type { Editor } from '@tiptap/core';
import type { AttributionColor } from '../editor/marks/attribution';

export interface AttributionMarkAttrs {
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

export function updateAttributionMark(
  editor: Editor,
  from: number,
  to: number,
  attrs: Partial<AttributionMarkAttrs>,
): void {
  editor.chain().setTextSelection({ from, to }).updateAttributes('attribution', attrs).run();
}

export function getColorFromDistance(dist: number): AttributionColor {
  if (dist >= 0.7) return 'green';
  if (dist >= 0.2) return 'yellow';
  return 'red';
}

export function computeYellowOpacity(editDistance: number): number {
  // opacity varies from 0.4 (at 20%) to 0.1 (at 70%)
  const clamped = Math.max(0.2, Math.min(0.7, editDistance));
  return 0.4 - ((clamped - 0.2) / 0.5) * 0.3;
}
