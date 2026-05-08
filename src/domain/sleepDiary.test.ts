import { describe, expect, it } from 'vitest';
import {
  buildDiaryEntry,
  calculateSleepDurationMinutes,
  summarizeRecentDiary,
  upsertBedtimeCheckin,
  upsertWakeCheckin,
} from './sleepDiary';

describe('sleep diary helpers', () => {
  it('creates one sync-ready entry per date and updates bedtime and wake sections independently', () => {
    const base = buildDiaryEntry('2026-05-08', new Date('2026-05-08T12:00:00.000Z'));
    const withBedtime = upsertBedtimeCheckin(base, {
      mood: '紧张',
      stressLevel: 4,
      factors: ['睡前玩手机'],
      plannedActions: ['4-7-8 呼吸'],
      notes: '今晚工作较晚',
    }, new Date('2026-05-08T13:00:00.000Z'));
    const withWake = upsertWakeCheckin(withBedtime, {
      sleepStart: '23:40',
      wakeTime: '07:10',
      sleepLatencyMinutes: 35,
      awakenings: 2,
      sleepQuality: 3,
      dreamNote: '多梦',
      daytimeFeeling: '疲惫',
      notes: '凌晨醒过两次',
    }, new Date('2026-05-09T00:00:00.000Z'));

    expect(withWake).toMatchObject({
      date: '2026-05-08',
      version: 3,
      bedtimeCheckin: { mood: '紧张', stressLevel: 4 },
      wakeCheckin: { sleepStart: '23:40', wakeTime: '07:10', awakenings: 2 },
    });
    expect(withWake.id).toBe('diary-2026-05-08');
    expect(withWake.createdAt).toBe('2026-05-08T12:00:00.000Z');
    expect(withWake.updatedAt).toBe('2026-05-09T00:00:00.000Z');
  });

  it('calculates sleep duration across midnight', () => {
    expect(calculateSleepDurationMinutes('23:30', '07:00')).toBe(450);
    expect(calculateSleepDurationMinutes('00:30', '06:45')).toBe(375);
  });

  it('summarizes recent wake checkins for recommendations', () => {
    const entries = ['2026-05-06', '2026-05-07', '2026-05-08'].map((date, index) =>
      upsertWakeCheckin(buildDiaryEntry(date), {
        sleepStart: '00:30',
        wakeTime: '06:30',
        sleepLatencyMinutes: 45 + index * 5,
        awakenings: 2,
        sleepQuality: 2,
        dreamNote: '',
        daytimeFeeling: '疲惫',
        notes: '',
      }),
    );

    expect(summarizeRecentDiary(entries)).toMatchObject({
      entryCount: 3,
      averageSleepDurationMinutes: 360,
      averageSleepLatencyMinutes: 50,
      averageAwakenings: 2,
      averageSleepQuality: 2,
    });
  });
});