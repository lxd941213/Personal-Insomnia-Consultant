import { describe, expect, it } from 'vitest';
import {
  isiQuestions,
  psqiLiteQuestions,
  getIsiLevel,
  getPsqiLiteLevel,
  buildAssessmentResult,
} from './assessment';
import { sleepScenarios, getScenarioDefinition, buildScenePrompt } from './scenarios';
import type { SleepProfile } from './types';

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

describe('ISI Questions (Chinese)', () => {
  it('should have 7 items', () => {
    expect(isiQuestions).toHaveLength(7);
  });

  it('should have Chinese labels', () => {
    isiQuestions.forEach((q) => {
      expect(q.label).toMatch(/[一-龥]/);
    });
  });

  it('should have correct score range', () => {
    isiQuestions.forEach((q) => {
      expect(q.options).toHaveLength(5);
      q.options.forEach((opt) => {
        expect(opt.value).toBeGreaterThanOrEqual(0);
        expect(opt.value).toBeLessThanOrEqual(4);
      });
    });
  });
});

describe('PSQILite Questions (Chinese)', () => {
  it('should have 6 items', () => {
    expect(psqiLiteQuestions).toHaveLength(6);
  });

  it('should have Chinese labels', () => {
    psqiLiteQuestions.forEach((q) => {
      expect(q.label).toMatch(/[一-龥]/);
    });
  });
});

describe('getIsiLevel', () => {
  it('returns none for scores 0-7', () => {
    expect(getIsiLevel(0)).toBe('none');
    expect(getIsiLevel(5)).toBe('none');
    expect(getIsiLevel(7)).toBe('none');
  });

  it('returns mild for scores 8-14', () => {
    expect(getIsiLevel(8)).toBe('mild');
    expect(getIsiLevel(14)).toBe('mild');
  });

  it('returns moderate for scores 15-21', () => {
    expect(getIsiLevel(15)).toBe('moderate');
    expect(getIsiLevel(21)).toBe('moderate');
  });

  it('returns severe for scores 22-28', () => {
    expect(getIsiLevel(22)).toBe('severe');
    expect(getIsiLevel(28)).toBe('severe');
  });
});

describe('getPsqiLiteLevel', () => {
  it('returns good for scores 0-5', () => {
    expect(getPsqiLiteLevel(0)).toBe('good');
    expect(getPsqiLiteLevel(5)).toBe('good');
  });

  it('returns fair for scores 6-11', () => {
    expect(getPsqiLiteLevel(6)).toBe('fair');
    expect(getPsqiLiteLevel(11)).toBe('fair');
  });

  it('returns poor for scores 12-24', () => {
    expect(getPsqiLiteLevel(12)).toBe('poor');
    expect(getPsqiLiteLevel(24)).toBe('poor');
  });
});

describe('buildAssessmentResult', () => {
  it('builds result with correct ISI level', () => {
    const isiAnswers = { 0: 2, 1: 3, 2: 1, 3: 0, 4: 4, 5: 2, 6: 1 }; // total = 13
    const psqiAnswers = {};
    const result = buildAssessmentResult({ isiAnswers, psqiLiteAnswers: psqiAnswers, profile });
    expect(result.isi.level).toBe('mild');
    expect(result.isi.score).toBe(13);
  });

  it('sets risk flags for severe ISI', () => {
    const isiAnswers = { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 }; // total = 28
    const psqiAnswers = {};
    const result = buildAssessmentResult({ isiAnswers, psqiLiteAnswers: psqiAnswers, profile });
    expect(result.riskFlags).toContain('失眠严重度较高');
  });

  it('sets risk flags for poor PSQI', () => {
    const isiAnswers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // total = 0
    const psqiAnswers = { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 }; // total = 24
    const result = buildAssessmentResult({ isiAnswers, psqiLiteAnswers: psqiAnswers, profile });
    expect(result.riskFlags).toContain('睡眠质量较差');
    expect(result.riskFlags).toContain('实际睡眠时长明显不足');
    expect(result.riskFlags).toContain('白天功能受影响较明显');
    expect(result.riskFlags).toContain('存在助眠药物或酒精依赖风险');
  });

  it('returns nested structure with completedAt', () => {
    const isiAnswers = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }; // total = 7
    const psqiAnswers = {};
    const result = buildAssessmentResult({ isiAnswers, psqiLiteAnswers: psqiAnswers, profile });
    expect(result.completedAt).toBeDefined();
    expect(result.isi).toBeDefined();
    expect(result.isi.answers).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(result.psqiLite).toBeDefined();
    expect(result.psqiLite.answers).toEqual([]);
    expect(result.riskFlags).toEqual([]);
  });

  it('returns correct ISI summary for none level', () => {
    const isiAnswers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // total = 0
    const psqiAnswers = {};
    const result = buildAssessmentResult({ isiAnswers, psqiLiteAnswers: psqiAnswers, profile });
    expect(result.isi.level).toBe('none');
    expect(result.isi.summary).toContain('未显示明显失眠倾向');
  });

  it('returns correct PSQI summary for good level', () => {
    const isiAnswers = {};
    const psqiAnswers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // total = 0
    const result = buildAssessmentResult({ isiAnswers, psqiLiteAnswers: psqiAnswers, profile });
    expect(result.psqiLite.level).toBe('good');
    expect(result.psqiLite.summary).toContain('整体睡眠质量较好');
  });

  it('includes profile safety signals as risk flags', () => {
    const isiAnswers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const psqiAnswers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const result = buildAssessmentResult({
      isiAnswers,
      psqiLiteAnswers: psqiAnswers,
      profile: { ...profile, safetySignals: ['疑似睡眠呼吸暂停'] },
    });

    expect(result.riskFlags).toContain('存在安全信号：疑似睡眠呼吸暂停');
  });
});

