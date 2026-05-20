import { describe, expect, it } from 'vitest';
import {
  buildDailyTaskLog,
  buildProgramContextForPrompt,
  buildProgramReview,
  buildProgramStats,
  createSleepProgram,
  buildPersonalizedProgramTasks,
  getProgramTaskTemplate,
  resolveProgramState,
  resolveTodayProgramTask,
  upsertDailyTaskLog,
} from './program';
import type { AssessmentResult, DailyTaskLog, DiarySummary, SleepProfile } from './types';

const baseProfile: SleepProfile = {
  ageRange: '25-34岁',
  bedtime: '23:30',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3个月',
  stressLevel: '较高',
  habits: ['睡前玩手机'],
  daytimeImpact: '白天疲惫',
  safetySignals: [],
  optionalContext: '',
};

const mildAssessment: AssessmentResult = {
  completedAt: '2026-05-09T00:00:00.000Z',
  isi: { answers: [], score: 10, level: 'mild', summary: '轻度失眠' },
  psqiLite: { answers: [], score: 7, level: 'fair', summary: '一般' },
  riskFlags: [],
};

const longLatencyDiary: DiarySummary = {
  entryCount: 4,
  averageSleepDurationMinutes: 330,
  averageSleepLatencyMinutes: 70,
  averageAwakenings: 1,
  averageSleepQuality: 3,
};

const frequentWakingDiary: DiarySummary = {
  entryCount: 4,
  averageSleepDurationMinutes: 360,
  averageSleepLatencyMinutes: 25,
  averageAwakenings: 4,
  averageSleepQuality: 2,
};

function log(day: number, status: 'completed' | 'skipped', date = `2026-05-${String(day).padStart(2, '0')}`): DailyTaskLog {
  return {
    id: `log-${day}`,
    programId: 'program-1',
    day,
    date,
    status,
    difficulty: status === 'completed' ? 'ok' : 'hard',
    sleepQuality: 6,
    sleepLatencyMinutes: 30,
    awakenings: 1,
    daytimeEnergy: '一般',
    note: '',
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
    version: 1,
  };
}

