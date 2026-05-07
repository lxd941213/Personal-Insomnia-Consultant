import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllLocalData, getChatHistory, getFeedbackEvents, getSleepProfile, saveChatHistory, saveFeedbackEvents, saveSleepProfile } from './localStore';
import type { SleepProfile } from '../domain/types';

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
});