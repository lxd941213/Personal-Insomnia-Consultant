import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllLocalData, getAssessmentResult, getChatHistory, getDailyTaskLogs, getDiaryEntries, getFeedbackEvents, getKnowledgeCache, getRelaxationSessions, getReminderSettings, getScopedChatHistory, getSleepProfile, getSleepProgram, saveAssessmentResult, saveChatHistory, saveDailyTaskLogs, saveDiaryEntries, saveFeedbackEvents, saveKnowledgeCache, saveRelaxationSessions, saveReminderSettings, saveScopedChatHistory, saveSleepProfile, saveSleepProgram } from './localStore';
import type { SleepDiaryEntry, SleepProfile } from '../domain/types';
import type { AssessmentResult, DailyTaskLog, KnowledgeResponse, SleepProgram } from '../domain/types';

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: ['Phone use before bed'],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: 'Mind keeps racing.',
};

const assessmentResult: AssessmentResult = {
  completedAt: '2026-05-08T00:00:00.000Z',
  isi: {
    answers: [3, 2, 1, 2, 3, 1, 2],
    score: 14,
    level: 'moderate',
    summary: 'Moderate insomnia symptoms',
  },
  psqiLite: {
    answers: [2, 1, 2, 1, 1, 2, 1],
    score: 10,
    level: 'poor',
    summary: 'Poor sleep quality',
  },
  riskFlags: ['sleep_latency', 'sleep_efficiency'],
};

const knowledgeCache: KnowledgeResponse = {
  scenario: 'hard_to_fall_asleep',
  generatedAt: '2026-05-08T00:00:00.000Z',
  cards: [
    {
      title: '睡眠卫生建议',
      summary: '保持一致的作息节律。',
      keyPoints: ['固定起床时间'],
      misconceptions: ['躺得越久越容易睡着'],
      actions: [{ title: '固定起床', detail: '连续一周在同一时间起床。' }],
      safetyNote: null,
      followUpQuestions: ['下午是否喝咖啡？'],
    },
  ],
  disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
};

