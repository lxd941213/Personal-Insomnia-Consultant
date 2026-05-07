import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileWizard } from './ProfileWizard';

describe('ProfileWizard', () => {
  it('collects required profile fields, habits, and safety signals', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ProfileWizard onComplete={onComplete} />);

    await user.selectOptions(screen.getByLabelText('Age range'), '25-34');
    await user.type(screen.getByLabelText('Usual bedtime'), '01:00');
    await user.type(screen.getByLabelText('Usual wake time'), '08:00');
    await user.selectOptions(screen.getByLabelText('Main sleep concern'), 'hard_to_fall_asleep');
    await user.selectOptions(screen.getByLabelText('Concern duration'), '1-3 months');
    await user.selectOptions(screen.getByLabelText('Stress level'), 'High');
    await user.click(screen.getByLabelText('Phone use before bed'));
    await user.click(screen.getByLabelText('Suspected sleep apnea'));
    await user.type(screen.getByLabelText('Daytime impact'), 'Tired at work');
    await user.type(screen.getByLabelText('Optional context'), 'I use my phone in bed.');
    await user.click(screen.getByRole('button', { name: 'Start consultation' }));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
      ageRange: '25-34',
      mainConcern: 'hard_to_fall_asleep',
      habits: ['Phone use before bed'],
      safetySignals: ['Suspected sleep apnea'],
      optionalContext: 'I use my phone in bed.',
    }));
  });
});
