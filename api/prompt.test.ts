import { describe, expect, it } from 'vitest';
import { buildSleepAdvisorPrompt } from './prompt';
import type { SleepProfile } from '../src/domain/types';

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: ['Phone use before bed'],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: 'Mind keeps racing.',
};

describe('buildSleepAdvisorPrompt', () => {
  it('includes profile details and safety boundaries', () => {
    const prompt = buildSleepAdvisorPrompt(profile, 'How can I sleep earlier?');

    expect(prompt).toContain('25-34');
    expect(prompt).toContain('01:00');
    expect(prompt).toContain('不作为医疗诊断');
    expect(prompt).toContain('JSON');
  });
});