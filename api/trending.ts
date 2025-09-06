import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RIGHT_PANEL_TTL_MS, RIGHT_PANEL_TTL_S, SWR_TTL_S } from './lib/config';
import { getRssFeed } from './lib/rss';
import { cached } from './lib/persist';
import type { NormalizedItem } from './lib/types';

// RIGHT PANEL (Trending): Limit & Caching Policy
// - Each section (Sports, Movies, Sales, Websites, Books) is capped to THREE (3) items for readability.
// - Never cache empty results ({} or []).
// - If all sources are empty after one retry, respond with 204 No Content.
// - Serverless cache TTL for the right column is 15 minutes.
const LIMIT_PER_SECTION = 3; // change to 4+ if product requests
// RIGHT_PANEL_TTL_MS from config // 15 minutes // 10 minutes // 15 minutes
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

async function fetchAll(): Promise<Record<string, NormalizedItem[]>> {
	const results = await Promise.allSettled(
		TRENDING_FEEDS.map((feed) => getRssFeed({ url: feed.url, source: feed.source })),
	);
	const data: Record<string, NormalizedItem[]> = {};
	results.forEach((res, idx) => {
		const title = TRENDING_FEEDS[idx].title;
		if (res.status === 'fulfilled' && res.value && res.value.length) {
			data[title] = res.value.slice(0, LIMIT_PER_SECTION);
		}
	});
	return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173/');
	res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const debug = req.query?.debug === '1';
	try {
		if (debug) console.log('[API /trending] debug=1');
		const data = await cached<Record<string, NormalizedItem[]>>(
			'trending_v2',
			RIGHT_PANEL_TTL_MS,
			async () => {
				// first attempt
				const d1 = await fetchAll();
				if (debug) console.log('[API /trending] first fetch keys:', Object.keys(d1));
				if (isMeaningful(d1)) return d1;
				// retry once after 1s
				if (debug)
					console.log('[API /trending] empty after first fetch; retrying in 1000ms');
				await new Promise((r) => setTimeout(r, 1000));
				const d2 = await fetchAll();
				if (debug) console.log('[API /trending] second fetch keys:', Object.keys(d2));
				return d2;
			},
		);

		if (debug) console.log('[API /trending] post-cache meaningful=', isMeaningful(data));
		if (!isMeaningful(data)) {
			if (debug) console.log('[API /trending] returning 204 No Content');
			return res.status(204).end();
		}
		console.log('[API /trending] returning sections:', Object.keys(data));
		if (debug)
			console.log(
				'[API /trending] sample section lengths:',
				Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
			);
		res.setHeader(
			'Cache-Control',
			`s-maxage=${RIGHT_PANEL_TTL_S}, stale-while-revalidate=${SWR_TTL_S}`,
		);
		return res.status(200).json(data);
	} catch (err: any) {
		console.error('[API /trending] error', err);
		return res.status(500).json({ error: 'Failed to fetch trending data' });
	}
}
