export interface AiProviderResult {
  content: string;
}

function resolveChatCompletionsUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (url.pathname === '/v1' || url.pathname === '/v1/') {
    url.pathname = '/v1/chat/completions';
  } else if (url.pathname === '/api/v1' || url.pathname === '/api/v1/') {
    url.pathname = '/api/v1/chat/completions';
  }
  return url.toString();
}

export async function callAiProvider(prompt: string): Promise<AiProviderResult> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('AI_API_KEY is required');
  }

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:') {
      throw new Error('AI_BASE_URL must use HTTPS');
    }
  } catch {
    throw new Error('Invalid AI_BASE_URL');
  }

  const response = await fetch(resolveChatCompletionsUrl(baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      reasoning_split: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider failed with ${response.status}`);
  }

  const json = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('AI provider returned no text content');
  }

  return { content };
}
