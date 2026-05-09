import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RelaxationPage } from './RelaxationPage';
import { clearAllLocalData, getRelaxationSessions } from '../storage/localStore';

describe('RelaxationPage', () => {
  beforeEach(() => {
    clearAllLocalData();
  });

  it('starts and completes a relaxation session', async () => {
    vi.useFakeTimers();
    render(<RelaxationPage toolId="breathing-478" onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    expect(screen.getByText('当前步骤：吸气 4 秒')).toBeInTheDocument();
    expect(screen.getByText('剩余 19 秒')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText('剩余 14 秒')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '暂停' }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText('剩余 14 秒')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.click(screen.getByRole('button', { name: '完成练习' }));

    expect(screen.getByText('本次练习已完成')).toBeInTheDocument();
    expect(getRelaxationSessions().at(-1)).toMatchObject({
      toolId: 'breathing-478',
      status: 'completed',
      durationSeconds: 7,
    });
    vi.useRealTimers();
  });
});
