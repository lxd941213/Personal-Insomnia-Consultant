import { normalizeKnowledgeResponse } from '../domain/knowledge';
import type { AssessmentResult, KnowledgeResponse, SleepProfile, SleepScenario } from '../domain/types';

export interface GenerateKnowledgeCardsInput {
  profile: SleepProfile;
  scenario: SleepScenario;
  assessmentResult?: AssessmentResult | null;
}

export async function generateKnowledgeCards(
  input: GenerateKnowledgeCardsInput,
): Promise<KnowledgeResponse> {
  const response = await fetch('/api/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('知识卡片服务暂时不可用，请稍后再试。');
  }

  return normalizeKnowledgeResponse(await response.json());
}