import type { AiResponse, Suggestion } from './types';
import { defaultCareNotice, defaultDisclaimer } from './safety';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function normalizeSuggestions(value: unknown): Suggestion[] | null {
  if (isStringArray(value)) {
    return value.map((item) => ({ title: item, detail: item }));
  }

  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Suggestion).title === 'string' &&
        typeof (item as Suggestion).detail === 'string',
    )
  ) ? value : null;
}

export function safeFallbackResponse(careNotice = defaultCareNotice): AiResponse {
  return {
    riskLevel: 'high_risk',
    summary: '无法生成可靠的个性化回复',
    possibleFactors: ['存在需要专业评估的风险信号'],
    suggestions: [{ title: '优先寻求专业支持', detail: careNotice }],
    nextQuestions: [],
    seekCareNotice: careNotice,
    disclaimer: defaultDisclaimer,
  };
}

export function normalizeAiResponse(payload: unknown): AiResponse {
  if (!payload || typeof payload !== 'object') {
    return safeFallbackResponse();
  }

  const input = payload as Partial<AiResponse>;
  const suggestions = normalizeSuggestions(input.suggestions);
  if (
    (input.riskLevel !== 'normal' && input.riskLevel !== 'high_risk') ||
    typeof input.summary !== 'string' ||
    !isStringArray(input.possibleFactors) ||
    !suggestions ||
    !isStringArray(input.nextQuestions)
  ) {
    return safeFallbackResponse();
  }

  return {
    riskLevel: input.riskLevel,
    summary: input.summary,
    possibleFactors: input.possibleFactors,
    suggestions,
    nextQuestions: input.nextQuestions,
    seekCareNotice: input.riskLevel === 'high_risk' ? input.seekCareNotice || defaultCareNotice : input.seekCareNotice ?? null,
    disclaimer: input.disclaimer || defaultDisclaimer,
  };
}
