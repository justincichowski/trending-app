import { FastifyRequest, FastifyReply } from 'fastify';
import { fetchTopTrends } from './lib/toptrends';

export default async function handler(request: FastifyRequest, reply: FastifyReply) {
    console.log('[API /toptrends] Request received.');
    try {
        const topTrendsData = await fetchTopTrends();
        console.log('[API /toptrends] Sending response.');
        reply.send(topTrendsData);
    } catch (error) {
        console.error('[API /toptrends] Failed to fetch top trends data:', error);
        reply.status(500).send({ error: 'Failed to fetch top trends data' });
    }
}