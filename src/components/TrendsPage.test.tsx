import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrendsPage } from './TrendsPage';
import type { DailyTaskLog, SleepDiaryEntry, SleepProfile } from '../domain/types';

const storageMock = vi.hoisted(() => ({
  diaryEntries: [] as SleepDiaryEntry[],
  dailyTaskLogs: [{
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
  }] as DailyTaskLog[],
}));

const hardLog: DailyTaskLog = {
  id: 'log-1',
  programId: 'program-1',
  day: 1,
  date: '2026-05-10',
  status: 'skipped' as const,
  difficulty: 'hard' as const,
  sleepQuality: 7,
  sleepLatencyMinutes: 25,
  awakenings: 1,
  daytimeEnergy: '一般',
  note: '',
  createdAt: '2026-05-10T08:00:00.000Z',
  updatedAt: '2026-05-10T08:00:00.000Z',
  version: 1,
};

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:30',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '中等',
  habits: [],
  daytimeImpact: '白天疲惫',
  safetySignals: ['疑似睡眠呼吸暂停'],
  optionalContext: '',
};

vi.mock('../storage/localStore', async () => {
  const actual = await vi.importActual<typeof import('../storage/localStore')>('../storage/localStore');
  return {
    ...actual,
    getDiaryEntries: vi.fn(() => storageMock.diaryEntries),
    getDailyTaskLogs: vi.fn(() => storageMock.dailyTaskLogs),
  };
});

describe('TrendsPage', () => {
  it('renders empty state when no diary data exists', () => {
    render(<TrendsPage today="2026-05-08" />);
    expect(screen.getByText('本周概览')).toBeInTheDocument();
    expect(screen.getByText('核心指标')).toBeInTheDocument();
    expect(screen.getByText('趋势洞察')).toBeInTheDocument();
    expect(screen.getByText(/还没有足够的睡眠记录/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去补充起床记录' })).toBeInTheDocument();
  });

  it('renders program completion metrics and conservative insight copy', () => {
    render(<TrendsPage today="2026-05-10" />);

    expect(screen.getAllByText('改善执行').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('任务完成率 100%')).toBeInTheDocument();
    expect(screen.getByText(/记录还不够/)).toBeInTheDocument();
  });

  it('renders fallback insight when recent task logs are hard or skipped', () => {
    storageMock.dailyTaskLogs = [
      { ...hardLog, id: 'log-1', day: 1, status: 'skipped', difficulty: 'hard' },
      { ...hardLog, id: 'log-2', day: 2, status: 'completed', difficulty: 'hard' },
      { ...hardLog, id: 'log-3', day: 3, status: 'skipped', difficulty: 'hard' },
    ];

    render(<TrendsPage today="2026-05-10" />);

    expect(screen.getByText(/替代动作/)).toBeInTheDocument();
    expect(screen.getByText(/记录还不够，先避免过度解读/)).toBeInTheDocument();
  });

  it('prioritizes safety guidance over trend interpretation when safety escalates', () => {
    render(<TrendsPage profile={{ ...profile, safetySignals: ['疑似睡眠呼吸暂停'] }} today="2026-05-20" />);

    expect(screen.getByText('建议专业评估后再执行普通助眠任务')).toBeInTheDocument();
    expect(screen.getByText('整理睡眠记录')).toBeInTheDocument();
  });
});
