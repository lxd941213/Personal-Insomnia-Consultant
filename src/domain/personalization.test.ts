import { describe, expect, it } from 'vitest';
import { buildPersonalizationProfile, formatPersonalizationForPrompt } from './personalization';
import type { AssessmentResult, DiarySummary, SleepProfile } from './types';

const baseProfile: SleepProfile = {
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

const diarySummary: DiarySummary = {
  entryCount: 7,
  averageSleepDurationMinutes: 285,
  averageSleepLatencyMinutes: 65,
  averageAwakenings: 2,
  averageSleepQuality: 2,
};

function assessment(level: AssessmentResult['isi']['level'], psqiLevel: AssessmentResult['psqiLite']['level']): AssessmentResult {
  return {
    completedAt: '2026-05-09T00:00:00.000Z',
    isi: { answers: [], score: level === 'severe' ? 23 : level === 'moderate' ? 17 : 10, level, summary: '评估结果' },
    psqiLite: { answers: [], score: psqiLevel === 'poor' ? 14 : psqiLevel === 'fair' ? 8 : 3, level: psqiLevel, summary: '睡眠质量' },
    riskFlags: [],
  };
}

describe('buildPersonalizationProfile', () => {
  it('handles legacy profiles that do not contain enhanced optional fields', () => {
    const result = buildPersonalizationProfile({
      profile: baseProfile,
      assessmentResult: null,
      diarySummary: undefined,
    });

    expect(result.severity).toBe('mild');
    expect(result.careAdvice.shouldSeekCare).toBe(false);
    expect(result.safetyBoundaries).toContain('本内容仅供参考，非医疗诊断');
  });

  it('treats apnea or self-harm safety evidence as severe and urgent', () => {
    const result = buildPersonalizationProfile({
      profile: {
        ...baseProfile,
        safetySignals: ['疑似睡眠呼吸暂停'],
        medicalConditions: ['疑似呼吸暂停'],
      },
      assessmentResult: null,
      diarySummary,
    });

    expect(result.severity).toBe('severe');
    expect(result.careAdvice).toMatchObject({ shouldSeekCare: true, urgency: 'urgent' });
    expect(result.careAdvice.reasons.join('、')).toContain('疑似睡眠呼吸暂停');
  });

  it('recommends care for chronic insomnia with daytime impairment', () => {
    const result = buildPersonalizationProfile({
      profile: {
        ...baseProfile,
        concernDuration: '3个月以上',
        daytimeImpact: '白天明显疲惫，工作受影响',
      },
      assessmentResult: assessment('moderate', 'fair'),
      diarySummary,
    });

    expect(result.severity).toBe('moderate');
    expect(result.careAdvice.shouldSeekCare).toBe(true);
    expect(result.careAdvice.urgency).toBe('soon');
  });

  it('uses PSQI impairment, short sleep, medication, pregnancy, and major disease as safety evidence', () => {
    const cases: Array<{
      name: string;
      profile: SleepProfile;
      assessmentResult: AssessmentResult | null;
      diarySummary?: DiarySummary;
      expectedReason: string;
      expectedSeverity: 'moderate' | 'severe';
    }> = [
      {
        name: 'poor sleep quality with daytime impairment',
        profile: { ...baseProfile, daytimeImpact: '白天功能明显受影响' },
        assessmentResult: assessment('none', 'poor'),
        expectedReason: '睡眠质量较差且影响白天功能',
        expectedSeverity: 'severe',
      },
      {
        name: 'persistent short sleep with daytime impairment',
        profile: { ...baseProfile, sleepDurationHours: '4', daytimeImpact: '白天明显疲惫' },
        assessmentResult: null,
        diarySummary: { ...diarySummary, averageSleepDurationMinutes: 260 },
        expectedReason: '睡眠时长明显不足且伴随白天影响',
        expectedSeverity: 'moderate',
      },
      {
        name: 'nightly sedative use',
        profile: { ...baseProfile, medicationStatus: ['长期使用助眠药'] },
        assessmentResult: null,
        expectedReason: '存在助眠药物依赖或长期用药信号',
        expectedSeverity: 'severe',
      },
      {
        name: 'pregnancy or postpartum',
        profile: { ...baseProfile, medicalConditions: ['孕期或产后'] },
        assessmentResult: null,
        expectedReason: '孕期或产后睡眠问题需要谨慎评估',
        expectedSeverity: 'severe',
      },
      {
        name: 'major disease or chest pain',
        profile: { ...baseProfile, medicalConditions: ['慢性病'], optionalContext: '最近伴随胸痛' },
        assessmentResult: null,
        expectedReason: '存在基础疾病或胸痛相关信号',
        expectedSeverity: 'severe',
      },
      {
        name: 'generic safety signal',
        profile: { ...baseProfile, safetySignals: ['严重症状'] },
        assessmentResult: null,
        expectedReason: '存在安全信号：严重症状',
        expectedSeverity: 'severe',
      },
    ];

    cases.forEach(({ profile, assessmentResult, diarySummary, expectedReason, expectedSeverity }) => {
      const result = buildPersonalizationProfile({ profile, assessmentResult, diarySummary });
      expect(result.severity).toBe(expectedSeverity);
      expect(result.careAdvice.shouldSeekCare).toBe(true);
      expect(result.careAdvice.reasons).toContain(expectedReason);
    });
  });

  it('keeps supplement guidance non-dosing and safety oriented', () => {
    const result = buildPersonalizationProfile({
      profile: {
        ...baseProfile,
        dietHabit: ['午后咖啡因', '晚餐过晚'],
        medicationStatus: ['正在服用其他药物'],
      },
      assessmentResult: null,
      diarySummary,
    });

    expect(result.nutritionTargets.join('。')).toContain('褪黑素');
    expect(result.safetyBoundaries.join('。')).toContain('不提供药物或补充剂剂量');
    expect(result.nutritionTargets.join('。')).not.toMatch(/\d+\s*(mg|毫克|克)/i);
  });

  it('returns non-diagnostic TCM-style wellness direction', () => {
    const result = buildPersonalizationProfile({
      profile: {
        ...baseProfile,
        emotionState: ['焦虑', '烦躁'],
        stressLevel: '很高',
      },
      assessmentResult: null,
      diarySummary,
    });

    expect(result.tcmDirection.pattern).toBe('liver_qi_stagnation');
    expect(result.tcmDirection.label).toContain('体质倾向');
    expect(result.tcmDirection.disclaimer).toContain('不作为医疗诊断');
  });

  it('builds exactly seven daily tasks', () => {
    const result = buildPersonalizationProfile({ profile: baseProfile, assessmentResult: null, diarySummary });

    expect(result.sevenDayPlan).toHaveLength(7);
    expect(result.sevenDayPlan.map((item) => item.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(result.sevenDayPlan[0]).toMatchObject({
      title: expect.any(String),
      task: expect.any(String),
      checkInPrompt: expect.any(String),
    });
  });
});

describe('formatPersonalizationForPrompt', () => {
  it('summarizes deterministic context for the model prompt', () => {
    const result = buildPersonalizationProfile({
      profile: { ...baseProfile, phoneUsageHabit: '睡前1小时内频繁使用' },
      assessmentResult: assessment('mild', 'fair'),
      diarySummary,
    });

    const text = formatPersonalizationForPrompt(result);

    expect(text).toContain('个性化睡眠分析');
    expect(text).toContain('严重程度');
    expect(text).toContain('7天改善计划');
    expect(text).toContain('不提供药物或补充剂剂量');
  });
});
