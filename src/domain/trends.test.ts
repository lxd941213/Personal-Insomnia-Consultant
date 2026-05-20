import { describe, expect, it } from 'vitest';
import { buildTaskExecutionInsight, buildTrendSummary } from './trends';
import { buildDiaryEntry, upsertWakeCheckin } from './sleepDiary';

function entry(date: string, quality: number, latency: number) {
  return upsertWakeCheckin(buildDiaryEntry(date), {
    sleepStart: '00:00',
    wakeTime: '07:00',
    sleepLatencyMinutes: latency,
    awakenings: 1,
    sleepQuality: quality,
    dreamNote: '',
    daytimeFeeling: '一般',
    notes: '',
  });
}

describe('trend summary', () => {
  it('builds 7 and 30 day windows ending on the selected date', () => {
    const summary = buildTrendSummary([
      entry('2026-04-10', 4, 20),
      entry('2026-05-02', 2, 50),
      entry('2026-05-08', 3, 40),
    ], '2026-05-08');

    expect(summary.last7Days.entryCount).toBe(2);
    expect(summary.last30Days.entryCount).toBe(3);
    expect(summary.last7Days.averageSleepLatencyMinutes).toBe(45);
  });

  it('returns an empty state when there are no wake checkins', () => {
    const summary = buildTrendSummary([], '2026-05-08');
    expect(summary.last7Days.entryCount).toBe(0);
    expect(summary.insights).toContain('还没有足够的睡眠记录，先完成一次起床记录。');
  });

  it('adds local insights for long latency and low quality', () => {
    const summary = buildTrendSummary([
      entry('2026-05-06', 2, 55),
      entry('2026-05-07', 2, 50),
      entry('2026-05-08', 2, 45),
    ], '2026-05-08');

    expect(summary.insights).toEqual(expect.arrayContaining([
      '近 7 天平均入睡耗时偏长，可以优先尝试固定睡前流程和放松训练。',
      '近 7 天主观睡眠质量偏低，建议关注夜醒、压力和睡前刺激因素。',
    ]));
  });

  it('marks trends as empty when no wake records exist', () => {
    const summary = buildTrendSummary([], '2026-05-20');

    expect(summary.recordQuality).toBe('empty');
    expect(summary.insights[0]).toContain('还没有足够');
  });

  it('marks trends as sparse and avoids over-interpreting one or two wake records', () => {
    const summary = buildTrendSummary([
      entry('2026-05-19', 4, 20),
      entry('2026-05-20', 4, 25),
    ], '2026-05-20');

    expect(summary.recordQuality).toBe('sparse');
    expect(summary.insights[0]).toContain('还没有足够');
  });

  it('adds fallback insight when recent task logs are hard or skipped', () => {
    const insight = buildTaskExecutionInsight([
      { day: 1, status: 'skipped', difficulty: 'hard' },
      { day: 2, status: 'completed', difficulty: 'hard' },
      { day: 3, status: 'skipped', difficulty: 'hard' },
    ]);

    expect(insight).toContain('替代动作');
  });
});