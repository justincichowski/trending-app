import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchTopTrends } from './lib/toptrends';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const data = await fetchTopTrends();
    if (!data || Object.keys(data).length === 0) return res.status(204).end();
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('[API /toptrends] error', err);
    return res.status(500).json({ error: 'Failed to fetch top trends data' });
  }
}
