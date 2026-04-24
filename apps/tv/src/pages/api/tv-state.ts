import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });
  const state = (globalThis as any)[`tv_${String(id).toUpperCase()}`] || null;
  return res.status(200).json(state);
}