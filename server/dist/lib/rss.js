"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRssFeed = getRssFeed;
const rss_parser_1 = __importDefault(require("rss-parser"));
// Create a new RSS parser instance
const parser = new rss_parser_1.default();
/**
 * Normalizes a raw RSS item into the common `NormalizedItem` shape.
 * Returns null if the item is missing essential fields.
 *
 * @param {Parser.Item} item - The raw item from the RSS feed.
 * @param {string} source - The source label for the feed.
 * @returns {NormalizedItem | null} The normalized item, or null if invalid.
 */
function normalizeItem(item, source) {
    // Ensure essential fields are present
    if (!item.title || !item.link) {
        // --- DEBUG LOG: Uncomment to see rejected RSS items ---
        // console.log('--- REJECTED RSS ITEM ---');
        // console.log('Reason: Missing title or link');
        // console.log(JSON.stringify(item, null, 2));
        // console.log('-------------------------');
        return null;
    }
    return {
        id: item.guid || item.link,
        title: item.title,
        url: item.link,
        source: source,
        description: item.contentSnippet,
        publishedAt: item.isoDate,
    };
}
/**
 * Builds a Google News RSS feed URL from a search query.
 *
 * @param {string} query - The search query.
 * @returns {string} The full Google News RSS URL.
 */
function buildGoogleNewsUrl(query) {
    const encodedQuery = encodeURIComponent(query);
    return `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
}
/**
 * Fetches and normalizes an RSS feed.
 *
 * @param {object} options - Options for fetching the feed.
 * @param {string} [options.url] - The URL of the RSS feed to fetch.
 * @param {string} [options.query] - A query to use for a Google News search.
 * @param {string} [options.source] - The source label for the feed.
 * @param {number} [options.limit=30] - The number of items to return.
 * @returns {Promise<NormalizedItem[]>} A promise that resolves to an array of normalized items.
 */
async function getRssFeed(options) {
    const { url, query, source = 'RSS', limit = 30 } = options;
    let feedUrl;
    if (url) {
        feedUrl = url;
    }
    else if (query) {
        feedUrl = buildGoogleNewsUrl(query);
    }
    else {
        throw new Error('Either a URL or a query must be provided to fetch an RSS feed.');
    }
    const feed = await parser.parseURL(feedUrl);
    // --- DEBUG LOG: Uncomment to see the raw RSS feed data ---
    // console.log('--- RAW RSS FEED ---');
    // console.log(JSON.stringify(feed, null, 2));
    // console.log('--------------------');
    // Normalize items and filter out any that are invalid
    const normalizedItems = feed.items
        .map(item => normalizeItem(item, source))
        .filter((item) => item !== null);
    return normalizedItems.slice(0, limit);
}
