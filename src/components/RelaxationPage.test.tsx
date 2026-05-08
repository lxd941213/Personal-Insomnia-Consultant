import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RelaxationPage } from './RelaxationPage';

describe('RelaxationPage', () => {
  it('starts and completes a relaxation session', async () => {
    const user = userEvent.setup();
    render(<RelaxationPage toolId="breathing-478" onBack={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '开始' }));
    await user.click(screen.getByRole('button', { name: '完成练习' }));
    expect(screen.getByText('本次练习已完成')).toBeInTheDocument();
  });
});