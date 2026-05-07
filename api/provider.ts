export interface AiProviderResult {
  content: string;
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

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider failed with ${response.status}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('AI provider returned no text content');
  }

  return { content };
}