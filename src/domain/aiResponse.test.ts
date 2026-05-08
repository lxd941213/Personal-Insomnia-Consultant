import { describe, expect, it } from 'vitest';
import { normalizeAiResponse } from './aiResponse';

describe('normalizeAiResponse', () => {
  it('keeps a valid normal response', () => {
    const response = normalizeAiResponse({
      riskLevel: 'normal',
      summary: 'You have a delayed schedule and stress-related difficulty falling asleep.',
      possibleFactors: ['Late phone use', 'Work stress'],
      suggestions: [{ title: 'Move phone cutoff earlier', detail: 'Stop screen use 30 minutes before bed tonight.' }],
      nextQuestions: ['How long does it usually take you to fall asleep?'],
      seekCareNotice: null,
      disclaimer: 'For health management reference only, not medical diagnosis.',
    });

    expect(response.riskLevel).toBe('normal');
    expect(response.suggestions[0].title).toBe('Move phone cutoff earlier');
  });

  it('normalizes string suggestions from OpenAI-compatible providers', () => {
    const response = normalizeAiResponse({
      riskLevel: 'normal',
      summary: '睡眠风险目前处于正常水平。',
      possibleFactors: ['精神压力大'],
      suggestions: ['保持固定的作息时间', '睡前避免摄入咖啡因'],
      nextQuestions: ['您近期是否有入睡困难或早醒？'],
      seekCareNotice: null,
      disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
    });

    expect(response.riskLevel).toBe('normal');
    expect(response.suggestions[0]).toEqual({
      title: '保持固定的作息时间',
      detail: '保持固定的作息时间',
    });
  });

  it('adds a care notice for high risk responses', () => {
    const response = normalizeAiResponse({
      riskLevel: 'high_risk',
      summary: 'This may need professional support.',
      possibleFactors: [],
      suggestions: [],
      nextQuestions: [],
      seekCareNotice: '',
      disclaimer: '',
    });

    expect(response.seekCareNotice).toContain('专业');
    expect(response.disclaimer).toContain('不作为医疗诊断');
  });

  it('returns a safe fallback for invalid payloads', () => {
    const response = normalizeAiResponse({ riskLevel: 'normal' });

    expect(response.riskLevel).toBe('high_risk');
    expect(response.summary).toContain('无法生成可靠');
    expect(response.seekCareNotice).toContain('专业');
  });
});
