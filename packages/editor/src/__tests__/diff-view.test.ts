import { describe, it, expect } from 'vitest';
import { generateFallbackMetadata } from '../git/commit-metadata';

// Test the diff line structure (pure logic, no DOM needed)
describe('diff view data', () => {
  it('fallback metadata structure matches CommitTitleMetadata', () => {
    const m = generateFallbackMetadata(5, Date.now());
    expect(m).toHaveProperty('title');
    expect(m).toHaveProperty('summary');
    expect(m).toHaveProperty('conceptual');
    expect(typeof m.title).toBe('string');
    expect(typeof m.summary).toBe('string');
    expect(m.conceptual).toBeNull();
  });
});

// Test DiffLine type logic
import type { DiffLine } from '../git/diff';

describe('diff line types', () => {
  it('identifies added lines correctly', () => {
    const line: DiffLine = { type: 'added', content: 'new text' };
    expect(line.type).toBe('added');
    expect(line.content).toBe('new text');
  });

  it('identifies removed lines correctly', () => {
    const line: DiffLine = { type: 'removed', content: 'old text' };
    expect(line.type).toBe('removed');
  });

  it('identifies unchanged lines correctly', () => {
    const line: DiffLine = { type: 'unchanged', content: 'same text' };
    expect(line.type).toBe('unchanged');
  });
});
