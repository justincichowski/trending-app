"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const toptrends_1 = require("./lib/toptrends");
const persist_1 = require("./lib/persist");
async function handler(req, res) {
    try {
        const ttl = Number(process.env.TOP_TRENDS_TTL_MS || 30 * 60 * 1000);
        const cached = await (0, persist_1.readFromCache)('toptrends', ttl);
        if (cached)
            return res.status(200).json(cached);
        const data = await (0, toptrends_1.fetchTopTrends)();
        await (0, persist_1.writeToCache)('toptrends', data, ttl);
        if (!data || Object.keys(data).length === 0)
            return res.status(204).end();
        return res.status(200).json(data);
    }
    catch (err) {
        console.error('[API /toptrends] error', err);
        return res.status(500).json({ error: 'Failed to fetch top trends data' });
    }
}
