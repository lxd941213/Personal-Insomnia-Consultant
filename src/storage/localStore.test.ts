import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllLocalData, getAssessmentResult, getChatHistory, getFeedbackEvents, getKnowledgeCache, getSleepProfile, saveAssessmentResult, saveChatHistory, saveFeedbackEvents, saveKnowledgeCache, saveSleepProfile } from './localStore';
import type { SleepProfile } from '../domain/types';
import type { AssessmentResult, KnowledgeResponse } from '../domain/types';

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
  cards: [
    {
      scenario: 'hard_to_fall_asleep',
      title: 'Sleep Hygiene Tips',
      content: 'Maintain a consistent sleep schedule.',
      tags: ['sleep', 'hygiene'],
    },
  ],
  disclaimer: 'For informational purposes only.',
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
    saveKnowledgeCache(knowledgeCache);
    expect(getKnowledgeCache()).toEqual(knowledgeCache);
  });

  it('clears assessment result and knowledge cache with all local data', () => {
    saveAssessmentResult(assessmentResult);
    saveKnowledgeCache(knowledgeCache);
    clearAllLocalData();
    expect(getAssessmentResult()).toBeNull();
    expect(getKnowledgeCache()).toBeNull();
  });
});