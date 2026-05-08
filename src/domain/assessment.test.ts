import { describe, expect, it } from 'vitest';
import {
  isiQuestions,
  psqiLiteQuestions,
  getIsiLevel,
  getPsqiLiteLevel,
  buildAssessmentResult,
} from './assessment';
import { sleepScenarios, getScenarioDefinition, buildScenePrompt } from './scenarios';

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
  it('returns normal for scores 0-7', () => {
    expect(getIsiLevel(0)).toBe('normal');
    expect(getIsiLevel(5)).toBe('normal');
    expect(getIsiLevel(7)).toBe('normal');
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
  it('returns normal for scores 0-4', () => {
    expect(getPsqiLiteLevel(0)).toBe('normal');
    expect(getPsqiLiteLevel(4)).toBe('normal');
  });

  it('returns mild for scores 5-7', () => {
    expect(getPsqiLiteLevel(5)).toBe('mild');
    expect(getPsqiLiteLevel(7)).toBe('mild');
  });

  it('returns moderate for scores 8-14', () => {
    expect(getPsqiLiteLevel(8)).toBe('moderate');
    expect(getPsqiLiteLevel(14)).toBe('moderate');
  });

  it('returns severe for scores 15-21', () => {
    expect(getPsqiLiteLevel(15)).toBe('severe');
    expect(getPsqiLiteLevel(21)).toBe('severe');
  });
});

describe('buildAssessmentResult', () => {
  it('builds result with correct ISI level', () => {
    const isiAnswers = { 0: 2, 1: 3, 2: 1, 3: 0, 4: 4, 5: 2, 6: 1 }; // total = 13
    const psqiAnswers = {};
    const result = buildAssessmentResult(isiAnswers, psqiAnswers);
    expect(result.isiLevel).toBe('mild');
    expect(result.isiScore).toBe(13);
  });

  it('sets risk flag for high ISI', () => {
    const isiAnswers = { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 }; // total = 28
    const psqiAnswers = {};
    const result = buildAssessmentResult(isiAnswers, psqiAnswers);
    expect(result.riskFlag).toBe(true);
  });

  it('sets risk flag for high PSQI', () => {
    const isiAnswers = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // total = 0
    const psqiAnswers = { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 }; // total = 24
    const result = buildAssessmentResult(isiAnswers, psqiAnswers);
    expect(result.riskFlag).toBe(true);
  });
});

describe('sleepScenarios', () => {
  it('should have 5 scenarios', () => {
    expect(sleepScenarios).toHaveLength(5);
  });

  it('should have Chinese labels', () => {
    sleepScenarios.forEach((s) => {
      expect(s.label).toMatch(/[一-龥]/);
    });
  });

  it('should contain expected scenario IDs', () => {
    const ids = sleepScenarios.map((s) => s.id);
    expect(ids).toContain('hard_to_fall_asleep');
    expect(ids).toContain('late_night_habit');
    expect(ids).toContain('stress_anxiety');
    expect(ids).toContain('poor_sleep_quality');
    expect(ids).toContain('wellness_regulation');
  });
});

describe('getScenarioDefinition', () => {
  it('returns definition for valid scenario', () => {
    const def = getScenarioDefinition('hard_to_fall_asleep');
    expect(def).toBeDefined();
    expect(def.id).toBe('hard_to_fall_asleep');
  });

  it('returns undefined for invalid scenario', () => {
    const def = getScenarioDefinition('invalid_scenario');
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
});
