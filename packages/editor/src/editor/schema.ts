import StarterKit from '@tiptap/starter-kit';
import type { Extensions } from '@tiptap/react';
import { GreenTypingMark } from './extensions/green-typing';

/**
 * Core document schema extensions.
 * Uses StarterKit which provides paragraph as primary content block.
 * Exported for reuse when adding attribution marks and branch nodes.
 */
export const coreExtensions: Extensions = [
  GreenTypingMark,
  StarterKit.configure({
    bold: {},
    italic: {},
    heading: { levels: [1, 2, 3] },
    undoRedo: {},
    hardBreak: {},
    horizontalRule: {},
    blockquote: {},
    bulletList: {},
    orderedList: {},
    listItem: {},
    code: {},
    codeBlock: {},
    strike: {},
  }),
];
