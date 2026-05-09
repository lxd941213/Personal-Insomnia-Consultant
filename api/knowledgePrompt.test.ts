import { describe, expect, it } from 'vitest';
import { buildKnowledgePrompt } from './knowledgePrompt';
import type { SleepProfile, SleepScenario } from '../src/domain/types';

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '23:30',
  wakeTime: '07:30',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'moderate',
  habits: ['睡前刷手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

describe('buildKnowledgePrompt', () => {
  it.each([
    ['bedtime_ritual', '睡前仪式助手'],
    ['sound_meditation', '白噪音 / 冥想音频'],
    ['medical_triage', '在线问诊导流'],
    ['diet_sleep_link', '饮食 × 睡眠关联'],
  ] satisfies Array<[SleepScenario, string]>)('includes the scene label for %s', (scenario, label) => {
    const prompt = buildKnowledgePrompt(profile, scenario);

    expect(prompt).toContain('当前场景：' + label);
  });
});
