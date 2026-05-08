import { describe, expect, it } from 'vitest';
import { recommendSleepPlans, sleepPlans } from './sleepPlans';
import type { AssessmentResult, DiarySummary, SleepProfile } from './types';

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: ['睡前玩手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

const assessment: AssessmentResult = {
  completedAt: '2026-05-08T00:00:00.000Z',
  isi: { answers: [], score: 18, level: 'moderate', summary: '中度失眠' },
  psqiLite: { answers: [], score: 14, level: 'poor', summary: '睡眠质量较差' },
  riskFlags: [],
};

const diarySummary: DiarySummary = {
  entryCount: 3,
  averageSleepDurationMinutes: 360,
  averageSleepLatencyMinutes: 55,
  averageAwakenings: 2,
  averageSleepQuality: 2,
};

describe('sleep plans', () => {
  it('defines built-in Chinese plan library', () => {
    expect(sleepPlans.map((plan) => plan.id)).toEqual(expect.arrayContaining([
      'fixed-wake-time',
      'stimulus-control',
      'breathing-before-bed',
      'caffeine-boundary',
    ]));
  });

  it('recommends plans with visible reasons from profile, assessment, and diary', () => {
    const recommendations = recommendSleepPlans({ profile, assessmentResult: assessment, diarySummary });
    expect(recommendations[0]).toMatchObject({
      planId: 'fixed-wake-time',
      reasons: expect.arrayContaining(['入睡困难和作息偏晚时，固定起床时间通常是优先级较高的基础动作。']),
    });
    expect(recommendations.some((item) => item.planId === 'stimulus-control')).toBe(true);
  });

  it('prioritizes conservative safety recommendation when safety signals exist', () => {
    const recommendations = recommendSleepPlans({
      profile: { ...profile, safetySignals: ['疑似睡眠呼吸暂停'] },
      assessmentResult: assessment,
      diarySummary,
    });

    expect(recommendations[0].planId).toBe('medical-evaluation');
    expect(recommendations[0].safetyNote).toContain('疑似睡眠呼吸暂停');
  });
});
