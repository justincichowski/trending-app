import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TRENDING_TTL_MS, TRENDING_TTL_S, SWR_TTL_S } from './lib/config';
import { getRssFeed } from './lib/rss';
import { cached } from './lib/persist';
import type { NormalizedItem } from './lib/types';

// RIGHT PANEL (Trending): Limit & Caching Policy
// - Each section (Sports, Movies, Sales, Websites, Books) is capped to THREE (3) items for readability.
// - Never cache empty trendingResults ({} or []).
// - If all sources are empty after one retry, respond with 204 No Content.
// - Serverless cache TTL for the right column is 15 minutes.
// TRENDING_TTL_MS from config // 15 minutes // 10 minutes // 15 minutes

const TRENDING_FEEDS = [
	{ title: 'Sports', source: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
	{
		title: 'Movies',
		source: 'The New York Times',
		url: 'https://rss.nytimes.com/services/xml/rss/nyt/Movies.xml',
	},
	{ title: 'Sales', source: 'Slickdeals', url: 'https://slickdeals.net/rss/frontpage.php' },
	{ title: 'Websites', source: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
	{ title: 'Books', source: 'NPR', url: 'https://www.npr.org/rss/rss.php?id=1032' },
];

function isMeaningful(obj: Record<string, NormalizedItem[]>): boolean {
	if (!obj) return false;
	return Object.values(obj).some((arr) => Array.isArray(arr) && arr.length > 0);
}

async function fetchTrending(): Promise<Record<string, NormalizedItem[]>> {
	async function fetchAll(): Promise<Record<string, NormalizedItem[]>> {
		const trendingResults = await Promise.allSettled(
			TRENDING_FEEDS.map((feed) =>
				getRssFeed({ url: feed.url, source: feed.source, limit: 3 }),
			),
		);
		const data: Record<string, NormalizedItem[]> = {};
		trendingResults.forEach((res, index) => {
			const { title } = TRENDING_FEEDS[index];
			if (res.status === 'fulfilled') {
				data[title] = res.value;
			} else {
				console.error(
					`[API /trending] Failed to fetch trending feed for ${title}:`,
					res.reason,
				);
			}
		});
		return data;
	}

	const d1 = await fetchAll();
	if (isMeaningful(d1)) {
		return d1;
	}
	await new Promise((r) => setTimeout(r, 1000));
	return await fetchAll();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		res.setHeader(
			'Cache-Control',
			`s-maxage=${TRENDING_TTL_S}, stale-while-revalidate=${SWR_TTL_S}`,
		);

		// use cached() with your fetchTrending
		const data = await cached('trending', TRENDING_TTL_MS, fetchTrending);

		if (!data || Object.keys(data).length === 0) {
			return res.status(204).end();
		}

		return res.status(200).json(data);
	} catch (err: any) {
		console.error('[API /trending] Failed to fetch trending data:', err);
		return res.status(500).json({ error: 'Failed to fetch trending data' });
	}
}
