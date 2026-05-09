import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlansPage } from './PlansPage';
import type { AssessmentResult, SleepDiaryEntry, SleepProfile } from '../domain/types';

vi.mock('../storage/localStore', () => ({
  getDiaryEntries: (): SleepDiaryEntry[] => [],
}));

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
  phoneUsageHabit: '睡前1小时内频繁使用',
};

const assessmentResult: AssessmentResult = {
  completedAt: '2026-05-09T00:00:00.000Z',
  isi: { answers: [], score: 10, level: 'mild', summary: '轻度失眠' },
  psqiLite: { answers: [], score: 8, level: 'fair', summary: '睡眠质量一般' },
  riskFlags: [],
};

describe('PlansPage', () => {
  it('renders recommended plans with reasons', () => {
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);
    expect(screen.getByText('推荐方案')).toBeInTheDocument();
    expect(screen.getAllByText(/推荐理由/).length).toBeGreaterThan(0);
  });

  it('renders seven daily personalization tasks', () => {
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

    expect(screen.getAllByText('7天改善计划').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/第1天/)).toBeInTheDocument();
    expect(screen.getByText(/第7天/)).toBeInTheDocument();
  });
});