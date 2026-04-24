import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { tvId, layoutId, cells } = req.body;
    if (!tvId) return res.status(400).json({ error: 'tvId required' });
    // Store in global (persists in same process)
    (globalThis as any)[`tv_${tvId.toUpperCase()}`] = { tvId, layoutId, cells, updatedAt: Date.now() };
    return res.status(200).json({ success: true });
  }
  return res.status(405).end();
}