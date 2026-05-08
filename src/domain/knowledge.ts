import type { KnowledgeCard, KnowledgeResponse, SleepScenario, Suggestion } from './types';
import { defaultCareNotice, defaultDisclaimer } from './safety';
import { isSleepScenario } from './scenarios';

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isSuggestionArray(value: unknown): value is Suggestion[] {
  return Array.isArray(value) && value.every((item) =>
    item &&
    typeof item === 'object' &&
    typeof (item as Suggestion).title === 'string' &&
    typeof (item as Suggestion).detail === 'string'
  );
}

export function isKnowledgeCard(value: unknown): value is KnowledgeCard {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as KnowledgeCard).title === 'string' &&
    typeof (value as KnowledgeCard).summary === 'string' &&
    isStringArray((value as KnowledgeCard).keyPoints) &&
    isStringArray((value as KnowledgeCard).misconceptions) &&
    isSuggestionArray((value as KnowledgeCard).actions) &&
    ((value as KnowledgeCard).safetyNote === null || typeof (value as KnowledgeCard).safetyNote === 'string') &&
    isStringArray((value as KnowledgeCard).followUpQuestions)
  );
}

export function fallbackKnowledgeResponse(
  scenario: SleepScenario = 'wellness_regulation',
  safetyNote = '如果睡眠问题严重、持续加重，或伴随明显白天功能受损，建议寻求专业评估，例如专业医生或睡眠门诊。',
): KnowledgeResponse {
  const safeScenario = isSleepScenario(scenario) ? scenario : 'wellness_regulation';
  const defaultCard: KnowledgeCard = {
    title: '暂时无法生成可靠知识卡片',
    summary: '当前内容生成不稳定。为了安全起见，先提供保守的健康管理提醒，并建议在症状明显或持续时寻求专业评估。',
    keyPoints: ['保持规律起床时间', '避免自行调整药物或剂量', '记录睡眠变化和白天影响'],
    misconceptions: ['不要把 AI 内容当作诊断', '不要依赖酒精或自行加量用药来助眠'],
    actions: [
      { title: '记录一周睡眠', detail: '记录上床时间、入睡估计时间、夜醒次数、起床时间和白天精神状态。' },
      { title: '优先降低风险', detail: '如有呼吸暂停、自伤想法、胸痛、药物依赖等信号，请及时寻求专业帮助。' },
    ],
    safetyNote,
    followUpQuestions: ['我应该记录哪些睡眠信息？', '什么情况下需要去睡眠门诊？'],
  };

  return {
    scenario: safeScenario,
    generatedAt: new Date().toISOString(),
    cards: [defaultCard],
    disclaimer: defaultCareNotice + ' ' + defaultDisclaimer,
  };
}

export function normalizeKnowledgeResponse(payload: unknown): KnowledgeResponse {
  if (!payload || typeof payload !== 'object') {
    return fallbackKnowledgeResponse();
  }

  const input = payload as Partial<KnowledgeResponse>;
  const scenario = isSleepScenario(input.scenario) ? input.scenario : 'wellness_regulation';

  if (!Array.isArray(input.cards)) {
    return fallbackKnowledgeResponse(scenario);
  }

  const validCards = input.cards.filter(
    (card): card is KnowledgeCard =>
      isKnowledgeCard(card) && card.title.length > 0 && card.summary.length > 0,
  );

  if (validCards.length === 0) {
    return fallbackKnowledgeResponse(scenario);
  }

  return {
    scenario,
    cards: validCards,
    disclaimer: input.disclaimer || defaultDisclaimer,
    generatedAt: typeof input.generatedAt === 'string' ? input.generatedAt : new Date().toISOString(),
  };
}
