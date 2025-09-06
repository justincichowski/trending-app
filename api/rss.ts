import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRssFeed } from './lib/rss';

/**
 * An API endpoint that fetches and normalizes an RSS feed.
 * It can be called with either a `url` or a `query` parameter.
 *
 * @param {VercelRequest} req - The incoming req object.
 * @param {VercelResponse} res - The outgoing res object.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173/');
	res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	const { url, query, source, limit } = req.query;

	// Validate that either a URL or a query is provided
	if (!url && !query) {
		return res.status(400).json({
			error: 'Either a `url` or a `query` parameter must be provided.',
		});
	}

	try {
		// Set caching headers
		res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

		// Fetch and return the feed
		const feed = await getRssFeed({
			url: Array.isArray(url) ? url[0] : url,
			query: Array.isArray(query) ? query[0] : query,
			source: Array.isArray(source) ? source[0] : source,
			limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit, 10) : undefined,
		});
		res.status(200).json(feed);
	} catch (error) {
		// Handle any errors that occur during the fetch
		console.error(error);
		res.status(500).json({
			error: 'Failed to fetch RSS feed.',
		});
	}
}
