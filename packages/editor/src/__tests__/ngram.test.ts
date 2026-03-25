import { describe, it, expect } from 'vitest';
import { extractNgrams, computeNgramOverlap, computeBestNgramOverlap } from '../attribution/ngram';

describe('extractNgrams', () => {
  it('extracts 3-grams from text', () => {
    const ngrams = extractNgrams('the quick brown fox jumps', 3);
    // After stopword removal: "quick brown fox jumps" → ["quick brown fox", "brown fox jumps"]
    expect(ngrams.size).toBeGreaterThan(0);
  });

  it('filters stopwords', () => {
    const ngrams = extractNgrams('the a an is are', 3);
    // All stopwords — no meaningful ngrams
    expect(ngrams.size).toBe(0);
  });

  it('returns empty set for short text with fewer words than n', () => {
    const ngrams = extractNgrams('hello world', 3);
    expect(ngrams.size).toBe(0);
  });

  it('generates ngrams in lowercase', () => {
    const ngrams = extractNgrams('Quick Brown Fox Jumps', 3);
    for (const ngram of ngrams) {
      expect(ngram).toBe(ngram.toLowerCase());
    }
  });
});

describe('computeNgramOverlap', () => {
  it('returns 1.0 for identical text', () => {
    const text = 'machine learning algorithms process large datasets efficiently';
    expect(computeNgramOverlap(text, text)).toBeCloseTo(1.0, 1);
  });

  it('returns 0.0 for completely unrelated text', () => {
    const user = 'the quick brown fox jumps';
    const ai = 'completely different topic altogether here';
    const score = computeNgramOverlap(user, ai);
    expect(score).toBeLessThan(0.2);
  });

  it('returns positive score for partially overlapping text', () => {
    const user = 'neural networks process information through layers of neurons';
    const ai = 'deep neural networks process information using multiple layers';
    const score = computeNgramOverlap(user, ai);
    expect(score).toBeGreaterThan(0);
  });

  it('returns 0 for empty texts', () => {
    expect(computeNgramOverlap('', 'some text here now')).toBe(0);
  });
});

describe('computeBestNgramOverlap', () => {
  it('finds best matching entry', () => {
    const userText = 'machine learning transforms data processing dramatically today';
    const entries = [
      { messageId: 'a', text: 'cooking recipes improve over time', timestamp: 100 },
      {
        messageId: 'b',
        text: 'machine learning transforms data processing rapidly',
        timestamp: 50,
      },
    ];
    const result = computeBestNgramOverlap(userText, entries);
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedEntry?.messageId).toBe('b');
  });

  it('returns score 0 for empty entries', () => {
    const result = computeBestNgramOverlap('some text here now', []);
    expect(result.score).toBe(0);
    expect(result.matchedEntry).toBeNull();
  });
});
