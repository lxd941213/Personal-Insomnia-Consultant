import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlansPage } from './PlansPage';
import type { AssessmentResult, SleepDiaryEntry, SleepProfile } from '../domain/types';

vi.mock('../storage/localStore', () => ({
  getDiaryEntries: (): SleepDiaryEntry[] => [],
  getSleepProgram: vi.fn(() => null),
  getDailyTaskLogs: vi.fn(() => []),
  saveSleepProgram: vi.fn(),
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
  it('renders a current priority recommendation with visible reasons', () => {
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

    expect(screen.getByText('当前优先方案')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '固定起床时间' })).toBeInTheDocument();
    expect(screen.getAllByText(/推荐理由/).length).toBeGreaterThan(0);
    expect(screen.getByText(/今晚先做/)).toBeInTheDocument();
  });

  it('keeps the full 14-day timeline collapsed until requested', async () => {
    const user = userEvent.setup();
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

    expect(screen.getByText('14天改善计划')).toBeInTheDocument();
    expect(screen.getByText(/第 1 天 \/ 14 天/)).toBeInTheDocument();
    expect(screen.getByText(/今日任务/)).toBeInTheDocument();
    expect(screen.queryByText(/第14天：第 2 周复盘和下一步/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '查看全部 14 天' }));

    expect(screen.getByText(/第14天：第 2 周复盘和下一步/)).toBeInTheDocument();
    expect(screen.getAllByText('CBT-I').length).toBeGreaterThan(0);
    expect(screen.getAllByText('睡眠卫生').length).toBeGreaterThan(0);
  });

  it('keeps plan library categories collapsed until opened', async () => {
    const user = userEvent.setup();
    render(<PlansPage profile={profile} assessmentResult={assessmentResult} />);

    expect(screen.getByText('全部方案')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '咖啡因边界' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /饮食营养/ }));

    expect(screen.getByRole('heading', { name: '咖啡因边界' })).toBeInTheDocument();
  });

  it('shows professional evaluation guidance instead of ordinary timeline actions when care should come first', () => {
    render(
      <PlansPage
        profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }}
        assessmentResult={assessmentResult}
      />,
    );

    expect(screen.getAllByText('优先进行专业评估').length).toBeGreaterThan(0);
    expect(screen.getByText('当前优先方案')).toBeInTheDocument();
    expect(screen.queryByText(/第1天：睡眠环境重置/)).not.toBeInTheDocument();
  });
});
