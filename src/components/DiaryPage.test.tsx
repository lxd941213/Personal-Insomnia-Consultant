import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { DiaryPage } from './DiaryPage';
import { clearAllLocalData, getDiaryEntries } from '../storage/localStore';

describe('DiaryPage', () => {
  beforeEach(() => {
    clearAllLocalData();
  });

  it('saves complete bedtime and wake checkins for the same date', async () => {
    const user = userEvent.setup();
    render(<DiaryPage selectedDate="2026-05-08" />);

    await user.type(screen.getByLabelText('睡前情绪'), '紧张');
    await user.clear(screen.getByLabelText('压力程度'));
    await user.type(screen.getByLabelText('压力程度'), '4');
    await user.type(screen.getByLabelText('影响因素'), '睡前玩手机、工作消息');
    await user.type(screen.getByLabelText('计划完成'), '4-7-8 呼吸');
    await user.type(screen.getByLabelText('睡前备注'), '今晚工作较晚');
    await user.click(screen.getByRole('button', { name: '保存睡前记录' }));

    await user.type(screen.getByLabelText('入睡时间'), '23:40');
    await user.type(screen.getByLabelText('起床时间'), '07:10');
    await user.type(screen.getByLabelText('入睡耗时'), '35');
    await user.clear(screen.getByLabelText('夜醒次数'));
    await user.type(screen.getByLabelText('夜醒次数'), '2');
    await user.clear(screen.getByLabelText('睡眠质量'));
    await user.type(screen.getByLabelText('睡眠质量'), '3');
    await user.type(screen.getByLabelText('梦境记录'), '多梦');
    await user.type(screen.getByLabelText('白天状态'), '疲惫');
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
        sleepLatencyMinutes: 35,
        awakenings: 2,
        sleepQuality: 3,
        dreamNote: '多梦',
        daytimeFeeling: '疲惫',
        notes: '凌晨醒过两次',
      },
    });
  });
});
