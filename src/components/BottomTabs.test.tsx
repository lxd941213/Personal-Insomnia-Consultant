import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomTabs } from './BottomTabs';

describe('BottomTabs', () => {
  it('renders bottom tabs in Chinese and switches tabs', async () => {
    render(<BottomTabs active="today" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '首页' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '日记' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '趋势' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '方案' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '我的' })).toBeInTheDocument();
  });

  it('calls onChange when tab is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<BottomTabs active="today" onChange={handleChange} />);

    await user.click(screen.getByRole('button', { name: '日记' }));

    expect(handleChange).toHaveBeenCalledWith('diary');
  });

  it('applies active class to the active tab', () => {
    render(<BottomTabs active="today" onChange={() => {}} />);

    const todayButton = screen.getByRole('button', { name: '首页' });
    expect(todayButton).toHaveClass(/active/);
  });
});
