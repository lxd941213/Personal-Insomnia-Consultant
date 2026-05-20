import { describe, expect, it } from 'vitest';
import { buildSafetyDisplayCopy, detectHighRiskSignal, triageSafety } from './safety';
import type { SleepProfile } from './types';

const baseProfile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:30',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '中等',
  habits: [],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

describe('triageSafety', () => {
  it('marks Chinese self-harm language as urgent and blocks AI', () => {
    const result = triageSafety({ message: '我睡不着，真的不想活了', profile: baseProfile });

    expect(result.level).toBe('urgent');
    expect(result.shouldBlockAi).toBe(true);
    expect(result.categories).toContain('self_harm');
    expect(result.careNotice).toContain('当地急救');
    expect(result.careNotice).not.toContain('988');
  });

  it('marks chest pain and breathing difficulty as urgent', () => {
    const result = triageSafety({ message: '半夜胸口痛，呼吸困难，睡不着', profile: baseProfile });

    expect(result.level).toBe('urgent');
    expect(result.shouldBlockAi).toBe(true);
    expect(result.categories).toContain('chest_pain_or_breathing');
  });

  it('marks suspected sleep apnea with daytime impairment as urgent', () => {
    const result = triageSafety({
      message: '我睡觉总是憋醒，打鼾很严重，白天困到无法工作',
      profile: baseProfile,
    });

    expect(result.level).toBe('urgent');
    expect(result.shouldBlockAi).toBe(true);
    expect(result.categories).toContain('sleep_apnea');
  });

  it('marks suspected sleep apnea profile signal as needs care', () => {
    const result = triageSafety({
      profile: { ...baseProfile, safetySignals: ['疑似睡眠呼吸暂停'] },
    });

    expect(result.level).toBe('needs_care');
    expect(result.shouldBlockAi).toBe(false);
    expect(result.categories).toContain('sleep_apnea');
  });

  it('keeps ordinary sleep trouble normal', () => {
    const result = triageSafety({
      message: '我刷手机到凌晨一点，想早点睡',
      profile: baseProfile,
    });

    expect(result.level).toBe('normal');
    expect(result.shouldBlockAi).toBe(false);
    expect(result.categories).toEqual([]);
    expect(detectHighRiskSignal('我刷手机到凌晨一点，想早点睡')).toBe(false);
  });

  it('keeps detectHighRiskSignal compatible for old callers', () => {
    expect(detectHighRiskSignal('我想轻生')).toBe(true);
    expect(detectHighRiskSignal('I want to hurt myself')).toBe(true);
  });
});

describe('buildSafetyDisplayCopy', () => {
  it('uses China-mainland urgent guidance without diagnosis or treatment claims', () => {
    const triage = triageSafety({ message: '我不想活了，今晚可能会伤害自己' });
    const copy = buildSafetyDisplayCopy(triage);

    expect(copy.title).toContain('立即');
    expect(copy.summary).toContain('当地急救');
    expect(copy.summary).toContain('可信任的人');
    expect(copy.summary).not.toContain('988');
    expect(copy.disclaimer).toContain('不作为医疗诊断');
    expect(JSON.stringify(copy)).not.toMatch(/治愈|治疗方案|处方|剂量/);
  });

  it('uses professional evaluation guidance for needs-care cases', () => {
    const triage = triageSafety({ message: '我睡觉总是憋醒，打鼾很严重' });
    const copy = buildSafetyDisplayCopy(triage);

    expect(copy.title).toContain('建议专业评估');
    expect(copy.actions.map((action) => action.label)).toContain('整理睡眠记录');
    expect(copy.disclaimer).toContain('健康管理参考');
  });

  it('uses ordinary boundary copy for normal cases', () => {
    const triage = triageSafety({ message: '我睡前刷手机到一点' });
    const copy = buildSafetyDisplayCopy(triage);

    expect(copy.title).toBe('睡眠健康管理参考');
    expect(copy.actions.length).toBeGreaterThan(0);
    expect(copy.disclaimer).toContain('不作为医疗诊断');
  });
});