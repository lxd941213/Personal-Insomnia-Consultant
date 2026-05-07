import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendChatMessage } from './chatClient';
import type { SleepProfile } from '../domain/types';

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

describe('sendChatMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts profile and message to the chat API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        riskLevel: 'normal',
        summary: 'Summary',
        possibleFactors: [],
        suggestions: [],
        nextQuestions: [],
        seekCareNotice: null,
        disclaimer: 'This is for health management reference only and is not medical diagnosis.',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const response = await sendChatMessage({ profile, message: 'Help', history: [] });

    expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }));
    expect(response.riskLevel).toBe('normal');
  });

  it('throws on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(sendChatMessage({ profile, message: 'Help', history: [] }))
      .rejects.toThrow('Chat API failed with 500');
  });
});