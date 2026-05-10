import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrendsPage } from './TrendsPage';

const mockLog = {
  id: 'log-1',
  programId: 'program-1',
  day: 1,
  date: '2026-05-10',
  status: 'completed' as const,
  difficulty: 'ok' as const,
  sleepQuality: 7,
  sleepLatencyMinutes: 25,
  awakenings: 1,
  daytimeEnergy: '一般',
  note: '',
  createdAt: '2026-05-10T08:00:00.000Z',
  updatedAt: '2026-05-10T08:00:00.000Z',
  version: 1,
};

vi.mock('../storage/localStore', async () => {
  const actual = await vi.importActual<typeof import('../storage/localStore')>('../storage/localStore');
  return {
    ...actual,
    getDiaryEntries: vi.fn(() => []),
    getDailyTaskLogs: vi.fn(() => [mockLog]),
  };
});

describe('TrendsPage', () => {
  it('renders empty state when no diary data exists', () => {
    render(<TrendsPage today="2026-05-08" />);
    expect(screen.getByText(/还没有足够的睡眠记录/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去记录睡前状态' })).toBeInTheDocument();
  });

  it('renders program completion metrics and conservative insight copy', () => {
    render(<TrendsPage today="2026-05-10" />);

    expect(screen.getByText('改善执行')).toBeInTheDocument();
    expect(screen.getByText(/完成率 100%/)).toBeInTheDocument();
    expect(screen.getByText(/记录较少/)).toBeInTheDocument();
  });
});