import { summarizeRecentDiary } from './sleepDiary';
import type { DiarySummary, SleepDiaryEntry } from './types';

export type TrendRecordQuality = 'empty' | 'sparse' | 'usable';

export interface TrendSummary {
  last7Days: DiarySummary;
  last30Days: DiarySummary;
  insights: string[];
  recordQuality: TrendRecordQuality;
}

function dateToTime(date: string): number {
  return new Date(date).getTime();
}

function entriesInWindow(entries: SleepDiaryEntry[], endDate: string, days: number): SleepDiaryEntry[] {
  const end = dateToTime(endDate);
  const start = end - (days - 1) * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => {
    const current = dateToTime(entry.date);
    return current >= start && current <= end && entry.wakeCheckin;
  });
}

function recordQuality(entryCount: number): TrendRecordQuality {
  if (entryCount === 0) return 'empty';
  if (entryCount < 3) return 'sparse';
  return 'usable';
}

function buildInsights(last7Days: DiarySummary, quality: TrendRecordQuality): string[] {
  if (last7Days.entryCount === 0) {
    return ['还没有足够的睡眠记录，先完成一次起床记录。'];
  }
  if (quality === 'sparse') {
    return ['还没有足够的连续记录，先避免过度解读趋势，继续完成起床记录。'];
  }

  const insights: string[] = [];
  if ((last7Days.averageSleepLatencyMinutes ?? 0) >= 45) {
    insights.push('近 7 天平均入睡耗时偏长，可以优先尝试固定睡前流程和放松训练。');
  }
  if ((last7Days.averageSleepQuality ?? 5) <= 2.5) {
    insights.push('近 7 天主观睡眠质量偏低，建议关注夜醒、压力和睡前刺激因素。');
  }
  if (insights.length === 0) {
    insights.push('近 7 天记录较稳定，可以继续保持当前作息并观察变化。');
  }
  return insights;
}

export function buildTaskExecutionInsight(
  logs: Array<{ status: 'completed' | 'skipped'; difficulty: 'easy' | 'ok' | 'hard' | null; day: number }>,
): string {
  const recent = [...logs].sort((a, b) => a.day - b.day).slice(-3);
  const hardOrSkipped = recent.filter((entry) => entry.status === 'skipped' || entry.difficulty === 'hard').length;
  if (logs.length === 0) return '任务和睡眠记录较少，先完成一次今日任务，暂不判断改善趋势。';
  if (hardOrSkipped >= 2) return '最近任务多次跳过或偏难，建议优先使用替代动作，降低任务强度。';
  return '任务执行已有记录，继续结合入睡耗时、夜醒和白天精力观察变化。';
}

export function buildTrendSummary(entries: SleepDiaryEntry[], endDate: string): TrendSummary {
  const last7Days = summarizeRecentDiary(entriesInWindow(entries, endDate, 7));
  const last30Days = summarizeRecentDiary(entriesInWindow(entries, endDate, 30));
  const quality = recordQuality(last7Days.entryCount);
  return {
    last7Days,
    last30Days,
    insights: buildInsights(last7Days, quality),
    recordQuality: quality,
  };
}