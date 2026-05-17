import { afterEach, describe, expect, it, vi } from 'vitest';
import { callAiProvider } from './provider';

describe('callAiProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.AI_API_KEY;
    delete process.env.AI_BASE_URL;
    delete process.env.AI_MODEL;
  });

  it('uses MiniMax OpenAI-compatible settings with split reasoning enabled', async () => {
    process.env.AI_API_KEY = 'test-key';
    process.env.AI_BASE_URL = 'https://api.minimaxi.com/v1';
    process.env.AI_MODEL = 'MiniMax-M2.7';

    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"riskLevel":"normal"}' } }],
      }),
    }));
    vi.stubGlobal('fetch', mockFetch);

    await callAiProvider('prompt');

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(mockFetch).toHaveBeenCalledWith('https://api.minimaxi.com/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
    expect(body).toMatchObject({
      model: 'MiniMax-M2.7',
      temperature: 0.3,
      reasoning_split: true,
    });
    expect(body).not.toHaveProperty('response_format');
  });
});
