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
    await user.type(screen.getByLabelText('通常就寝时间'), '01:00');
    await user.type(screen.getByLabelText('通常起床时间'), '08:00');
    await user.selectOptions(screen.getByLabelText('主要睡眠问题'), 'hard_to_fall_asleep');
    await user.selectOptions(screen.getByLabelText('问题持续时间'), '1-3个月');
    await user.selectOptions(screen.getByLabelText('压力水平'), '很高');
    await user.click(screen.getByRole('button', { name: '睡前玩手机' }));
    await user.click(screen.getByRole('button', { name: '疑似睡眠呼吸暂停' }));
    await user.type(screen.getByLabelText('白天影响'), 'Tired at work');
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
});
