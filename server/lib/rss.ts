import Parser from 'rss-parser';
import axios from 'axios';
import type { NormalizedItem } from './types';

// Create a new RSS parser instance
const parser = new Parser();

/**
 * Fetches the HTML of a page and extracts the Open Graph image URL.
 *
 * @param {string} url - The URL of the page to fetch.
 * @returns {Promise<string | null>} The image URL, or null if not found.
 */
async function getOpenGraphImage(url: string): Promise<string | null> {
	try {
		const { data: html } = await axios.get(url, { timeout: 2000 });
		const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
		return match ? match[1] : null;
	} catch (error) {
		// Ignore errors (e.g., timeouts, 404s)
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
async function normalizeItem(item: Parser.Item, source: string): Promise<NormalizedItem | null> {
	if (!item.title || !item.link) {
		return null;
	}

	const imageUrl = await getOpenGraphImage(item.link);

	return {
		id: item.guid || item.link,
		title: item.title,
		url: item.link,
		source: source,
		description: item.contentSnippet,
		publishedAt: item.isoDate,
		image: imageUrl || undefined,
	};
}

/**
 * Builds a Google News RSS feed URL from a search query.
 *
 * @param {string} query - The search query.
 * @returns {string} The full Google News RSS URL.
 */
function buildGoogleNewsUrl(query: string): string {
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
export async function getRssFeed(options: {
	url?: string;
	query?: string;
	source?: string;
	limit?: number;
}): Promise<NormalizedItem[]> {
	const { url, query, source = 'RSS', limit = 30 } = options;

	let feedUrl: string;
	if (url) {
		feedUrl = url;
	} else if (query) {
		feedUrl = buildGoogleNewsUrl(query);
	} else {
		throw new Error('Either a URL or a query must be provided to fetch an RSS feed.');
	}

	const feed = await parser.parseURL(feedUrl);
	const limitedItems = feed.items.slice(0, limit);

	// Normalize items in parallel and filter out any that are invalid
	const normalizationPromises = limitedItems.map(item => normalizeItem(item, source));
	const normalizedItems = (await Promise.all(normalizationPromises)).filter(
		(item): item is NormalizedItem => item !== null
	);

	return normalizedItems;
}