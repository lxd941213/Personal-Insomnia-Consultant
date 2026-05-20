import { normalizeAiResponse, safeFallbackResponse } from '../src/domain/aiResponse';
import { triageSafety } from '../src/domain/safety';
import { buildPersonalizationProfile } from '../src/domain/personalization';
import type { AssessmentResult, ChatMessage, ConsultationDiarySummary, ProgramPromptContext, SleepProfile, SleepScenario } from '../src/domain/types';
import { buildSleepAdvisorPrompt } from './prompt';
import { callAiProvider } from './provider';

const MAX_MESSAGE_LENGTH = 4096;

function parseProviderJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    for (let start = candidate.indexOf('{'); start !== -1; start = candidate.indexOf('{', start + 1)) {
      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let index = start; index < candidate.length; index += 1) {
        const char = candidate[index];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\' && inString) {
          escaped = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (char === '{') depth += 1;
        if (char === '}') depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(candidate.slice(start, index + 1));
          } catch {
            break;
          }
        }
      }
    }
    throw new Error('Provider response did not contain JSON');
  }
}

export interface ChatInput {
  profile: SleepProfile;
  message: string;
  history?: ChatMessage[];
  assessmentResult?: AssessmentResult;
  scenario?: SleepScenario;
  diarySummary?: ConsultationDiarySummary;
  programContext?: ProgramPromptContext;
}

export async function processChat(input: ChatInput): Promise<{ status: number; body: unknown }> {
  if (!input.profile || typeof input.message !== 'string' || input.message.trim().length === 0) {
    return { status: 400, body: { error: 'Profile and message are required' } };
  }

  if (input.message.length > MAX_MESSAGE_LENGTH) {
    return { status: 400, body: { error: 'Message too long' } };
  }

  const triage = triageSafety({
    message: input.message,
    profile: input.profile,
    assessmentResult: input.assessmentResult ?? null,
    diaryNotes: input.diarySummary?.recentNotes,
  });

  if (triage.shouldBlockAi) {
    return { status: 200, body: safeFallbackResponse(triage.careNotice ?? undefined) };
  }

  try {
    const personalization = buildPersonalizationProfile({
      profile: input.profile,
      assessmentResult: input.assessmentResult ?? null,
      diarySummary: input.diarySummary,
    });

    const promptProgramContext = input.programContext
      ? { ...input.programContext, safetyTriage: triage }
      : undefined;

    if (
      personalization.careAdvice.shouldSeekCare &&
      personalization.careAdvice.urgency === 'urgent' &&
      triage.level !== 'needs_care'
    ) {
      return { status: 200, body: safeFallbackResponse() };
    }

    const prompt = buildSleepAdvisorPrompt(input.profile, input.message, input.history || [], input.assessmentResult, input.scenario, personalization, promptProgramContext, input.diarySummary, 'user', triage);
    const providerResult = await callAiProvider(prompt);
    const parsed = parseProviderJson(providerResult.content);
    return { status: 200, body: normalizeAiResponse(parsed) };
  } catch (error) {
    console.error('Chat handler error:', error instanceof Error ? error.message : String(error));
    return { status: 200, body: safeFallbackResponse() };
  }
}
