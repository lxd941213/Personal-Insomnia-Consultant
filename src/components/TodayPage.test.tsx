import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TodayPage } from './TodayPage';
import type { SleepProfile } from '../domain/types';

describe('TodayPage', () => {
  it('renders today page with profile and reminder tasks', () => {
    const profile = {
      ageRange: '25-34岁',
      bedtime: '23:00',
      wakeTime: '07:00',
      mainConcern: 'hard_to_fall_asleep',
      concernDuration: '1-3个月',
      stressLevel: '中等',
      habits: [],
      daytimeImpact: '',
      safetySignals: [],
      optionalContext: '',
    } as SleepProfile;
    render(
      <TodayPage
        profile={profile}
        assessmentResult={null}
        onOpenChat={vi.fn()}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
        onOpenDiary={vi.fn()}
      />,
    );
    expect(screen.getByText('今日睡眠')).toBeInTheDocument();
    expect(screen.getByText(/25-34岁/)).toBeInTheDocument();
  });

  it('renders scenario launcher and action buttons', () => {
    const profile = {
      ageRange: '25-34岁',
      bedtime: '23:00',
      wakeTime: '07:00',
      mainConcern: 'hard_to_fall_asleep',
      concernDuration: '1-3个月',
      stressLevel: '中等',
      habits: [],
      daytimeImpact: '',
      safetySignals: [],
      optionalContext: '',
    } as SleepProfile;
    render(
      <TodayPage
        profile={profile}
        assessmentResult={null}
        onOpenChat={vi.fn()}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
        onOpenDiary={vi.fn()}
      />,
    );
    expect(screen.getByText('今晚待办')).toBeInTheDocument();
    expect(screen.getByText('推荐放松')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '睡眠自测' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '记录睡眠' })).toBeInTheDocument();
  });
});
