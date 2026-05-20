import { describe, expect, it } from 'vitest';
import {
  buildConsultationDiarySummary,
  buildDiaryEntry,
  calculateSleepDurationMinutes,
  summarizeRecentDiary,
  upsertBedtimeCheckin,
  upsertWakeCheckin,
  validateWakeCheckin,
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

  it('builds a consultation summary from the last 7 days with recent diary notes', () => {
    const oldEntry = upsertWakeCheckin(buildDiaryEntry('2026-05-10'), {
      sleepStart: '23:00',
      wakeTime: '06:00',
      sleepLatencyMinutes: 10,
      awakenings: 0,
      sleepQuality: 5,
      dreamNote: '',
      daytimeFeeling: '精神好',
      notes: '这条太旧，不应进入咨询摘要',
    });
    const recentEntry = upsertWakeCheckin(upsertBedtimeCheckin(buildDiaryEntry('2026-05-18'), {
      mood: '焦虑',
      stressLevel: 4,
      factors: ['睡前刷手机', '工作压力'],
      plannedActions: [],
      notes: '睡前还在处理工作',
    }), {
      sleepStart: '01:00',
      wakeTime: '06:00',
      sleepLatencyMinutes: 60,
      awakenings: 3,
      sleepQuality: 2,
      dreamNote: '多梦',
      daytimeFeeling: '疲惫',
      notes: '凌晨醒了几次',
    });

    expect(buildConsultationDiarySummary(
      [oldEntry, recentEntry],
      new Date('2026-05-19T12:00:00.000Z'),
    )).toMatchObject({
      entryCount: 1,
      daysWindow: 7,
      dateRange: { from: '2026-05-13', to: '2026-05-19' },
      averageSleepDurationMinutes: 300,
      averageSleepLatencyMinutes: 60,
      averageAwakenings: 3,
      averageSleepQuality: 2,
      recentFactors: ['睡前刷手机', '工作压力'],
      recentNotes: ['睡前还在处理工作', '凌晨醒了几次'],
    });
  });

  it('validates complete wake checkin values', () => {
    expect(validateWakeCheckin({
      sleepStart: '23:30',
      wakeTime: '07:00',
      sleepLatencyMinutes: 25,
      awakenings: 1,
      sleepQuality: 4,
      dreamNote: '',
      daytimeFeeling: '还可以',
      notes: '',
    })).toEqual([]);
  });

  it('rejects missing or out-of-range wake checkin values', () => {
    expect(validateWakeCheckin({
      sleepStart: '',
      wakeTime: '07:00',
      sleepLatencyMinutes: -1,
      awakenings: -1,
      sleepQuality: 8,
      dreamNote: '',
      daytimeFeeling: '',
      notes: '',
    })).toEqual([
      '请填写入睡时间',
      '入睡耗时需在 0-300 分钟之间',
      '夜醒次数需在 0-20 次之间',
      '睡眠质量需在 1-5 之间',
    ]);
  });
});
