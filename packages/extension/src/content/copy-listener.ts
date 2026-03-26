// Copy event listener for Claude.ai pages.
// Captures text copied from assistant messages and returns a partial CopyRecord.

import { isAssistantMessage, getMessageId } from './selectors.js';
import type { CopyRecord } from '@manum/shared';

export type CopyRecordHandler = (record: Omit<CopyRecord, 'id'>) => void;

let activeHandler: CopyRecordHandler | null = null;

function handleCopy(_event: Event): void {
  if (!activeHandler) return;

  const selection = window.getSelection();
  if (!selection) return;

  const selectedText = selection.toString();
  if (!selectedText) return;

  // Walk up from the selection anchor to find the containing message
  const anchorNode = selection.anchorNode;
  if (!anchorNode) return;

  const anchorElement =
    anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode.parentElement;

  if (!anchorElement) return;

  // Only record copies from assistant messages
  if (!isAssistantMessage(anchorElement)) return;

  // Find the nearest assistant message element for ID extraction
  const messageEl = anchorElement.hasAttribute('data-is-streaming')
    ? anchorElement
    : (anchorElement.closest('[data-is-streaming]') ?? anchorElement);

  const record: Omit<CopyRecord, 'id'> = {
    selectedText,
    sourceMessageId: getMessageId(messageEl),
    timestamp: Date.now(),
  };

  activeHandler(record);
}

/**
 * Registers the copy event listener on the document.
 * Calls `onCopy` whenever text is copied from an assistant message.
 */
export function startCopyListener(onCopy: CopyRecordHandler): void {
  activeHandler = onCopy;
  document.addEventListener('copy', handleCopy);
  console.debug('[Manum] Copy listener registered');
}

/**
 * Removes the copy event listener.
 */
export function stopCopyListener(): void {
  document.removeEventListener('copy', handleCopy);
  activeHandler = null;
}
