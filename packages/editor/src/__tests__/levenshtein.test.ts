import { describe, it, expect } from 'vitest';
import { levenshtein, normalizedEditDistance } from '../attribution/levenshtein';

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('hello', 'hello')).toBe(0);
  });
  it('returns string length for empty string', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });
  it('returns 0 for two empty strings', () => {
    expect(levenshtein('', '')).toBe(0);
  });
  it('computes simple substitution', () => {
    expect(levenshtein('cat', 'bat')).toBe(1);
  });
  it('computes insertion', () => {
    expect(levenshtein('cat', 'cats')).toBe(1);
  });
  it('computes deletion', () => {
    expect(levenshtein('cats', 'cat')).toBe(1);
  });
  it('computes complex edit', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
  });
});

describe('normalizedEditDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(normalizedEditDistance('hello', 'hello')).toBe(0);
  });
  it('returns 0 for two empty strings', () => {
    expect(normalizedEditDistance('', '')).toBe(0);
  });
  it('returns 1 for completely different strings of same length', () => {
    expect(normalizedEditDistance('abc', 'xyz')).toBe(1);
  });
  it('normalizes by max length', () => {
    // 'a' -> 'ab': distance 1, max 2 => 0.5
    expect(normalizedEditDistance('a', 'ab')).toBeCloseTo(0.5);
  });
  it('returns value between 0 and 1', () => {
    const d = normalizedEditDistance('hello world', 'bye');
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThanOrEqual(1);
  });
});
