import { describe, expect, it } from 'vitest';
import { buildTrustedKnowledgeResponse } from './trustedContent';

describe('trusted content', () => {
  it('builds deterministic cards for insomnia scenarios', () => {
    const response = buildTrustedKnowledgeResponse('hard_to_fall_asleep');

    expect(response.scenario).toBe('hard_to_fall_asleep');
    expect(response.cards.length).toBeGreaterThanOrEqual(2);
    expect(response.cards[0].title).toContain('固定起床');
    expect(response.disclaimer).toContain('不作为医疗诊断');
  });

  it('prioritizes safety card for medical triage', () => {
    const response = buildTrustedKnowledgeResponse('medical_triage');

    expect(response.cards[0].title).toBe('优先识别需要专业评估的信号');
    expect(response.cards[0].safetyNote).toContain('急救');
  });
});
