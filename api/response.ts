import type { VercelResponse } from '@vercel/node';

export function sendJson(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body);
}