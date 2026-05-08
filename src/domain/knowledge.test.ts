import { describe, expect, it } from 'vitest';
import { normalizeKnowledgeResponse, fallbackKnowledgeResponse } from './knowledge';

describe('normalizeKnowledgeResponse', () => {
  it('keeps a valid structured card output', () => {
    const response = normalizeKnowledgeResponse({
      scenario: 'hard_to_fall_asleep',
      generatedAt: '2026-05-08T08:00:00.000Z',
      cards: [
        {
          title: '入睡困难的原因分析',
          summary: '入睡困难可能与心理压力、不良睡眠习惯有关。',
          keyPoints: ['睡前警觉升高'],
          misconceptions: ['躺得越久越容易睡着'],
          actions: [{ title: '离床放松', detail: '睡不着时先离开床做低刺激活动。' }],
          safetyNote: null,
          followUpQuestions: ['睡前是否会刷手机？'],
        },
      ],
      disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
    });

    expect(response.scenario).toBe('hard_to_fall_asleep');
    expect(response.cards).toHaveLength(1);
    expect(response.cards[0].title).toBe('入睡困难的原因分析');
    expect(response.cards[0].actions[0].title).toBe('离床放松');
    expect(response.disclaimer).toContain('健康管理参考');
  });

  it('returns Chinese fallback for malformed output', () => {
    const response = normalizeKnowledgeResponse({ cards: 'not an array' });

    expect(response.cards).toHaveLength(1);
    expect(response.cards[0].title).toBe('暂时无法生成可靠知识卡片');
    expect(response.disclaimer).toContain('健康管理参考');
  });

  it('returns fallback for empty cards array', () => {
    const response = normalizeKnowledgeResponse({ cards: [], disclaimer: '' });

    expect(response.cards).toHaveLength(1);
    expect(response.cards[0].title).toContain('知识卡片');
  });

  it('filters out cards without required fields', () => {
    const response = normalizeKnowledgeResponse({
      cards: [
        {
          title: '有效卡片',
          summary: '内容',
          keyPoints: ['要点'],
          misconceptions: ['误区'],
          actions: [{ title: '行动', detail: '细节' }],
          safetyNote: null,
          followUpQuestions: ['问题'],
        },
        { title: '', summary: '', keyPoints: [], misconceptions: [], actions: [] },
        {
          title: '另一个有效',
          summary: '内容2',
          keyPoints: ['要点2'],
          misconceptions: ['误区2'],
          actions: [{ title: '行动2', detail: '细节2' }],
          safetyNote: null,
          followUpQuestions: ['问题2'],
        },
      ],
      disclaimer: 'test',
      scenario: 'late_night_habit',
    });

    expect(response.cards).toHaveLength(2);
  });
});

describe('fallbackKnowledgeResponse', () => {
  it('returns conservative cards with safety note for high-risk contexts', () => {
    const response = fallbackKnowledgeResponse('hard_to_fall_asleep');

    expect(response.cards).toHaveLength(1);
    expect(response.scenario).toBe('hard_to_fall_asleep');
    expect(response.cards[0].title).toBe('暂时无法生成可靠知识卡片');
    expect(response.cards[0].safetyNote).toContain('专业评估');
    expect(response.disclaimer).toContain('专业支持');
  });

  it('includes general wellness card as fallback', () => {
    const response = fallbackKnowledgeResponse('unknown_scenario' as any);

    expect(response.cards).toHaveLength(1);
    expect(response.disclaimer).toContain('不作为医疗诊断');
  });
});
