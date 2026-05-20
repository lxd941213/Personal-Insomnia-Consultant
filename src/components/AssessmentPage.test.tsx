import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssessmentPage } from './AssessmentPage';
import type { SleepProfile } from '../domain/types';

const profile: SleepProfile = {
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

describe('AssessmentPage', () => {
  it('requires all answers before showing report', async () => {
    const onComplete = vi.fn();
    render(<AssessmentPage profile={profile} onComplete={onComplete} onBack={vi.fn()} />);

    // Try to submit without answering
    const submitButton = screen.getByRole('button', { name: '生成自测报告' });
    await userEvent.click(submitButton);

    // Should show validation error
    expect(screen.getByText('请完成所有题目后再生成报告')).toBeVisible();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows a return button on the answering page', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<AssessmentPage profile={profile} onComplete={vi.fn()} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: '返回首页' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('renders Chinese report after all questions answered', async () => {
    const onComplete = vi.fn();
    render(<AssessmentPage profile={profile} onComplete={onComplete} onBack={vi.fn()} />);

    // Answer all ISI questions (7 questions) - click first option in each row
    const isiRows = screen.getAllByTestId(/^rating-row-(isi|psqi)-\d+$/);
    expect(isiRows.length).toBe(13); // 7 ISI + 6 PSQI = 13 total

    // ISI questions are first (rows 0-6)
    for (let i = 0; i < 7; i++) {
      const firstOption = isiRows[i].querySelector('input[type="radio"]');
      if (firstOption) {
        await userEvent.click(firstOption);
      }
    }

    // PSQI questions are next (rows 7-12)
    for (let i = 7; i < 13; i++) {
      const firstOption = isiRows[i].querySelector('input[type="radio"]');
      if (firstOption) {
        await userEvent.click(firstOption);
      }
    }

    const submitButton = screen.getByRole('button', { name: '生成自测报告' });
    await userEvent.click(submitButton);

    expect(screen.getByRole('heading', { name: '睡眠自测报告' })).toBeVisible();
    expect(screen.getByText('总体结论')).toBeVisible();
    expect(screen.getByText('下一步建议')).toBeVisible();
    expect(screen.getByText(/固定每天起床时间/)).toBeVisible();
    expect(screen.getByText(/本内容仅提供健康管理参考/)).toBeVisible();
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      isi: expect.objectContaining({
        score: expect.any(Number),
        level: expect.any(String),
        summary: expect.any(String),
      }),
      psqiLite: expect.objectContaining({
        score: expect.any(Number),
        level: expect.any(String),
        summary: expect.any(String),
      }),
    }));
  });

  it('shows profile safety signals in the report risk flags', async () => {
    const user = userEvent.setup();
    render(
      <AssessmentPage
        profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    for (const row of screen.getAllByTestId(/^rating-row-(isi|psqi)-\d+$/)) {
      const firstOption = row.querySelector('input[type="radio"]');
      if (firstOption) await user.click(firstOption);
    }
    await user.click(screen.getByRole('button', { name: '生成自测报告' }));

    expect(screen.getByText('存在安全信号：疑似睡眠呼吸暂停')).toBeVisible();
    expect(screen.getByText('建议专业评估后再执行普通助眠任务')).toBeVisible();
    expect(screen.getByText('整理睡眠记录')).toBeVisible();
  });

  it('allows uncertain answers with optional context and marks the report as estimated', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<AssessmentPage profile={profile} onComplete={onComplete} onBack={vi.fn()} />);

    const rows = screen.getAllByTestId(/^rating-row-(isi|psqi)-\d+$/);
    for (const row of rows) {
      const firstOption = row.querySelector('input[type="radio"]');
      if (firstOption) await user.click(firstOption);
    }

    await user.click(screen.getByTestId('uncertain-answer-psqi-2'));
    await user.type(
      screen.getByLabelText('补充说明（选填）'),
      '睡眠效率不好判断，但最近常觉得没睡踏实。',
    );
    await user.click(screen.getByRole('button', { name: '生成自测报告' }));

    expect(screen.getByText('本次结果包含估算答案')).toBeVisible();
    expect(screen.getByText(/睡眠效率不好判断/)).toBeVisible();
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      responseQuality: expect.objectContaining({
        confidence: 'estimated',
        uncertainCount: 1,
        note: '睡眠效率不好判断，但最近常觉得没睡踏实。',
      }),
    }));
  });
});
