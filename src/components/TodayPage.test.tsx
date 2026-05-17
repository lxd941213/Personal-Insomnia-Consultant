import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodayPage } from './TodayPage';
import type { SleepProfile } from '../domain/types';
import { clearAllLocalData } from '../storage/localStore';

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

describe('TodayPage', () => {
  beforeEach(() => {
    clearAllLocalData();
  });

  it('renders home page with profile context', () => {
    render(
      <TodayPage
        profile={profile}
        assessmentResult={null}
        onOpenChat={vi.fn()}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
      />,
    );
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText(/25-34岁/)).toBeInTheDocument();
  });

  it('keeps quick consultation and recommended relaxation modules only', () => {
    render(
      <TodayPage
        profile={profile}
        assessmentResult={null}
        onOpenChat={vi.fn()}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
      />,
    );
    expect(screen.getByText('快速咨询')).toBeInTheDocument();
    expect(screen.getByText('推荐放松')).toBeInTheDocument();
    expect(screen.queryByText('今晚待办')).not.toBeInTheDocument();
    expect(screen.queryByText('14 天改善计划')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '睡眠自测' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '完成今日任务' })).not.toBeInTheDocument();
  });
});
