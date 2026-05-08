import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateKnowledgeCards } from './knowledgeClient';
import type { SleepProfile, SleepScenario } from '../domain/types';

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: [],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: '',
};

describe('generateKnowledgeCards', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts profile and scenario then normalizes response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        scenario: 'hard_to_fall_asleep',
        generatedAt: '2026-05-08T08:00:00.000Z',
        cards: [
          {
            title: '睡眠限制疗法',
            summary: '通过限制卧床时间来提高睡眠效率',
            keyPoints: ['提高睡眠效率'],
            misconceptions: ['越早上床越好'],
            actions: [{ title: '固定起床', detail: '先固定每天起床时间。' }],
            safetyNote: null,
            followUpQuestions: ['白天是否补觉？'],
          },
        ],
        disclaimer: '仅供参考',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const scenario: SleepScenario = 'hard_to_fall_asleep';
    const response = await generateKnowledgeCards({ profile, scenario });

    expect(fetch).toHaveBeenCalledWith('/api/knowledge', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, scenario }),
    }));
    expect(response.cards).toHaveLength(1);
    expect(response.scenario).toBe('hard_to_fall_asleep');
    expect(response.cards[0].title).toBe('睡眠限制疗法');
  });

  it('throws Chinese-facing error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(generateKnowledgeCards({
      profile,
      scenario: 'hard_to_fall_asleep',
    })).rejects.toThrow('知识卡片服务暂时不可用，请稍后再试。');
  });
});
