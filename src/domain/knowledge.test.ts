import { describe, expect, it } from 'vitest';
import { normalizeKnowledgeResponse, fallbackKnowledgeResponse } from './knowledge';

describe('normalizeKnowledgeResponse', () => {
  it('keeps a valid structured card output', () => {
    const response = normalizeKnowledgeResponse({
      cards: [
        {
          scenario: 'hard_to_fall_asleep',
          title: '入睡困难的原因分析',
          content: '入睡困难可能与心理压力、不良睡眠习惯有关。',
          tags: ['入睡困难', '睡眠卫生'],
        },
      ],
      disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
    });

    expect(response.cards).toHaveLength(1);
    expect(response.cards[0].scenario).toBe('hard_to_fall_asleep');
    expect(response.cards[0].title).toBe('入睡困难的原因分析');
    expect(response.disclaimer).toContain('健康管理参考');
  });

  it('returns Chinese fallback for malformed output', () => {
    const response = normalizeKnowledgeResponse({ cards: 'not an array' });

    expect(response.cards).toHaveLength(1);
    expect(response.cards[0].title).toContain('无法生成');
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
        { scenario: 'hard_to_fall_asleep', title: '有效卡片', content: '内容', tags: ['tag'] },
        { scenario: 'invalid', title: '', content: '', tags: [] },
        { scenario: 'late_night_habit', title: '另一个有效', content: '内容2', tags: ['tag2'] },
      ],
      disclaimer: 'test',
    });

    expect(response.cards).toHaveLength(2);
  });
});

describe('fallbackKnowledgeResponse', () => {
  it('returns conservative cards with safety note for high-risk contexts', () => {
    const response = fallbackKnowledgeResponse('hard_to_fall_asleep');

    expect(response.cards).toHaveLength(1);
    expect(response.cards[0].scenario).toBe('hard_to_fall_asleep');
    expect(response.cards[0].title).toContain('建议');
    expect(response.disclaimer).toContain('专业支持');
  });

  it('includes general wellness card as fallback', () => {
    const response = fallbackKnowledgeResponse('unknown_scenario' as any);

    expect(response.cards).toHaveLength(1);
    expect(response.disclaimer).toContain('不作为医疗诊断');
  });
});