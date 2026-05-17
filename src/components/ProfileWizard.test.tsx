import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileWizard } from './ProfileWizard';

describe('ProfileWizard', () => {
  it('collects required profile fields, habits, and safety signals', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ProfileWizard onComplete={onComplete} />);

    await user.selectOptions(screen.getByLabelText('年龄段'), '25-34岁');
    await user.type(screen.getByLabelText('就寝时间'), '01:00');
    await user.type(screen.getByLabelText('起床时间'), '08:00');
    await user.selectOptions(screen.getByLabelText('主要睡眠问题'), 'hard_to_fall_asleep');
    await user.selectOptions(screen.getByLabelText('问题持续时间'), '1-3个月');
    await user.selectOptions(screen.getByLabelText('压力水平'), '很高');
    await user.click(screen.getByRole('button', { name: '睡前玩手机' }));
    await user.click(screen.getByRole('button', { name: '疑似睡眠呼吸暂停' }));
    await user.type(screen.getByLabelText('白天影响（选填）'), 'Tired at work');
    await user.type(screen.getByLabelText('补充说明（选填）'), 'I use my phone in bed.');
    await user.click(screen.getByRole('button', { name: '开始咨询' }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      ageRange: '25-34岁',
      mainConcern: 'hard_to_fall_asleep',
      habits: ['睡前玩手机'],
      safetySignals: ['疑似睡眠呼吸暂停'],
      optionalContext: 'I use my phone in bed.',
    }));
  });

  it('collects enhanced personalization fields', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ProfileWizard onComplete={onComplete} />);

    await user.selectOptions(screen.getByLabelText('年龄段'), '35-44岁');
    await user.selectOptions(screen.getByLabelText('性别'), 'female');
    await user.type(screen.getByLabelText('就寝时间'), '23:30');
    await user.type(screen.getByLabelText('起床时间'), '06:30');
    await user.selectOptions(screen.getByLabelText('睡眠时长'), '5');
    await user.selectOptions(screen.getByLabelText('主要睡眠问题'), 'early_waking');
    await user.selectOptions(screen.getByLabelText('问题持续时间'), '3个月以上');
    await user.selectOptions(screen.getByLabelText('压力水平'), '很高');
    await user.click(screen.getByRole('button', { name: '焦虑' }));
    await user.selectOptions(screen.getByLabelText('运动习惯'), '每周1-2次轻运动');
    await user.click(screen.getByRole('button', { name: '午后咖啡因' }));
    await user.selectOptions(screen.getByLabelText('手机使用习惯'), '睡前1小时内频繁使用');
    await user.click(screen.getByRole('button', { name: '长期使用助眠药' }));
    await user.click(screen.getByRole('button', { name: '慢性病' }));
    await user.type(screen.getByLabelText('白天影响（选填）'), '白天工作受影响');
    await user.click(screen.getByRole('button', { name: '开始咨询' }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      gender: 'female',
      sleepDurationHours: '5',
      emotionState: ['焦虑'],
      exerciseHabit: '每周1-2次轻运动',
      dietHabit: ['午后咖啡因'],
      phoneUsageHabit: '睡前1小时内频繁使用',
      medicationStatus: ['长期使用助眠药'],
      medicalConditions: ['慢性病'],
    }));
  });
});
