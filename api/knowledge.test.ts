import { describe, expect, it, vi } from 'vitest';
import handler from './knowledge';
import type { SleepProfile } from '../src/domain/types';
import { callAiProvider } from './provider';

vi.mock('./provider', () => ({
  callAiProvider: vi.fn(async () => ({
    content: JSON.stringify({
      scenario: 'hard_to_fall_asleep',
      generatedAt: '2026-05-08T08:00:00.000Z',
      cards: [
        {
          title: '入睡困难改善建议',
          summary: '建议保持规律作息，减少睡前屏幕使用时间。',
          keyPoints: ['固定起床时间'],
          misconceptions: ['躺得越久越容易睡着'],
          actions: [{ title: '减少屏幕刺激', detail: '睡前 30 分钟放下手机。' }],
          safetyNote: null,
          followUpQuestions: ['下午是否喝咖啡？'],
        },
      ],
      disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
    }),
  })),
}));

vi.mock('../src/domain/safety', () => ({
  detectHighRiskSignal: vi.fn().mockReturnValue(false),
  defaultCareNotice: '您的消息中包含可能需要专业支持的信号，请考虑及时联系有执照的临床医生或心理健康专业人士。如果您可能伤害自己或他人，请立即联系紧急救援。',
  defaultDisclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
}));

const profile: SleepProfile = {
  ageRange: '30-40',
  bedtime: '23:00',
  wakeTime: '07:00',
  mainConcern: 'hard_to_fall_asleep',
  concernDuration: '1-3 months',
  stressLevel: 'moderate',
  habits: ['睡前刷手机'],
  daytimeImpact: '轻度疲劳',
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

describe('POST /api/knowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-POST requests with 405', async () => {
    const res = mockRes();
    await handler({ method: 'GET', body: null } as never, res as never);

    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method not allowed' });
  });

  it('rejects invalid scenario with 400', async () => {
    const res = mockRes();
    await handler(
      { method: 'POST', body: { scenario: 'invalid_scenario', profile } } as never,
      res as never,
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid scenario' });
  });

  it('returns normalized Chinese cards for valid requests', async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { scenario: 'hard_to_fall_asleep', profile } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      scenario: 'hard_to_fall_asleep',
      cards: expect.any(Array),
      disclaimer: expect.stringContaining('健康管理参考'),
    });
  });

  it('returns safe fallback on provider failure', async () => {
    vi.mocked(callAiProvider).mockRejectedValueOnce(new Error('Provider error'));

    const res = mockRes();
    await handler({ method: 'POST', body: { scenario: 'hard_to_fall_asleep', profile } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      scenario: 'hard_to_fall_asleep',
      cards: expect.any(Array),
      disclaimer: expect.stringContaining('健康管理参考'),
    });
  });

  it('returns conservative cards without provider call for profile safety signals', async () => {
    vi.mocked(callAiProvider).mockReset();
    vi.mocked(callAiProvider).mockResolvedValue({ content: '{"cards":[]}' });

    const highRiskProfile = {
      ...profile,
      safetySignals: ['失眠超过6个月', '情绪低落'],
    };

    const res = mockRes();
    await handler(
      { method: 'POST', body: { scenario: 'late_night_habit', profile: highRiskProfile } } as never,
      res as never,
    );

    // High safety signals should skip provider call and return fallback
    expect(callAiProvider).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      cards: expect.any(Array),
      disclaimer: expect.stringContaining('专业支持'),
    });
  });
});
