import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodayPage } from './TodayPage';
import type { SleepProfile } from '../domain/types';
import { clearAllLocalData, getReminderSettings } from '../storage/localStore';

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

  it('renders today page with profile and reminder tasks', () => {
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

  it('acknowledges in-app reminder tasks for today', async () => {
    const user = userEvent.setup();
    render(
      <TodayPage
        profile={profile}
        assessmentResult={null}
        onOpenChat={vi.fn()}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
        onOpenDiary={vi.fn()}
        today="2026-05-08"
      />,
    );

    await user.click(screen.getByRole('button', { name: '完成睡前提醒' }));

    expect(getReminderSettings()?.lastBedtimeAckDate).toBe('2026-05-08');
    expect(screen.queryByText('22:30 睡前准备提醒')).not.toBeInTheDocument();
    expect(screen.getByText('07:00 起床后补充睡眠记录')).toBeInTheDocument();
  });
});
