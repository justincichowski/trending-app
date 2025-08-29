import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getHackerNewsStories } from './lib/hackernews';

/**
 * An API endpoint that returns the top Hacker News stories.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} response - The outgoing response object.
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
	try {
		// Set caching headers
		response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

		// Fetch and return the stories
		const stories = await getHackerNewsStories({ limit: 30 });
		response.status(200).json(stories);
	} catch (error) {
		// Handle any errors that occur during the fetch
		console.error(error);
		response.status(500).json({
			error: 'Failed to fetch Hacker News stories.',
		});
	}
}