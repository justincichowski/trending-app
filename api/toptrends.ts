import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TOP_TRENDS_TTL_MS, TOP_TRENDS_TTL_S, SWR_TTL_S } from './lib/config';
import { fetchTopTrends } from './lib/toptrends';
import { cached } from './lib/persist';

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		res.setHeader(
			'Cache-Control',
			`s-maxage=${TOP_TRENDS_TTL_S}, stale-while-revalidate=${SWR_TTL_S}`,
		);

		// use cached() with your fetchTopTrends
		const data = await cached('toptrends', TOP_TRENDS_TTL_MS, fetchTopTrends);

		if (!data || Object.keys(data).length === 0) {
			return res.status(204).end();
		}

		return res.status(200).json(data);
	} catch (err: any) {
		console.error('[API /toptrends] error', err);
		return res.status(500).json({ error: 'Failed to fetch top trends data' });
	}
}
