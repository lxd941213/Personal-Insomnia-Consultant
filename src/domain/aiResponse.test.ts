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

    expect(response.seekCareNotice).toContain('professional');
    expect(response.disclaimer).toContain('not medical diagnosis');
  });

  it('returns a safe fallback for invalid payloads', () => {
    const response = normalizeAiResponse({ riskLevel: 'normal' });

    expect(response.riskLevel).toBe('high_risk');
    expect(response.summary).toContain('unable to generate');
    expect(response.seekCareNotice).toContain('professional');
  });
});
