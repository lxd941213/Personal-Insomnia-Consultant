import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyPage } from './MyPage';
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

describe('MyPage', () => {
  beforeEach(() => {
    clearAllLocalData();
  });

  it('renders my page with profile and data management', () => {
    render(<MyPage profile={profile} onOpenResetDrawer={vi.fn()} />);
    expect(screen.getByText('我的')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置档案' })).toBeInTheDocument();
  });

  it('displays profile information', () => {
    render(<MyPage profile={profile} onOpenResetDrawer={vi.fn()} />);
    expect(screen.getByText('睡眠档案')).toBeInTheDocument();
    expect(screen.getByText(/通常睡眠/)).toBeInTheDocument();
  });

  it('calls onOpenResetDrawer when reset button is clicked', async () => {
    const user = userEvent.setup();
    const handleReset = vi.fn();
    render(<MyPage profile={profile} onOpenResetDrawer={handleReset} />);

    await user.click(screen.getByRole('button', { name: '重置档案' }));

    expect(handleReset).toHaveBeenCalled();
  });

  it('saves reminder settings from the my page', async () => {
    const user = userEvent.setup();
    render(<MyPage profile={profile} onOpenResetDrawer={vi.fn()} />);

    await user.clear(screen.getByLabelText('睡前提醒时间'));
    await user.type(screen.getByLabelText('睡前提醒时间'), '22:10');
    await user.clear(screen.getByLabelText('起床提醒时间'));
    await user.type(screen.getByLabelText('起床提醒时间'), '06:50');
    await user.click(screen.getByLabelText('启用睡前提醒'));
    await user.click(screen.getByRole('button', { name: '保存提醒设置' }));

    expect(screen.getByText('提醒设置已保存')).toBeInTheDocument();
    expect(getReminderSettings()).toMatchObject({
      bedtimeEnabled: false,
      bedtimeTime: '22:10',
      wakeEnabled: true,
      wakeTime: '06:50',
    });
  });
});
