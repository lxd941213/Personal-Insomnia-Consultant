import { describe, expect, it, vi } from 'vitest';
import handler from './chat';
import type { SleepProfile } from '../src/domain/types';

vi.mock('./provider', () => ({
  callAiProvider: vi.fn(async () => ({
    content: JSON.stringify({
      riskLevel: 'normal',
      summary: 'Your late bedtime and stress may be contributing.',
      possibleFactors: ['Late bedtime', 'High stress'],
      suggestions: [{ title: 'Set a wind-down alarm', detail: 'Start winding down at 00:15 tonight.' }],
      nextQuestions: ['How much caffeine do you drink after lunch?'],
      seekCareNotice: null,
      disclaimer: 'This is for health management reference only and is not medical diagnosis.',
    }),
  })),
}));

const profile: SleepProfile = {
  ageRange: '25-34',
  bedtime: '01:00',
  wakeTime: '08:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'High',
  habits: [],
  daytimeImpact: 'Tired at work',
  safetySignals: [],
  optionalContext: '',
};

function mockRes() {
  return {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

describe('chat api', () => {
  it('returns normalized AI response for normal requests', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, message: 'How can I sleep earlier?', history: [] } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ riskLevel: 'normal' });
  });

  it('returns safe high-risk response without provider call', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, message: 'I want to hurt myself', history: [] } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ riskLevel: 'high_risk' });
  });
});