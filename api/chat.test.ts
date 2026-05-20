import { describe, expect, it, vi } from 'vitest';
import handler from './chat';
import type { AssessmentResult, SleepProfile } from '../src/domain/types';
import { callAiProvider } from './provider';

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

  it('short-circuits Chinese urgent safety messages with local emergency guidance', async () => {
    vi.mocked(callAiProvider).mockClear();
    const res = mockRes();

    await handler({
      method: 'POST',
      body: { profile, message: '我不想活了，已经连续很多天睡不着', history: [] },
    } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      riskLevel: 'high_risk',
      seekCareNotice: expect.stringContaining('当地急救'),
    });
    expect(callAiProvider).not.toHaveBeenCalled();
  });

  it('keeps non-urgent profile safety signals in the provider prompt', async () => {
    vi.mocked(callAiProvider).mockClear();
    const res = mockRes();

    await handler({
      method: 'POST',
      body: {
        profile: { ...profile, safetySignals: ['疑似睡眠呼吸暂停'] },
        message: '我应该怎么记录睡眠？',
        history: [],
      },
    } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(callAiProvider).toHaveBeenCalledTimes(1);
  });

  it('returns safe fallback for malformed JSON response', async () => {
    vi.mocked(callAiProvider).mockResolvedValueOnce({ content: 'not valid json' });
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, message: 'Test', history: [] } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ riskLevel: 'high_risk' });
  });

  it('accepts JSON wrapped in a markdown code fence from the provider', async () => {
    vi.mocked(callAiProvider).mockResolvedValueOnce({
      content: `\`\`\`json
{
  "riskLevel": "normal",
  "summary": "先把起床时间固定住，再逐步提前入睡。",
  "possibleFactors": ["睡眠窗口偏短"],
  "suggestions": [{"title": "固定起床", "detail": "未来一周每天在同一时间起床。"}],
  "nextQuestions": ["白天是否会补觉？"],
  "seekCareNotice": null,
  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。"
}
\`\`\``,
    });
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, message: '每天只能睡四个小时左右', history: [] } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      riskLevel: 'normal',
      summary: '先把起床时间固定住，再逐步提前入睡。',
    });
  });

  it('accepts JSON after provider reasoning text', async () => {
    vi.mocked(callAiProvider).mockResolvedValueOnce({
      content: `<think>需要先判断风险等级。</think>

{
  "riskLevel": "normal",
  "summary": "先记录一周睡眠日志，确认早醒出现的时间和频率。",
  "possibleFactors": ["压力水平较高"],
  "suggestions": [{"title": "记录早醒", "detail": "醒来后记录时间、情绪和是否再次入睡。"}],
  "nextQuestions": ["早醒后通常会不会看手机？"],
  "seekCareNotice": null,
  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。"
}`,
    });
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, message: '我总是早醒', history: [] } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      riskLevel: 'normal',
      summary: '先记录一周睡眠日志，确认早醒出现的时间和频率。',
    });
  });

  it('skips invalid JSON-like snippets before the provider JSON object', async () => {
    vi.mocked(callAiProvider).mockResolvedValueOnce({
      content: `<think>{"riskLevel":"...", "summary":"...", ...}</think>

{
  "riskLevel": "normal",
  "summary": "建议先稳定作息并观察连续几天的总睡眠时长。",
  "possibleFactors": ["早醒后焦虑"],
  "suggestions": [{"title": "离床放松", "detail": "醒后超过20分钟仍无法入睡时，起身做低刺激放松。"}],
  "nextQuestions": ["醒来后是否会明显焦虑？"],
  "seekCareNotice": null,
  "disclaimer": "本内容仅提供健康管理参考，不作为医疗诊断。"
}`,
    });
    const res = mockRes();
    await handler({ method: 'POST', body: { profile, message: '睡得很短', history: [] } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      riskLevel: 'normal',
      summary: '建议先稳定作息并观察连续几天的总睡眠时长。',
    });
  });

  it('uses deterministic personalization safety before calling provider', async () => {
    vi.mocked(callAiProvider).mockClear();
    const res = mockRes();

    await handler({
      method: 'POST',
      body: {
        profile: {
          ...profile,
          concernDuration: '3个月以上',
          daytimeImpact: '白天明显疲惫，工作受影响',
          medicationStatus: ['长期使用助眠药'],
        },
        message: '我还能怎么改善睡眠？',
        history: [],
      },
    } as never, res as never);

    expect(callAiProvider).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ riskLevel: 'high_risk' });
  });

  it('keeps non-urgent care advice in the provider prompt instead of using generic fallback', async () => {
    let capturedPrompt = '';
    vi.mocked(callAiProvider).mockImplementation(async (prompt: string) => {
      capturedPrompt = prompt;
      return {
        content: JSON.stringify({
          riskLevel: 'high_risk',
          summary: '建议预约睡眠门诊评估，同时先保持固定起床时间。',
          possibleFactors: ['慢性失眠伴有日间功能损害'],
          suggestions: [{ title: '预约评估', detail: '准备睡眠日志和持续时间信息。' }],
          nextQuestions: ['这种情况持续多久了？'],
          seekCareNotice: '建议尽快寻求专业评估。',
          disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
        }),
      };
    });
    const res = mockRes();

    await handler({
      method: 'POST',
      body: {
        profile: {
          ...profile,
          concernDuration: '3个月以上',
          daytimeImpact: '白天明显疲惫，工作受影响',
        },
        message: '我还能怎么改善睡眠？',
        history: [],
      },
    } as never, res as never);

    expect(callAiProvider).toHaveBeenCalledTimes(1);
    expect(capturedPrompt).toContain('慢性失眠伴有日间功能损害');
    expect(res.body).toMatchObject({
      riskLevel: 'high_risk',
      summary: '建议预约睡眠门诊评估，同时先保持固定起床时间。',
    });
  });

  it('includes assessment context in prompt when provided', async () => {
    const assessmentResult: AssessmentResult = {
      completedAt: '2024-01-15T10:00:00Z',
      isi: {
        answers: [2, 1, 1, 1, 1, 1, 1],
        score: 8,
        level: 'mild',
        summary: '轻度失眠',
      },
      psqiLite: {
        answers: [1, 1, 1, 1, 1],
        score: 5,
        level: 'fair',
        summary: '睡眠质量尚可',
      },
      riskFlags: ['入睡困难'],
    };

    let capturedPrompt = '';
    const mockImpl = async (prompt: string) => {
      capturedPrompt = prompt;
      return {
        content: JSON.stringify({
          riskLevel: 'normal',
          summary: 'Test response',
          possibleFactors: [],
          suggestions: [],
          nextQuestions: [],
          seekCareNotice: null,
          disclaimer: 'Test',
        }),
      };
    };
    vi.mocked(callAiProvider).mockImplementation(mockImpl);

    const res = mockRes();
    await handler({
      method: 'POST',
      body: { profile, message: '我睡不着怎么办', history: [], assessmentResult },
    } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(capturedPrompt).toContain('最近一次睡眠自测');
    expect(capturedPrompt).toContain('ISI：8 分');
  });

  it('includes diary summary in prompt and personalization when provided', async () => {
    let capturedPrompt = '';
    vi.mocked(callAiProvider).mockImplementation(async (prompt: string) => {
      capturedPrompt = prompt;
      return {
        content: JSON.stringify({
          riskLevel: 'normal',
          summary: 'Test response',
          possibleFactors: [],
          suggestions: [],
          nextQuestions: [],
          seekCareNotice: null,
          disclaimer: 'Test',
        }),
      };
    });

    const res = mockRes();
    await handler({
      method: 'POST',
      body: {
        profile: { ...profile, daytimeImpact: '工作时明显疲惫' },
        message: '请结合我最近几天的睡眠情况',
        history: [],
        diarySummary: {
          entryCount: 2,
          daysWindow: 7,
          dateRange: { from: '2026-05-13', to: '2026-05-19' },
          averageSleepDurationMinutes: 280,
          averageSleepLatencyMinutes: 65,
          averageAwakenings: 3,
          averageSleepQuality: 2,
          recentFactors: ['睡前刷手机'],
          recentNotes: ['凌晨醒了几次'],
        },
      },
    } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(capturedPrompt).toContain('最近 7 天睡眠日记摘要');
    expect(capturedPrompt).toContain('睡眠时长明显不足且伴随白天影响');
    expect(capturedPrompt).toContain('凌晨醒了几次');
  });

  it('includes hidden scene context in prompt when provided', async () => {
    let capturedPrompt = '';
    vi.mocked(callAiProvider).mockImplementation(async (prompt: string) => {
      capturedPrompt = prompt;
      return {
        content: JSON.stringify({
          riskLevel: 'normal',
          summary: 'Test response',
          possibleFactors: [],
          suggestions: [],
          nextQuestions: [],
          seekCareNotice: null,
          disclaimer: 'Test',
        }),
      };
    });

    const res = mockRes();
    await handler({
      method: 'POST',
      body: { profile, message: '我躺下很久都睡不着', history: [], scenario: 'hard_to_fall_asleep' },
    } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(capturedPrompt).toContain('当前咨询场景：入睡困难');
    expect(capturedPrompt).toContain('难以在合理时间内入睡');
  });

  it('short-circuits urgent Chinese risk before provider call', async () => {
    vi.mocked(callAiProvider).mockClear();
    const res = mockRes();

    await handler({
      method: 'POST',
      body: { profile, message: '我不想活了，可能会伤害自己', history: [] },
    } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.body)).toContain('当地急救');
    expect(callAiProvider).not.toHaveBeenCalled();
  });

  it('passes needs-care safety context into provider prompt', async () => {
    vi.mocked(callAiProvider).mockClear();
    const res = mockRes();

    await handler({
      method: 'POST',
      body: {
        profile: { ...profile, safetySignals: ['疑似睡眠呼吸暂停'] },
        message: '我睡觉打鼾很严重',
        history: [],
      },
    } as never, res as never);

    expect(callAiProvider).toHaveBeenCalledTimes(1);
    expect(vi.mocked(callAiProvider).mock.calls[0][0]).toContain('确定性安全分诊：needs_care');
  });
});
