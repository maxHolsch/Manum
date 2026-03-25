/**
 * T122: Text Segmentation into Sentence-Level Chunks
 */

export interface Chunk {
  text: string;
  startOffset: number;
  endOffset: number;
}

// Common abbreviations that should not be treated as sentence-ending periods
const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'vs',
  'etc',
  'e.g',
  'i.e',
  'fig',
  'est',
  'dept',
  'approx',
  'inc',
  'corp',
  'ltd',
  'co',
  'st',
  'ave',
  'blvd',
  'jan',
  'feb',
  'mar',
  'apr',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]);

function isAbbreviation(word: string): boolean {
  return ABBREVIATIONS.has(word.toLowerCase().replace(/\.$/, ''));
}

/**
 * Segment text into sentence-level chunks. Returns an array of Chunks with
 * their character positions in the original text.
 */
export function segmentText(text: string): Chunk[] {
  if (!text.trim()) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '.' || ch === '!' || ch === '?') {
      // Check for sentence boundary: punctuation followed by whitespace + uppercase
      const afterPunct = i + 1;

      // Skip any closing quotes or parentheses after the punctuation
      let closeIdx = afterPunct;
      while (
        closeIdx < text.length &&
        (text[closeIdx] === '"' || text[closeIdx] === ')' || text[closeIdx] === "'")
      ) {
        closeIdx++;
      }

      // Check if followed by whitespace then uppercase letter
      if (
        closeIdx < text.length &&
        /\s/.test(text[closeIdx]) &&
        closeIdx + 1 < text.length &&
        /[A-Z]/.test(text[closeIdx + 1])
      ) {
        // Check if the word before the period is an abbreviation
        const wordBefore = extractWordBefore(text, i);
        if (!isAbbreviation(wordBefore)) {
          const sentenceText = text.slice(start, closeIdx).trim();
          if (sentenceText) {
            chunks.push({
              text: sentenceText,
              startOffset: start,
              endOffset: closeIdx,
            });
          }
          // Skip whitespace to find the start of next sentence
          let nextStart = closeIdx;
          while (nextStart < text.length && /\s/.test(text[nextStart])) {
            nextStart++;
          }
          start = nextStart;
          i = nextStart;
          continue;
        }
      }
    }

    i++;
  }

  // Remaining text after the last sentence boundary
  const remaining = text.slice(start).trim();
  if (remaining) {
    chunks.push({
      text: remaining,
      startOffset: start,
      endOffset: text.length,
    });
  }

  return chunks;
}

function extractWordBefore(text: string, punctPos: number): string {
  const end = punctPos;
  let start = end - 1;
  while (start >= 0 && /[a-zA-Z.]/.test(text[start])) {
    start--;
  }
  return text.slice(start + 1, end);
}
