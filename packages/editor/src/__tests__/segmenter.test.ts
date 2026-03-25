import { describe, it, expect } from 'vitest';
import { segmentText } from '../attribution/segmenter';

describe('segmentText', () => {
  it('returns empty array for empty text', () => {
    expect(segmentText('')).toEqual([]);
    expect(segmentText('   ')).toEqual([]);
  });

  it('returns single chunk for single sentence', () => {
    const chunks = segmentText('Hello world.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('Hello world.');
  });

  it('splits multiple sentences correctly', () => {
    const text = 'The cat sat on the mat. The dog ran away. Everyone was happy.';
    const chunks = segmentText(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].text).toContain('The cat sat on the mat.');
  });

  it('handles exclamation marks', () => {
    const text = 'This is great! Let us continue. More to say.';
    const chunks = segmentText(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('handles question marks', () => {
    const text = 'Is this working? Yes it is. Good to know.';
    const chunks = segmentText(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('does not split on abbreviations like Mr., Dr., etc.', () => {
    const text = 'Dr. Smith said hello. He was friendly.';
    const chunks = segmentText(text);
    // "Dr. Smith said hello." should be one sentence
    const firstChunk = chunks[0];
    expect(firstChunk.text).toContain('Dr. Smith said hello.');
  });

  it('tracks start and end offsets correctly', () => {
    const text = 'First sentence. Second sentence.';
    const chunks = segmentText(text);
    if (chunks.length >= 2) {
      expect(chunks[0].startOffset).toBe(0);
      expect(chunks[0].endOffset).toBeGreaterThan(0);
      expect(chunks[1].startOffset).toBeGreaterThan(chunks[0].endOffset - 1);
    }
  });

  it('returns full text as one chunk when no sentence boundary', () => {
    const text = 'no period here no capital follows';
    const chunks = segmentText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
  });
});
