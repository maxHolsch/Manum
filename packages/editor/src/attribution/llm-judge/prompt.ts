/**
 * T127: LLM Judge evaluation prompt template
 */

export interface LLMJudgeRequest {
  userChunk: string;
  aiEntry: string;
}

export interface LLMJudgeResponse {
  score: number;
  classification: 'green' | 'yellow' | 'red';
  reasoning: string;
}

export function buildEvaluationPrompt(userChunk: string, aiEntry: string): string {
  return `You are evaluating text similarity. Given a user-written text and an AI-generated text, rate their similarity from 0 to 1 and classify as green (independent), yellow (AI-influenced), or red (near-identical).

User text: "${userChunk}"
AI text: "${aiEntry}"

Respond with JSON: { "score": 0.X, "classification": "green|yellow|red", "reasoning": "brief explanation" }`;
}

export function parseEvaluationResponse(responseText: string): LLMJudgeResponse {
  // Try to extract JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in LLM response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const score = typeof parsed['score'] === 'number' ? parsed['score'] : 0;
  const classification = ['green', 'yellow', 'red'].includes(parsed['classification'] as string)
    ? (parsed['classification'] as 'green' | 'yellow' | 'red')
    : 'green';
  const reasoning = typeof parsed['reasoning'] === 'string' ? parsed['reasoning'] : '';

  return { score, classification, reasoning };
}
