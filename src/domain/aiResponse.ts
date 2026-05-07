import type { AiResponse, Suggestion } from './types';
import { defaultCareNotice, defaultDisclaimer } from './safety';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSuggestionArray(value: unknown): value is Suggestion[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Suggestion).title === 'string' &&
        typeof (item as Suggestion).detail === 'string',
    )
  );
}

export function safeFallbackResponse(): AiResponse {
  return {
    riskLevel: 'high_risk',
    summary: 'We were unable to generate a reliable personalized response.',
    possibleFactors: [],
    suggestions: [],
    nextQuestions: [],
    seekCareNotice: defaultCareNotice,
    disclaimer: defaultDisclaimer,
  };
}

export function normalizeAiResponse(payload: unknown): AiResponse {
  if (!payload || typeof payload !== 'object') {
    return safeFallbackResponse();
  }

  const input = payload as Partial<AiResponse>;
  if (
    (input.riskLevel !== 'normal' && input.riskLevel !== 'high_risk') ||
    typeof input.summary !== 'string' ||
    !isStringArray(input.possibleFactors) ||
    !isSuggestionArray(input.suggestions) ||
    !isStringArray(input.nextQuestions)
  ) {
    return safeFallbackResponse();
  }

  return {
    riskLevel: input.riskLevel,
    summary: input.summary,
    possibleFactors: input.possibleFactors,
    suggestions: input.suggestions,
    nextQuestions: input.nextQuestions,
    seekCareNotice: input.riskLevel === 'high_risk' ? input.seekCareNotice || defaultCareNotice : input.seekCareNotice ?? null,
    disclaimer: input.disclaimer || defaultDisclaimer,
  };
}
