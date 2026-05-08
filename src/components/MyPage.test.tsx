import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MyPage } from './MyPage';
import type { SleepProfile } from '../domain/types';

describe('MyPage', () => {
  it('renders my page with profile and data management', () => {
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
    render(<MyPage profile={profile} onReset={vi.fn()} />);
    expect(screen.getByText('我的')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置档案' })).toBeInTheDocument();
  });

  it('displays profile information', () => {
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
    render(<MyPage profile={profile} onReset={vi.fn()} />);
    expect(screen.getByText('睡眠档案')).toBeInTheDocument();
    expect(screen.getByText(/通常睡眠/)).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
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
    const handleReset = vi.fn();
    render(<MyPage profile={profile} onReset={handleReset} />);

    await user.click(screen.getByRole('button', { name: '重置档案' }));

    expect(handleReset).toHaveBeenCalled();
  });
});
