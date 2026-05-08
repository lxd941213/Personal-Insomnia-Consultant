import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';
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
  riskFlags: ['sleep_latency', 'sleep_quality'],
};

describe('DashboardPage', () => {
  it('renders Chinese dashboard with scene cards and assessment summary', () => {
    render(
      <DashboardPage
        profile={mockProfile}
        assessmentResult={mockAssessmentResult}
        onStartAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenChat={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    // Header with profile info
    expect(screen.getByRole('heading', { name: '睡眠健康助手' })).toBeInTheDocument();
    expect(screen.getByText(/25-34岁/)).toBeInTheDocument();

    // Assessment summary band
    expect(screen.getByText(/ISI:/)).toBeInTheDocument();
    expect(screen.getByText(/PSQI:/)).toBeInTheDocument();

    // Scene cards
    expect(screen.getByRole('button', { name: /入睡困难/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /熬夜习惯/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /压力焦虑/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /睡眠质量差/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /养生调理/ })).toBeInTheDocument();
  });

  it('renders without assessment result', () => {
    render(
      <DashboardPage
        profile={mockProfile}
        assessmentResult={null}
        onStartAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenChat={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: '睡眠健康助手' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /入睡困难/ })).toBeInTheDocument();
  });

  it('launches chat from a scene', async () => {
    const user = userEvent.setup();
    const onOpenChat = vi.fn();

    render(
      <DashboardPage
        profile={mockProfile}
        assessmentResult={null}
        onStartAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenChat={onOpenChat}
        onReset={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /入睡困难/ }));

    expect(onOpenChat).toHaveBeenCalledWith('hard_to_fall_asleep');
  });

  it('calls onStartAssessment when assessment button is clicked', async () => {
    const user = userEvent.setup();
    const onStartAssessment = vi.fn();

    render(
      <DashboardPage
        profile={mockProfile}
        assessmentResult={null}
        onStartAssessment={onStartAssessment}
        onOpenKnowledge={vi.fn()}
        onOpenChat={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: '睡眠评估' }));

    expect(onStartAssessment).toHaveBeenCalled();
  });

  it('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();

    render(
      <DashboardPage
        profile={mockProfile}
        assessmentResult={null}
        onStartAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenChat={vi.fn()}
        onReset={onReset}
      />,
    );

    await user.click(screen.getByRole('button', { name: '重置档案' }));

    expect(onReset).toHaveBeenCalled();
  });
});
