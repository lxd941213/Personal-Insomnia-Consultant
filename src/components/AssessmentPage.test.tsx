import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssessmentPage } from './AssessmentPage';

describe('AssessmentPage', () => {
  it('requires all answers before showing report', async () => {
    const onComplete = vi.fn();
    render(<AssessmentPage onComplete={onComplete} />);

    // Try to submit without answering
    const submitButton = screen.getByRole('button', { name: '提交评估' });
    await userEvent.click(submitButton);

    // Should show validation error
    expect(screen.getByText('请回答所有问题')).toBeVisible();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('renders Chinese report after all questions answered', async () => {
    const onComplete = vi.fn();
    render(<AssessmentPage onComplete={onComplete} />);

    // Answer all ISI questions (7 questions) - click first option in each row
    const isiRows = screen.getAllByTestId(/^rating-row-\d+$/);
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

    const submitButton = screen.getByRole('button', { name: '提交评估' });
    await userEvent.click(submitButton);

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
});