import type { KnowledgeCard, KnowledgeResponse, SleepScenario } from './types';
import { defaultCareNotice, defaultDisclaimer } from './safety';

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isSuggestionArray(value: unknown): value is string[] {
  return isStringArray(value);
}

export function isKnowledgeCard(value: unknown): value is KnowledgeCard {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as KnowledgeCard).scenario === 'string' &&
    typeof (value as KnowledgeCard).title === 'string' &&
    typeof (value as KnowledgeCard).content === 'string' &&
    Array.isArray((value as KnowledgeCard).tags)
  );
}

export function fallbackKnowledgeResponse(scenario: SleepScenario): KnowledgeResponse {
  const defaultCard: KnowledgeCard = {
    scenario,
    title: '建议您咨询专业医生',
    content:
      '根据您的情况，建议及时寻求有执照的临床医生或心理健康专业人士的支持。本内容仅提供健康管理参考，不作为医疗诊断。',
    tags: ['专业支持', '健康建议'],
  };

  return {
    cards: [defaultCard],
    disclaimer: defaultCareNotice + ' ' + defaultDisclaimer,
  };
}

export function normalizeKnowledgeResponse(payload: unknown): KnowledgeResponse {
  if (!payload || typeof payload !== 'object') {
    const fallbackCard: KnowledgeCard = {
      scenario: 'wellness_regulation',
      title: '无法生成知识卡片',
      content: '无法处理服务器返回的数据，请稍后再试。',
      tags: ['系统提示'],
    };
    return {
      cards: [fallbackCard],
      disclaimer: defaultDisclaimer,
    };
  }

  const input = payload as Partial<KnowledgeResponse>;

  if (!Array.isArray(input.cards)) {
    const fallbackCard: KnowledgeCard = {
      scenario: 'wellness_regulation',
      title: '无法生成知识卡片',
      content: '无法处理服务器返回的数据，请稍后再试。',
      tags: ['系统提示'],
    };
    return {
      cards: [fallbackCard],
      disclaimer: input.disclaimer || defaultDisclaimer,
    };
  }

  const validCards = input.cards.filter(
    (card): card is KnowledgeCard =>
      isKnowledgeCard(card) && card.title.length > 0 && card.content.length > 0,
  );

  if (validCards.length === 0) {
    const fallbackCard: KnowledgeCard = {
      scenario: 'wellness_regulation',
      title: '知识卡片暂时不可用',
      content: '无法生成知识卡片，请稍后再试或联系专业医生获取个性化建议。',
      tags: ['系统提示'],
    };

    return {
      cards: [fallbackCard],
      disclaimer: input.disclaimer || defaultDisclaimer,
    };
  }

  return {
    cards: validCards,
    disclaimer: input.disclaimer || defaultDisclaimer,
  };
}