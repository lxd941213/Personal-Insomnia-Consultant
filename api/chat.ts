import type { VercelRequest, VercelResponse } from '@vercel/node';
import { normalizeAiResponse, safeFallbackResponse } from '../src/domain/aiResponse';
import { detectHighRiskSignal } from '../src/domain/safety';
import type { ChatMessage, SleepProfile } from '../src/domain/types';
import { buildSleepAdvisorPrompt } from './prompt';
import { callAiProvider } from './provider';
import { sendJson } from './response';

interface ChatRequestBody {
  profile?: SleepProfile;
  message?: string;
  history?: ChatMessage[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const body = req.body as ChatRequestBody;
  if (!body.profile || typeof body.message !== 'string' || body.message.trim().length === 0) {
    return sendJson(res, 400, { error: 'Profile and message are required' });
  }

  if (detectHighRiskSignal(body.message) || body.profile.safetySignals.length > 0) {
    return sendJson(res, 200, safeFallbackResponse());
  }

  try {
    const prompt = buildSleepAdvisorPrompt(body.profile, body.message, body.history || []);
    const providerResult = await callAiProvider(prompt);
    const parsed = JSON.parse(providerResult.content);
    return sendJson(res, 200, normalizeAiResponse(parsed));
  } catch {
    return sendJson(res, 200, safeFallbackResponse());
  }
}