describe('program domain', () => {
  it('defines a complete 14-day template with evidence labels and fallback actions', () => {
    const template = getProgramTaskTemplate();

    expect(template).toHaveLength(14);
    expect(template[0]).toMatchObject({
      day: 1,
      evidenceLabel: '睡眠卫生',
      estimatedMinutes: expect.any(Number),
    });
    expect(template[7]).toMatchObject({
      day: 8,
      evidenceLabel: 'CBT-I',
    });
    expect(template.every((task) => task.fallbackAction.length > 0)).toBe(true);
  });

  it('creates an active program for normal-risk users', () => {
    const program = createSleepProgram({
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });

    expect(program.status).toBe('active');
    expect(program.currentDay).toBe(1);
    expect(program.templateId).toBe('cbti_foundation_14_day');
  });

  it('personalizes the 14-day task order for long sleep latency', () => {
    const tasks = buildPersonalizedProgramTasks({
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: longLatencyDiary,
    });

    expect(tasks).toHaveLength(14);
    expect(tasks.map((task) => task.day)).toEqual(Array.from({ length: 14 }, (_, index) => index + 1));
    expect(tasks.slice(0, 4).map((task) => task.title)).toEqual(expect.arrayContaining([
      '固定起床时间',
      '刺激控制入门',
    ]));
    expect(tasks[0].rationale).toContain('最近入睡耗时约 70 分钟');
  });

  it('personalizes the 14-day task order for frequent awakenings and poor sleep quality', () => {
    const tasks = buildPersonalizedProgramTasks({
      profile: { ...baseProfile, mainConcern: 'frequent_waking' },
      assessmentResult: { ...mildAssessment, psqiLite: { ...mildAssessment.psqiLite, level: 'poor' } },
      diarySummary: frequentWakingDiary,
    });

    expect(tasks.slice(0, 5).map((task) => task.title)).toEqual(expect.arrayContaining([
      '夜醒应对',
      '睡眠环境重置',
    ]));
    expect(tasks.find((task) => task.title === '夜醒应对')?.rationale).toContain('平均夜醒约 4 次');
  });

  it('marks the program as needs_care for urgent safety signals', () => {
    const program = createSleepProgram({
      profile: { ...baseProfile, safetySignals: ['疑似睡眠呼吸暂停'] },
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });

    expect(program.status).toBe('needs_care');
  });

  it('marks the program as needs_care for severe ISI', () => {
    const program = createSleepProgram({
      profile: baseProfile,
      assessmentResult: {
        ...mildAssessment,
        isi: { answers: [], score: 23, level: 'severe', summary: '重度失眠' },
      },
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });

    expect(program.status).toBe('needs_care');
  });

  it('resolves today task and marks completed days from logs', () => {
    const program = createSleepProgram({
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });
    const state = resolveProgramState({
      program,
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      logs: [log(1, 'completed'), log(2, 'completed')],
      today: '2026-05-12',
    });

    expect(state.program.currentDay).toBe(3);
    expect(resolveTodayProgramTask(state).task.day).toBe(3);
    expect(resolveTodayProgramTask(state).status).toBe('today');
  });

  it('keeps the same program day after feedback is saved on the start date', () => {
    const program = createSleepProgram({
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      now: new Date('2026-05-10T08:00:00.000Z'),
    });

    const sameDayState = resolveProgramState({
      program,
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      logs: [log(1, 'completed', '2026-05-10')],
      today: '2026-05-10',
    });
    const nextDayState = resolveProgramState({
      program,
      profile: baseProfile,
      assessmentResult: mildAssessment,
      diarySummary: undefined,
      logs: [log(1, 'completed', '2026-05-10')],
      today: '2026-05-11',
    });

    expect(sameDayState.program.currentDay).toBe(1);
    expect(resolveTodayProgramTask(sameDayState).status).toBe('completed');
    expect(nextDayState.program.currentDay).toBe(2);
    expect(resolveTodayProgramTask(nextDayState).status).toBe('today');
  });

  it('calculates streak, completion rate, and fallback recommendation', () => {
    const stats = buildProgramStats([log(1, 'completed'), log(2, 'skipped'), log(3, 'skipped')]);

    expect(stats.completedCount).toBe(1);
    expect(stats.skippedCount).toBe(2);
    expect(stats.completionRate).toBe(33);
    expect(stats.currentStreak).toBe(0);
    expect(stats.needsFallback).toBe(true);
  });

  it('builds review data for day 7 and day 14 without over-attribution', () => {
    const review = buildProgramReview([1, 2, 3, 4, 5, 6, 7].map((day) => log(day, 'completed')), 7);

    expect(review).toEqual({
      title: '第 1 周复盘',
      summary: '已完成 7 个任务，完成率 100%。睡眠变化需要结合更多记录继续观察。',
      nextStep: '继续进入第 2 周，重点观察夜醒、担忧和刺激控制相关任务。',
    });
  });

  it('formats compact program context for AI prompt', () => {
    const context = buildProgramContextForPrompt({
      currentDay: 3,
      todayTask: getProgramTaskTemplate()[2],
      stats: buildProgramStats([log(1, 'completed'), log(2, 'skipped')]),
      safetyStatus: 'active',
    });

    expect(context).toContain('当前 14 天改善计划：第 3 天');
    expect(context).toContain('今日任务');
    expect(context).toContain('禁止覆盖安全分流规则');
  });

  it('builds a daily task log from task feedback', () => {
    const taskLog = buildDailyTaskLog({
      programId: 'program-2026-05-20',
      day: 2,
      date: '2026-05-21',
      status: 'completed',
      difficulty: 'easy',
      sleepQuality: 4,
      sleepLatencyMinutes: 25,
      awakenings: 1,
      daytimeEnergy: '精神不错',
      note: '手机放远了',
      now: new Date('2026-05-21T08:00:00.000Z'),
    });

    expect(taskLog).toMatchObject({
      id: 'task-log-program-2026-05-20-2',
      programId: 'program-2026-05-20',
      day: 2,
      date: '2026-05-21',
      status: 'completed',
      difficulty: 'easy',
      sleepQuality: 4,
      sleepLatencyMinutes: 25,
      awakenings: 1,
      daytimeEnergy: '精神不错',
      note: '手机放远了',
      version: 1,
    });
  });

  it('upserts daily task logs by program and day without double counting', () => {
    const first = buildDailyTaskLog({
      programId: 'program-1',
      day: 1,
      date: '2026-05-20',
      status: 'completed',
      difficulty: 'ok',
      sleepQuality: 3,
      sleepLatencyMinutes: 45,
      awakenings: 2,
      daytimeEnergy: '一般',
      note: '',
      now: new Date('2026-05-20T08:00:00.000Z'),
    });
    const second = buildDailyTaskLog({
      programId: 'program-1',
      day: 1,
      date: '2026-05-20',
      status: 'skipped',
      difficulty: 'hard',
      sleepQuality: null,
      sleepLatencyMinutes: null,
      awakenings: null,
      daytimeEnergy: '疲惫',
      note: '太晚了',
      now: new Date('2026-05-20T21:00:00.000Z'),
    });

    const logs = upsertDailyTaskLog([first], second);

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      status: 'skipped',
      difficulty: 'hard',
      note: '太晚了',
      version: 2,
    });
    expect(buildProgramStats(logs)).toMatchObject({
      completedCount: 0,
      skippedCount: 1,
      completionRate: 0,
    });
  });
});
