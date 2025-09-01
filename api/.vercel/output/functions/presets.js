"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const presets_1 = require("./lib/presets");
const rss_1 = require("./lib/rss");
const youtube_1 = require("./lib/youtube");
/**
 * An API endpoint that returns a list of preset categories or the items for a specific category.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} response - The outgoing response object.
 */
async function handler(request, response) {
    const { id } = request.query;
    // If no ID is provided, return the list of all presets
    if (!id) {
        response.status(200).json(presets_1.presets);
        return;
    }
    // Find the preset with the matching ID
    const preset = presets_1.presets.find(p => p.id === id);
    if (!preset) {
        response.status(404).json({ error: 'Preset not found.' });
        return;
    }
    try {
        // Set caching headers
        response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        let items = [];
        switch (preset.source) {
            case 'rss':
                items = await (0, rss_1.getRssFeed)(preset.params);
                break;
            case 'youtube':
                items = await (0, youtube_1.getYouTubeVideos)({ ...preset.params, max: 15 });
                break;
        }
        response.status(200).json(items);
    }
    catch (error) {
        // Handle any errors that occur during the fetch
        console.error(error);
        response.status(500).json({
            error: `Failed to fetch data for preset: ${preset.name}.`,
        });
    }
}
