/**
 * T124: Keyword/Entity Overlap Detection
 *
 * Extract proper nouns, technical terms, and named entities as a secondary
 * signal for idea overlap detection.
 */

/**
 * Extract keywords/entities from text:
 * - Capitalized words NOT at sentence start
 * - CamelCase words
 * - Words containing digits
 * - Hyphenated compound words
 */
export function extractKeywords(text: string): Set<string> {
  const keywords = new Set<string>();

  // Split into sentences to identify sentence-start positions
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[.,;:!?'"()[\]{}]/g, '');
      if (!word) continue;

      // Skip the first word of each sentence (likely capitalized due to grammar)
      const isFirstWord = i === 0;

      if (isCapitalized(word) && !isFirstWord) {
        keywords.add(word.toLowerCase());
      } else if (isCamelCase(word)) {
        keywords.add(word);
      } else if (containsDigits(word)) {
        keywords.add(word.toLowerCase());
      } else if (isHyphenatedCompound(word)) {
        keywords.add(word.toLowerCase());
      }
    }
  }

  return keywords;
}

function isCapitalized(word: string): boolean {
  return word.length > 1 && /^[A-Z][a-z]/.test(word);
}

function isCamelCase(word: string): boolean {
  return /^[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*$/.test(word);
}

function containsDigits(word: string): boolean {
  return /\d/.test(word) && word.length > 1;
}

function isHyphenatedCompound(word: string): boolean {
  return word.includes('-') && word.split('-').every((part) => part.length > 1);
}

/**
 * Compute keyword overlap between user text and AI entry text.
 * Returns 0-1: fraction of user keywords that appear in AI text.
 */
export function computeKeywordOverlap(userText: string, aiText: string): number {
  const userKeywords = extractKeywords(userText);
  if (userKeywords.size === 0) return 0;

  const aiKeywords = extractKeywords(aiText);

  let intersection = 0;
  for (const kw of userKeywords) {
    if (aiKeywords.has(kw)) intersection++;
  }

  return intersection / userKeywords.size;
}
