import { fetchTopTrends } from './lib/toptrends';
import { readFromCache, writeToCache } from './lib/persist';
export default async function handler(req, res) {
    try {
        const ttl = Number(process.env.TOP_TRENDS_TTL_MS || 30 * 60 * 1000);
        const cached = await readFromCache('toptrends', ttl);
        if (cached)
            return res.status(200).json(cached);
        const data = await fetchTopTrends();
        await writeToCache('toptrends', data, ttl);
        if (!data || Object.keys(data).length === 0)
            return res.status(204).end();
        return res.status(200).json(data);
    }
    catch (err) {
        console.error('[API /toptrends] error', err);
        return res.status(500).json({ error: 'Failed to fetch top trends data' });
    }
}
