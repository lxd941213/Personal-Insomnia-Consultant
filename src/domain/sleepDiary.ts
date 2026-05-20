import type { BedtimeCheckin, ConsultationDiarySummary, DiarySummary, SleepDiaryEntry, WakeCheckin } from './types';

function nowIso(now = new Date()): string {
  return now.toISOString();
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBefore(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function pushUnique(target: string[], values: string[]): void {
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      if (!target.includes(value)) target.push(value);
    });
}

export function buildDiaryEntry(date: string, now = new Date()): SleepDiaryEntry {
  const iso = nowIso(now);
  return {
    id: `diary-${date}`,
    date,
    bedtimeCheckin: null,
    wakeCheckin: null,
    createdAt: iso,
    updatedAt: iso,
    version: 1,
  };
}

export function upsertBedtimeCheckin(
  entry: SleepDiaryEntry,
  bedtimeCheckin: BedtimeCheckin,
  now = new Date(),
): SleepDiaryEntry {
  return {
    ...entry,
    bedtimeCheckin,
    updatedAt: nowIso(now),
    version: entry.version + 1,
  };
}

export function upsertWakeCheckin(
  entry: SleepDiaryEntry,
  wakeCheckin: WakeCheckin,
  now = new Date(),
): SleepDiaryEntry {
  return {
    ...entry,
    wakeCheckin,
    updatedAt: nowIso(now),
    version: entry.version + 1,
  };
}

export function validateWakeCheckin(wakeCheckin: WakeCheckin): string[] {
  const errors: string[] = [];
  if (!wakeCheckin.sleepStart) errors.push('请填写入睡时间');
  if (!wakeCheckin.wakeTime) errors.push('请填写起床时间');
  if (wakeCheckin.sleepLatencyMinutes < 0 || wakeCheckin.sleepLatencyMinutes > 300) {
    errors.push('入睡耗时需在 0-300 分钟之间');
  }
  if (wakeCheckin.awakenings < 0 || wakeCheckin.awakenings > 20) {
    errors.push('夜醒次数需在 0-20 次之间');
  }
  if (wakeCheckin.sleepQuality < 1 || wakeCheckin.sleepQuality > 5) {
    errors.push('睡眠质量需在 1-5 之间');
  }
  return errors;
}

export function calculateSleepDurationMinutes(sleepStart: string, wakeTime: string): number {
  const [startHour, startMinute] = sleepStart.split(':').map(Number);
  const [wakeHour, wakeMinute] = wakeTime.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  let wakeTotal = wakeHour * 60 + wakeMinute;
  if (wakeTotal <= startTotal) {
    wakeTotal += 24 * 60;
  }
  return wakeTotal - startTotal;
}

export function summarizeRecentDiary(entries: SleepDiaryEntry[]): DiarySummary {
  const wakeEntries = entries
    .filter((entry) => entry.wakeCheckin)
    .map((entry) => entry.wakeCheckin as WakeCheckin);

  return {
    entryCount: wakeEntries.length,
    averageSleepDurationMinutes: average(
      wakeEntries.map((entry) => calculateSleepDurationMinutes(entry.sleepStart, entry.wakeTime)),
    ),
    averageSleepLatencyMinutes: average(wakeEntries.map((entry) => entry.sleepLatencyMinutes)),
    averageAwakenings: average(wakeEntries.map((entry) => entry.awakenings)),
    averageSleepQuality: average(wakeEntries.map((entry) => entry.sleepQuality)),
  };
}

export function buildConsultationDiarySummary(
  entries: SleepDiaryEntry[],
  today = new Date(),
  daysWindow = 7,
): ConsultationDiarySummary {
  const to = dateOnly(today);
  const from = dateOnly(daysBefore(today, daysWindow - 1));
  const recentEntries = entries
    .filter((entry) => entry.date >= from && entry.date <= to)
    .sort((a, b) => b.date.localeCompare(a.date));
  const summary = summarizeRecentDiary(recentEntries);
  const recentFactors: string[] = [];
  const recentNotes: string[] = [];

  recentEntries.forEach((entry) => {
    pushUnique(recentFactors, entry.bedtimeCheckin?.factors ?? []);
    pushUnique(recentNotes, [
      entry.bedtimeCheckin?.notes ?? '',
      entry.wakeCheckin?.notes ?? '',
    ]);
  });

  return {
    ...summary,
    daysWindow,
    dateRange: { from, to },
    recentFactors: recentFactors.slice(0, 8),
    recentNotes: recentNotes.slice(0, 5),
  };
}