describe('localStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and reads a sleep profile', () => {
    saveSleepProfile(profile);
    expect(getSleepProfile()).toEqual(profile);
  });

  it('saves chat history and feedback events', () => {
    saveChatHistory([{ id: 'm1', role: 'user', content: 'Help me sleep', createdAt: '2026-05-07T00:00:00.000Z' }]);
    saveFeedbackEvents([{ messageId: 'm2', value: 'useful', createdAt: '2026-05-07T00:01:00.000Z' }]);

    expect(getChatHistory()).toHaveLength(1);
    expect(getFeedbackEvents()[0].value).toBe('useful');
  });

  it('keeps general and scene chat histories separate', () => {
    const general = [{ id: 'g1', role: 'user' as const, content: '通用咨询', createdAt: '2026-05-08T00:00:00.000Z' }];
    const scene = [{ id: 's1', role: 'user' as const, content: '入睡困难咨询', createdAt: '2026-05-08T00:01:00.000Z' }];

    saveScopedChatHistory('general', general);
    saveScopedChatHistory('hard_to_fall_asleep', scene);

    expect(getScopedChatHistory('general')).toEqual(general);
    expect(getScopedChatHistory('hard_to_fall_asleep')).toEqual(scene);
    expect(getScopedChatHistory('stress_anxiety')).toEqual([]);
    expect(getChatHistory()).toEqual(general);
  });

  it('clears all MVP data', () => {
    saveSleepProfile(profile);
    clearAllLocalData();
    expect(getSleepProfile()).toBeNull();
    expect(getChatHistory()).toEqual([]);
    expect(getFeedbackEvents()).toEqual([]);
  });

  it('falls back to memory when localStorage is unavailable', () => {
    const original = window.localStorage.setItem;
    Object.defineProperty(window.localStorage, 'setItem', {
      value: () => {
        throw new Error('storage unavailable');
      },
      configurable: true,
    });

    saveSleepProfile(profile);
    expect(getSleepProfile()).toEqual(profile);

    Object.defineProperty(window.localStorage, 'setItem', { value: original, configurable: true });
  });

  it('reads from memory when localStorage read fails', () => {
    saveSleepProfile(profile);

    Object.defineProperty(window.localStorage, 'getItem', {
      value: () => {
        throw new Error('storage unavailable');
      },
      configurable: true,
    });

    expect(getSleepProfile()).toEqual(profile);

    Object.defineProperty(window.localStorage, 'getItem', {
      value: window.localStorage.getItem.bind(window.localStorage),
      configurable: true,
    });
  });

  it('saves and reads assessment result', () => {
    saveAssessmentResult(assessmentResult);
    expect(getAssessmentResult()).toEqual(assessmentResult);
  });

  it('saves and reads knowledge cache', () => {
    saveKnowledgeCache({ hard_to_fall_asleep: knowledgeCache });
    expect(getKnowledgeCache()).toEqual({ hard_to_fall_asleep: knowledgeCache });
  });

  it('clears assessment result and knowledge cache with all local data', () => {
    saveAssessmentResult(assessmentResult);
    saveKnowledgeCache({ hard_to_fall_asleep: knowledgeCache });
    clearAllLocalData();
    expect(getAssessmentResult()).toBeNull();
    expect(getKnowledgeCache()).toEqual({});
  });

  it('stores diary entries, reminder settings, and relaxation sessions', () => {
    const entry: SleepDiaryEntry = {
      id: 'diary-2026-05-08',
      date: '2026-05-08',
      bedtimeCheckin: null,
      wakeCheckin: null,
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
      version: 1,
    };

    saveDiaryEntries([entry]);
    saveReminderSettings({
      id: 'reminder-settings',
      bedtimeEnabled: true,
      bedtimeTime: '22:30',
      wakeEnabled: true,
      wakeTime: '07:00',
      lastBedtimeAckDate: null,
      lastWakeAckDate: null,
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
      version: 1,
    });
    saveRelaxationSessions([{
      id: 'session-1',
      toolId: 'breathing-478',
      startedAt: '2026-05-08T22:00:00.000Z',
      completedAt: '2026-05-08T22:04:00.000Z',
      durationSeconds: 240,
      status: 'completed',
      createdAt: '2026-05-08T22:00:00.000Z',
      updatedAt: '2026-05-08T22:04:00.000Z',
      version: 2,
    }]);

    expect(getDiaryEntries()).toEqual([entry]);
    expect(getReminderSettings()?.bedtimeTime).toBe('22:30');
    expect(getRelaxationSessions()).toHaveLength(1);
  });

  it('saves and reads the active sleep program', () => {
    const program: SleepProgram = {
      id: 'program-1',
      startedAt: '2026-05-10T08:00:00.000Z',
      currentDay: 1,
      status: 'active',
      templateId: 'cbti_foundation_14_day',
      createdAt: '2026-05-10T08:00:00.000Z',
      updatedAt: '2026-05-10T08:00:00.000Z',
      version: 1,
    };

    saveSleepProgram(program);

    expect(getSleepProgram()).toEqual(program);
  });

  it('saves daily task logs and clears them with reset', () => {
    const logs: DailyTaskLog[] = [{
      id: 'log-1',
      programId: 'program-1',
      day: 1,
      date: '2026-05-10',
      status: 'completed',
      difficulty: 'ok',
      sleepQuality: 6,
      sleepLatencyMinutes: 30,
      awakenings: 1,
      daytimeEnergy: '一般',
      note: '',
      createdAt: '2026-05-10T08:00:00.000Z',
      updatedAt: '2026-05-10T08:00:00.000Z',
      version: 1,
    }];

    saveDailyTaskLogs(logs);
    expect(getDailyTaskLogs()).toEqual(logs);

    clearAllLocalData();
    expect(getSleepProgram()).toBeNull();
    expect(getDailyTaskLogs()).toEqual([]);
  });
});
