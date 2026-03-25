import { describe, it, expect } from 'vitest';
import { extractKeywords, computeKeywordOverlap } from '../attribution/keywords';

describe('extractKeywords', () => {
  it('extracts capitalized words (not at sentence start)', () => {
    const kws = extractKeywords('Hello, my friend Alice went to Paris yesterday.');
    expect(kws.has('alice')).toBe(true);
    expect(kws.has('paris')).toBe(true);
  });

  it('does not include sentence-starting capitals as keywords', () => {
    const kws = extractKeywords('The cat sat down. Another cat arrived.');
    // "The" and "Another" start sentences — should not be keywords
    expect(kws.has('the')).toBe(false);
    expect(kws.has('another')).toBe(false);
  });

  it('extracts camelCase words', () => {
    const kws = extractKeywords('The function useMemo optimizes performance.');
    expect(kws.has('useMemo')).toBe(true);
  });

  it('extracts words containing digits', () => {
    const kws = extractKeywords('The GPT4 model is impressive these days.');
    expect(kws.has('gpt4')).toBe(true);
  });

  it('extracts hyphenated compounds', () => {
    const kws = extractKeywords('This state-of-the-art technology is useful.');
    // Should find hyphenated words
    const kwsArr = Array.from(kws);
    expect(kwsArr.some((k) => k.includes('-'))).toBe(true);
  });

  it('returns empty set for plain common text', () => {
    const kws = extractKeywords('the cat sat on the mat and then left');
    expect(kws.size).toBe(0);
  });
});

describe('computeKeywordOverlap', () => {
  it('returns 1.0 when all user keywords appear in AI text', () => {
    const userText = 'My friend Alice visited Paris last year.';
    const aiText = 'Alice is from Paris and loves art galleries.';
    const score = computeKeywordOverlap(userText, aiText);
    expect(score).toBeGreaterThan(0);
  });

  it('returns 0 for texts with no shared keywords', () => {
    const score = computeKeywordOverlap('plain text with no keywords', 'also plain boring text');
    expect(score).toBe(0);
  });

  it('returns 0 when user text has no keywords', () => {
    const score = computeKeywordOverlap('the cat sat here', 'Alice visited Paris today');
    expect(score).toBe(0);
  });

  it('returns value between 0 and 1', () => {
    const score = computeKeywordOverlap(
      'JavaScript developers use React framework daily',
      'React is popular among JavaScript engineers',
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
