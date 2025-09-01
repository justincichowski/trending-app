import { getRssFeed } from './lib/rss';
/**
 * An API endpoint that fetches and normalizes an RSS feed.
 * It can be called with either a `url` or a `query` parameter.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} response - The outgoing response object.
 */
export default async function handler(request, response) {
    const { url, query, source, limit } = request.query;
    // Validate that either a URL or a query is provided
    if (!url && !query) {
        return response.status(400).json({
            error: 'Either a `url` or a `query` parameter must be provided.',
        });
    }
    try {
        // Set caching headers
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        // Fetch and return the feed
        const feed = await getRssFeed({
            url: Array.isArray(url) ? url[0] : url,
            query: Array.isArray(query) ? query[0] : query,
            source: Array.isArray(source) ? source[0] : source,
            limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit, 10) : undefined,
        });
        response.status(200).json(feed);
    }
    catch (error) {
        // Handle any errors that occur during the fetch
        console.error(error);
        response.status(500).json({
            error: 'Failed to fetch RSS feed.',
        });
    }
}
