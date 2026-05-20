import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { DiaryPage } from './DiaryPage';
import { clearAllLocalData, getDiaryEntries } from '../storage/localStore';

describe('DiaryPage', () => {
  beforeEach(() => {
    clearAllLocalData();
  });

  it('saves complete bedtime and wake checkins from guided choices for the same date', async () => {
    const user = userEvent.setup();
    render(<DiaryPage selectedDate="2026-05-08" />);

    await user.click(screen.getByRole('button', { name: '紧张' }));
    await user.click(screen.getByRole('button', { name: '较高' }));
    await user.click(screen.getByRole('button', { name: '睡前玩手机' }));
    await user.click(screen.getByRole('button', { name: '工作消息' }));
    await user.click(screen.getByRole('button', { name: '4-7-8 呼吸' }));
    await user.type(screen.getByLabelText('睡前备注'), '今晚工作较晚');
    await user.click(screen.getByRole('button', { name: '保存睡前记录' }));

    // Switch to wake tab
    await user.click(screen.getByRole('button', { name: /起床记录/ }));

    await user.type(screen.getByLabelText('入睡时间'), '23:40');
    await user.type(screen.getByLabelText('起床时间'), '07:10');
    await user.click(screen.getByRole('button', { name: '31-60分钟' }));
    await user.click(screen.getByRole('button', { name: '2次' }));
    await user.click(screen.getByRole('button', { name: '一般' }));
    await user.click(screen.getByRole('button', { name: '多梦' }));
    await user.click(screen.getByRole('button', { name: '疲惫' }));
    await user.type(screen.getByLabelText('起床备注'), '凌晨醒过两次');
    await user.click(screen.getByRole('button', { name: '保存起床记录' }));

    expect(screen.getByText('已保存 2026-05-08 的睡眠日记')).toBeInTheDocument();
    expect(getDiaryEntries()[0]).toMatchObject({
      date: '2026-05-08',
      bedtimeCheckin: {
        mood: '紧张',
        stressLevel: 4,
        factors: ['睡前玩手机', '工作消息'],
        plannedActions: ['4-7-8 呼吸'],
        notes: '今晚工作较晚',
      },
      wakeCheckin: {
        sleepStart: '23:40',
        wakeTime: '07:10',
        sleepLatencyMinutes: 45,
        awakenings: 2,
        sleepQuality: 3,
        dreamNote: '多梦',
        daytimeFeeling: '疲惫',
        notes: '凌晨醒过两次',
      },
    });
  });

  it('reloads form values when switching between dates', async () => {
    const user = userEvent.setup();
    render(<DiaryPage selectedDate="2026-05-20" />);

    await user.click(screen.getByRole('button', { name: '紧张' }));
    await user.type(screen.getByLabelText('睡前备注'), '第一天');
    await user.click(screen.getByRole('button', { name: '保存睡前记录' }));

    await user.click(screen.getByRole('button', { name: /19/ }));
    expect(screen.getByLabelText('睡前备注')).toHaveValue('');

    await user.type(screen.getByLabelText('睡前备注'), '第二天');
    await user.click(screen.getByRole('button', { name: '保存睡前记录' }));

    const entries = getDiaryEntries();
    expect(entries.find((entry) => entry.date === '2026-05-20')?.bedtimeCheckin?.notes).toBe('第一天');
    expect(entries.find((entry) => entry.date === '2026-05-19')?.bedtimeCheckin?.notes).toBe('第二天');
  });

  it('shows validation error and does not save invalid wake checkin', async () => {
    const user = userEvent.setup();
    render(<DiaryPage selectedDate="2026-05-20" />);

    await user.click(screen.getByRole('button', { name: /起床记录/ }));
    await user.click(screen.getByRole('button', { name: '保存起床记录' }));

    expect(screen.getByRole('alert')).toHaveTextContent('请填写入睡时间');
    expect(getDiaryEntries()).toHaveLength(0);
  });
});
