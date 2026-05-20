import { render, screen, within } from '@testing-library/react';
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
    expect(screen.getByText('睡眠工具')).toBeInTheDocument();
    expect(screen.getByText('推荐放松')).toBeInTheDocument();
    expect(screen.queryByText('今晚待办')).not.toBeInTheDocument();
    expect(screen.queryByText('14 天改善计划')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '睡眠自测' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '完成今日任务' })).not.toBeInTheDocument();
  });

  it('places assessment and knowledge tools above quick consultation', () => {
    const { container } = render(
      <TodayPage
        profile={profile}
        assessmentResult={null}
        onOpenChat={vi.fn()}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('睡眠工具')).toContainElement(
      screen.getByRole('button', { name: /睡眠自测/ }),
    );
    expect(screen.getByLabelText('睡眠工具')).toContainElement(
      screen.getByRole('button', { name: /睡眠知识/ }),
    );
    expect(container.textContent?.indexOf('睡眠工具')).toBeLessThan(
      container.textContent?.indexOf('快速咨询') ?? 0,
    );
  });

  it('moves sound meditation from quick consultation to recommended relaxation', () => {
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

    expect(within(screen.getByLabelText('快速咨询')).queryByText('白噪音 / 冥想音频')).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('推荐放松')).getByRole('button', { name: /白噪音 \/ 冥想音频/ })).toBeInTheDocument();
  });

  it('shows a lightweight current task entry', () => {
    render(
      <TodayPage
        profile={profile}
        assessmentResult={null}
        onOpenChat={vi.fn()}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
        onOpenPlans={vi.fn()}
        todayTask={{ day: 1, title: '固定起床时间', status: 'today' }}
      />,
    );

    expect(screen.getByText('今日助眠任务')).toBeInTheDocument();
    expect(screen.getByText('固定起床时间')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去方案页执行' })).toBeInTheDocument();
  });
});
