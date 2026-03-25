/**
 * T163, T164: LLM-generated commit metadata with fallback
 */

import { getDB, type CommitMetadataRecord } from '../storage/db';
import { getApiKey } from '../attribution/llm-judge/api-client';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export interface CommitTitleMetadata {
  title: string;
  summary: string;
  conceptual: string | null;
}

/** T164: Generate fallback metadata from word count delta and timestamp */
export function generateFallbackMetadata(
  wordCountDelta: number,
  timestamp: number,
): CommitTitleMetadata {
  const action =
    wordCountDelta >= 0
      ? `Added ${wordCountDelta} words`
      : `Removed ${Math.abs(wordCountDelta)} words`;
  return {
    title: action,
    summary: `${action} at ${new Date(timestamp).toLocaleTimeString()}`,
    conceptual: null,
  };
}

/** T163: Generate LLM commit metadata from diff text */
export async function generateCommitMetadata(
  diffText: string,
  wordCountDelta: number,
  timestamp: number,
): Promise<CommitTitleMetadata> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return generateFallbackMetadata(wordCountDelta, timestamp);
  }

  const prompt = `Given this document diff, generate:
1. A short title (5-8 words) describing what changed
2. A one-sentence summary
3. A brief conceptual description of the change

Diff:
${diffText.slice(0, 2000)}

Respond with JSON only: { "title": "...", "summary": "...", "conceptual": "..." }`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      return generateFallbackMetadata(wordCountDelta, timestamp);
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text: string }>;
    };
    const textContent = data.content?.find((c) => c.type === 'text')?.text ?? '';

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return generateFallbackMetadata(wordCountDelta, timestamp);

    const parsed = JSON.parse(jsonMatch[0]) as Partial<CommitTitleMetadata>;
    return {
      title: parsed.title ?? generateFallbackMetadata(wordCountDelta, timestamp).title,
      summary: parsed.summary ?? '',
      conceptual: parsed.conceptual ?? null,
    };
  } catch {
    return generateFallbackMetadata(wordCountDelta, timestamp);
  }
}

export async function storeCommitMetadata(
  oid: string,
  metadata: CommitTitleMetadata,
): Promise<void> {
  try {
    const db = await getDB();
    const record: CommitMetadataRecord = {
      oid,
      title: metadata.title,
      summary: metadata.summary,
      conceptual: metadata.conceptual,
      generatedAt: Date.now(),
    };
    await db.put('commit_metadata', record);
  } catch {
    // Non-fatal
  }
}

export async function getCommitMetadata(oid: string): Promise<CommitMetadataRecord | null> {
  try {
    const db = await getDB();
    return (await db.get('commit_metadata', oid)) ?? null;
  } catch {
    return null;
  }
}
