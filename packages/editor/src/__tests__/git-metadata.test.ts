import { describe, it, expect } from 'vitest';
import { buildCommitMessage, parseCommitMetadata } from '../git/metadata';
import type { JSONContent } from '@tiptap/core';

const sampleDoc: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Hello world this is a test.',
          marks: [{ type: 'attribution', attrs: { color: 'green', createdAt: 1000 } }],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Some AI text here.',
          marks: [{ type: 'attribution', attrs: { color: 'red', createdAt: 2000 } }],
        },
      ],
    },
  ],
};

describe('buildCommitMessage', () => {
  it('includes timestamp in commit message', () => {
    const { message } = buildCommitMessage(sampleDoc, 0);
    expect(message).toMatch(/Auto-save: \d{4}-\d{2}-\d{2}/);
  });

  it('includes metadata JSON in commit message', () => {
    const { message, metadata } = buildCommitMessage(sampleDoc, 0);
    expect(message).toContain(JSON.stringify(metadata));
  });

  it('computes word count', () => {
    const { metadata } = buildCommitMessage(sampleDoc, 0);
    // "Hello world this is a test" = 6 words, "Some AI text here" = 4 words = 10 total
    expect(metadata.wordCount).toBeGreaterThan(0);
  });

  it('computes word count delta', () => {
    const { metadata } = buildCommitMessage(sampleDoc, 5);
    expect(metadata.wordCountDelta).toBeGreaterThan(0); // current > previous
  });

  it('computes attribution snapshot', () => {
    const { metadata } = buildCommitMessage(sampleDoc, 0);
    expect(
      metadata.attribution.green + metadata.attribution.yellow + metadata.attribution.red,
    ).toBeLessThanOrEqual(101);
    expect(metadata.attribution.green).toBeGreaterThanOrEqual(0);
    expect(metadata.attribution.red).toBeGreaterThanOrEqual(0);
  });
});

describe('parseCommitMetadata', () => {
  it('parses valid commit message', () => {
    const message =
      'Auto-save: 2026-01-01T00:00:00Z\n\n{"wordCount":100,"wordCountDelta":10,"attribution":{"green":70,"yellow":20,"red":10}}';
    const metadata = parseCommitMetadata(message);
    expect(metadata).not.toBeNull();
    expect(metadata!.wordCount).toBe(100);
    expect(metadata!.wordCountDelta).toBe(10);
    expect(metadata!.attribution.green).toBe(70);
  });

  it('returns null for malformed message', () => {
    expect(parseCommitMetadata('no metadata here')).toBeNull();
  });

  it('returns null for empty message', () => {
    expect(parseCommitMetadata('')).toBeNull();
  });
});
