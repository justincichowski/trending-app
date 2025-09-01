"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const toptrends_1 = require("./lib/toptrends");
async function handler(req, res) {
    try {
        const data = await (0, toptrends_1.fetchTopTrends)();
        if (!data || Object.keys(data).length === 0)
            return res.status(204).end();
        return res.status(200).json(data);
    }
    catch (err) {
        console.error('[API /toptrends] error', err);
        return res.status(500).json({ error: 'Failed to fetch top trends data' });
    }
}
