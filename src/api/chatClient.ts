import { normalizeAiResponse } from '../domain/aiResponse';
import type { AssessmentResult, AiResponse, ChatMessage, SleepProfile, SleepScenario } from '../domain/types';

interface SendChatMessageInput {
  profile: SleepProfile;
  message: string;
  history: ChatMessage[];
  assessmentResult?: AssessmentResult | null;
  scenario?: SleepScenario | null;
}

export async function sendChatMessage(input: SendChatMessageInput): Promise<AiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Chat API failed with ${response.status}`);
  }

  return normalizeAiResponse(await response.json());
}