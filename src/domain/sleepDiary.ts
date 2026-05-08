import type { BedtimeCheckin, DiarySummary, SleepDiaryEntry, WakeCheckin } from './types';

function nowIso(now = new Date()): string {
  return now.toISOString();
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
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