import { summarizeRecentDiary } from './sleepDiary';
import type { DiarySummary, SleepDiaryEntry } from './types';

export interface TrendSummary {
  last7Days: DiarySummary;
  last30Days: DiarySummary;
  insights: string[];
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

function buildInsights(last7Days: DiarySummary): string[] {
  if (last7Days.entryCount === 0) {
    return ['还没有足够的睡眠记录，先完成一次起床记录。'];
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

export function buildTrendSummary(entries: SleepDiaryEntry[], endDate: string): TrendSummary {
  const last7Days = summarizeRecentDiary(entriesInWindow(entries, endDate, 7));
  const last30Days = summarizeRecentDiary(entriesInWindow(entries, endDate, 30));
  return {
    last7Days,
    last30Days,
    insights: buildInsights(last7Days),
  };
}