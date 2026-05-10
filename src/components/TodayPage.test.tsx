import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodayPage } from './TodayPage';
import type { SleepProfile } from '../domain/types';
import { clearAllLocalData, getDailyTaskLogs, getReminderSettings, getSleepProgram } from '../storage/localStore';

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

  it('shows day 1 program task and saves completion feedback', async () => {
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
        today="2026-05-10"
      />,
    );

    expect(screen.getByText('14 天改善计划')).toBeInTheDocument();
    expect(screen.getByText(/第 1 天/)).toBeInTheDocument();
    expect(screen.getByText('睡眠环境重置')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '完成今日任务' }));
    await user.click(screen.getByLabelText('睡眠质量 7 分'));
    await user.clear(screen.getByLabelText('入睡耗时'));
    await user.type(screen.getByLabelText('入睡耗时'), '25');
    await user.click(screen.getByRole('button', { name: '保存反馈' }));

    expect(getSleepProgram()?.currentDay).toBe(2);
    expect(getDailyTaskLogs()).toHaveLength(1);
    expect(getDailyTaskLogs()[0]).toMatchObject({
      day: 1,
      status: 'completed',
      sleepQuality: 7,
      sleepLatencyMinutes: 25,
    });
  });

  it('saves a skipped task with hard difficulty', async () => {
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
        today="2026-05-10"
      />,
    );

    await user.click(screen.getByRole('button', { name: '今天跳过' }));
    await user.click(screen.getByRole('button', { name: '偏难' }));
    await user.click(screen.getByRole('button', { name: '保存反馈' }));

    expect(getDailyTaskLogs()[0]).toMatchObject({
      day: 1,
      status: 'skipped',
      difficulty: 'hard',
    });
  });

  it('shows professional evaluation guidance for safety-gated profiles', () => {
    render(
      <TodayPage
        profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }}
        assessmentResult={null}
        onOpenChat={vi.fn()}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
        onOpenDiary={vi.fn()}
        today="2026-05-10"
      />,
    );

    expect(screen.getByText('优先进行专业评估')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '完成今日任务' })).not.toBeInTheDocument();
  });

  it('opens AI chat with a task-aware initial question', async () => {
    const user = userEvent.setup();
    const onOpenChat = vi.fn();
    render(
      <TodayPage
        profile={profile}
        assessmentResult={null}
        onOpenChat={onOpenChat}
        onOpenAssessment={vi.fn()}
        onOpenKnowledge={vi.fn()}
        onOpenRelaxation={vi.fn()}
        onOpenDiary={vi.fn()}
        today="2026-05-10"
      />,
    );

    await user.click(screen.getByRole('button', { name: '问 AI' }));

    expect(onOpenChat).toHaveBeenCalledWith(undefined, '请解释今天的睡眠改善任务：睡眠环境重置，并告诉我如果做不到应该怎么简化。');
  });
});
