import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackControl } from './FeedbackControl';

describe('FeedbackControl', () => {
  it('shows which feedback option was recorded', async () => {
    const onFeedback = vi.fn();
    render(<FeedbackControl onFeedback={onFeedback} />);

    await userEvent.click(screen.getByRole('button', { name: '没用' }));

    expect(onFeedback).toHaveBeenCalledWith('not_useful');
    expect(screen.getByRole('button', { name: '没用' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('已记录反馈')).toBeVisible();
  });
});
