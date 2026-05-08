import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processKnowledge } from './knowledgeLogic';
import { sendJson } from './response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const result = await processKnowledge(req.body);
  return sendJson(res, result.status, result.body);
}