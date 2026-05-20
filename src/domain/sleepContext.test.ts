import { describe, expect, it } from 'vitest';
import { buildUserSleepContext } from './sleepContext';
import type { DailyTaskLog, SleepDiaryEntry, SleepProfile, SleepProgram } from './types';

const profile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:30',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '中等',
  habits: ['睡前玩手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

const diaryEntry: SleepDiaryEntry = {
  id: 'diary-2026-05-20',
  date: '2026-05-20',
  bedtimeCheckin: { mood: '焦虑', stressLevel: 4, factors: ['工作消息'], plannedActions: [], notes: '脑子停不下来' },
  wakeCheckin: { sleepStart: '00:30', wakeTime: '07:00', sleepLatencyMinutes: 45, awakenings: 2, sleepQuality: 2, dreamNote: '', daytimeFeeling: '疲惫', notes: '醒来很累' },
  createdAt: '2026-05-20T00:00:00.000Z',
  updatedAt: '2026-05-20T00:00:00.000Z',
  version: 1,
};

const program: SleepProgram = {
  id: 'program-2026-05-20',
  startedAt: '2026-05-20T00:00:00.000Z',
  currentDay: 1,
  status: 'active',
  templateId: 'cbti_foundation_14_day',
  createdAt: '2026-05-20T00:00:00.000Z',
  updatedAt: '2026-05-20T00:00:00.000Z',
  version: 1,
};

const taskLogs: DailyTaskLog[] = [];

describe('buildUserSleepContext', () => {
  it('summarizes diary data and keeps normal safety status for ordinary sleep trouble', () => {
    const context = buildUserSleepContext({
      profile,
      assessmentResult: null,
      diaryEntries: [diaryEntry],
      program,
      taskLogs,
      message: '我最近入睡比较慢',
      today: new Date('2026-05-20T12:00:00.000Z'),
    });

    expect(context.diarySummary?.entryCount).toBe(1);
    expect(context.program?.id).toBe('program-2026-05-20');
    expect(context.taskLogs).toEqual([]);
    expect(context.safetyTriage.level).toBe('normal');
  });

  it('includes recent diary notes in urgent safety triage', () => {
    const context = buildUserSleepContext({
      profile,
      assessmentResult: null,
      diaryEntries: [{ ...diaryEntry, wakeCheckin: { ...diaryEntry.wakeCheckin!, notes: '胸口痛，呼吸困难' } }],
      program,
      taskLogs,
      message: '今晚又睡不着',
      today: new Date('2026-05-20T12:00:00.000Z'),
    });

    expect(context.safetyTriage.level).toBe('urgent');
    expect(context.safetyTriage.shouldBlockAi).toBe(true);
    expect(context.safetyTriage.categories).toContain('chest_pain_or_breathing');
  });
});
