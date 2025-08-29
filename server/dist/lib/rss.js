"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRssFeed = getRssFeed;
const rss_parser_1 = __importDefault(require("rss-parser"));
const axios_1 = __importDefault(require("axios"));
// Create a new RSS parser instance
const parser = new rss_parser_1.default();
/**
 * Fetches the HTML of a page and extracts the Open Graph image URL.
 *
 * @param {string} url - The URL of the page to fetch.
 * @returns {Promise<string | null>} The image URL, or null if not found.
 */
async function getOpenGraphImage(url) {
    try {
        const { data: html } = await axios_1.default.get(url, {
            timeout: 3000, // Increased timeout
            headers: {
                // Use a common user-agent to avoid being blocked
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });
        const match = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/);
        if (match && match[1]) {
            console.log(`Scraped og:image: ${match[1]}`);
            return match[1];
        }
        return null;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.warn(`Could not scrape Open Graph image for ${url}. Reason: ${errorMessage}`);
        return null;
    }
}
/**
 * Normalizes a raw RSS item into the common `NormalizedItem` shape.
 * Returns null if the item is missing essential fields.
 *
 * @param {Parser.Item} item - The raw item from the RSS feed.
 * @param {string} source - The source label for the feed.
 * @returns {Promise<NormalizedItem | null>} The normalized item, or null if invalid.
 */
async function normalizeItem(item, source) {
    if (!item.title || !item.link) {
        return null;
    }
    let imageUrl = undefined;
    // 1. Prioritize the RSS feed's enclosure image if it's a valid, non-generic URL.
    if (item.enclosure?.url && !item.enclosure.url.includes('googleusercontent.com')) {
        imageUrl = item.enclosure.url;
    }
    // 2. If no valid image was found in the enclosure, fall back to scraping the Open Graph image.
    if (!imageUrl) {
        const scrapedUrl = await getOpenGraphImage(item.link);
        // 3. Ensure the scraped image is also not a generic Google one.
        if (scrapedUrl && !scrapedUrl.includes('googleusercontent.com')) {
            imageUrl = scrapedUrl;
        }
    }
    return {
        id: item.guid || item.link,
        title: item.title,
        url: item.link,
        source: source,
        description: item.contentSnippet,
        publishedAt: item.isoDate,
        image: imageUrl, // Will be undefined if no valid image was found
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
    const limitedItems = feed.items.slice(0, limit);
    // Normalize items in parallel and filter out any that are invalid
    const normalizationPromises = limitedItems.map(item => normalizeItem(item, source));
    const normalizedItems = (await Promise.all(normalizationPromises)).filter((item) => item !== null);
    return normalizedItems;
}
