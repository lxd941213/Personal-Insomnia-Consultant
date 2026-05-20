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

    expect(response.cards[0].title).toBe('安全边界与专业帮助');
    expect(response.cards[1].title).toBe('优先识别需要专业评估的信号');
    expect(response.cards[1].safetyNote).toContain('急救');
  });

  it('includes source labels for CBT-I, general wellness boundary, and psychological assistance', () => {
    const responses = [
      buildTrustedKnowledgeResponse('hard_to_fall_asleep'),
      buildTrustedKnowledgeResponse('medical_triage'),
    ];
    const serialized = JSON.stringify(responses);

    expect(serialized).toContain('CBT-I');
    expect(serialized).toContain('健康管理参考');
    expect(serialized).toContain('12356');
    // Check summaries and keyPoints do not contain prohibited claims
    const summariesAndKeyPoints = responses
      .flatMap((r) => r.cards.flatMap((c) => [c.summary, ...c.keyPoints]))
      .join('');
    expect(summariesAndKeyPoints).not.toMatch(/治愈|治疗方案|处方|剂量/);
  });
});