describe('sleepScenarios', () => {
  it('should have 9 scenarios', () => {
    expect(sleepScenarios).toHaveLength(9);
  });

  it('should have Chinese labels', () => {
    sleepScenarios.forEach((s) => {
      expect(s.label).toMatch(/[一-龥]/);
    });
  });

  it('uses the required Chinese labels from the plan', () => {
    expect(sleepScenarios.map((s) => s.label)).toEqual([
      '入睡困难',
      '睡眠质量差',
      '压力焦虑',
      '熬夜习惯',
      '养生调理',
      '睡前仪式助手',
      '白噪音 / 冥想音频',
      '在线问诊导流',
      '饮食 × 睡眠关联',
    ]);
  });

  it('should contain expected scenario IDs', () => {
    const ids = sleepScenarios.map((s) => s.id);
    expect(ids).toContain('hard_to_fall_asleep');
    expect(ids).toContain('late_night_habit');
    expect(ids).toContain('stress_anxiety');
    expect(ids).toContain('poor_sleep_quality');
    expect(ids).toContain('wellness_regulation');
    expect(ids).toContain('bedtime_ritual');
    expect(ids).toContain('sound_meditation');
    expect(ids).toContain('medical_triage');
    expect(ids).toContain('diet_sleep_link');
  });
});

describe('getScenarioDefinition', () => {
  it('returns definition for valid scenario', () => {
    const def = getScenarioDefinition('hard_to_fall_asleep');
    expect(def).toBeDefined();
    expect(def?.id).toBe('hard_to_fall_asleep');
  });

  it('returns undefined for invalid scenario', () => {
    const def = getScenarioDefinition('invalid_scenario' as never);
    expect(def).toBeUndefined();
  });
});

describe('buildScenePrompt', () => {
  it('returns a string prompt', () => {
    const prompt = buildScenePrompt('hard_to_fall_asleep');
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('includes scenario context in prompt', () => {
    const prompt = buildScenePrompt('stress_anxiety');
    expect(prompt).toContain('失眠');
  });

  it('returns bedtime ritual context for the bedtime ritual feature', () => {
    const prompt = buildScenePrompt('bedtime_ritual');
    expect(prompt).toContain('睡前 30 分钟计划');
  });

  it('returns audio guidance context for the sound meditation feature', () => {
    const prompt = buildScenePrompt('sound_meditation');
    expect(prompt).toContain('白噪音');
    expect(prompt).toContain('冥想音频');
  });

  it('returns medical triage context for the online consultation feature', () => {
    const prompt = buildScenePrompt('medical_triage');
    expect(prompt).toContain('在线问诊导流');
    expect(prompt).toContain('不替代医疗诊断');
  });

  it('returns diet sleep context for the diet link feature', () => {
    const prompt = buildScenePrompt('diet_sleep_link');
    expect(prompt).toContain('饮食习惯与睡眠');
  });
});
