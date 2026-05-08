import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlansPage } from './PlansPage';
import type { AssessmentResult, SleepProfile } from '../domain/types';

const mockProfile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:00',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '中等',
  habits: ['睡前玩手机'],
  daytimeImpact: '疲劳',
  safetySignals: [],
  optionalContext: '',
};

const mockAssessmentResult: AssessmentResult = {
  completedAt: '2024-01-01T00:00:00.000Z',
  isi: {
    answers: [3, 2, 3, 2, 3, 2, 3],
    score: 16,
    level: 'moderate',
    summary: '中度失眠',
  },
  psqiLite: {
    answers: [2, 2, 1, 1, 1, 2, 1],
    score: 9,
    level: 'poor',
    summary: '睡眠质量差',
  },
  riskFlags: [],
};

describe('PlansPage', () => {
  it('renders recommended plans with reasons', () => {
    render(<PlansPage profile={mockProfile} assessmentResult={mockAssessmentResult} />);
    expect(screen.getByText('推荐方案')).toBeInTheDocument();
    expect(screen.getAllByText(/推荐理由/).length).toBeGreaterThan(0);
  });
});