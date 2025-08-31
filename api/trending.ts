import { FastifyRequest, FastifyReply } from 'fastify';
import { getRssFeed } from './lib/rss';
import type { NormalizedItem } from './lib/types';

const TRENDING_FEEDS = [
    { title: 'Sports', source: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
    { title: 'Movies', source: 'The New York Times', url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/movies/rss.xml' },
    { title: 'Sales', source: 'Slickdeals', url: 'https://slickdeals.net/rss/frontpage.php' },
    { title: 'Websites', source: 'TechCrunch', url: 'http://feeds.feedburner.com/TechCrunch/' },
    { title: 'Books', source: 'NPR', url: 'https://www.npr.org/rss/rss.php?id=1032' },
];

export default async function handler(request: FastifyRequest, reply: FastifyReply) {
    console.log('[API /trending] Request received.');
    try {
        const trendingResults = await Promise.allSettled(
            TRENDING_FEEDS.map(feed => getRssFeed({ url: feed.url, source: feed.source, limit: 3 }))
        );

        const trendingData = trendingResults.reduce((acc: Record<string, NormalizedItem[]>, result, index) => {
            const feed = TRENDING_FEEDS[index];
            if (result.status === 'fulfilled') {
                acc[feed.title] = result.value;
            } else {
                console.error(`[API /trending] Failed to fetch trending feed for ${feed.title}:`, result.reason);
            }
            return acc;
        }, {});

        console.log('[API /trending] Sending response.');
        reply.send(trendingData);
    } catch (error) {
        console.error('[API /trending] Failed to fetch trending data:', error);
        reply.status(500).send({ error: 'Failed to fetch trending data' });
    }
}