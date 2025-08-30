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
		const { data: html } = await axios.get(url, {
			timeout: 3000, // Increased timeout
			headers: {
				// Use a common user-agent to avoid being blocked
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			},
		});
		const match = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/);
		if (match && match[1]) {
			// console.log(`Scraped og:image: ${match[1]}`);
			return match[1];
		}
		return null;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		console.warn(`Could not scrape Open Graph image for ${url}. Reason: ${errorMessage}`);
		return null;
	}
}

/**
 * Extracts the first image URL from an HTML string.
 *
 * @param {string} html - The HTML content to parse.
 * @returns {string | null} The image URL, or null if not found.
 */
function extractImageFromContent(html: string): string | null {
	if (!html) return null;
	const match = html.match(/<img[^>]+src="([^"]+)"/);
	return match ? match[1] : null;
}

/**
 * A utility function to check if a URL is a generic Google News placeholder.
 *
 * @param {string | null | undefined} url - The URL to check.
 * @returns {boolean} True if the URL is a generic placeholder.
 */
function isGenericGoogleImage(url: string | null | undefined): boolean {
	return !!url && url.includes('googleusercontent.com');
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

	let imageUrl: string | undefined = undefined;

	// Strategy 1: Use the 'enclosure' tag if it's valid and not a generic image.
	if (item.enclosure?.url && !isGenericGoogleImage(item.enclosure.url)) {
		imageUrl = item.enclosure.url;
	}

	// Strategy 2: If no image yet, try to extract it from the 'content' field.
	if (!imageUrl) {
		const contentImage = extractImageFromContent(item.content || '');
		if (contentImage && !isGenericGoogleImage(contentImage)) {
			imageUrl = contentImage;
		}
	}

	// Strategy 3: As a last resort, scrape the page for an Open Graph image.
	if (!imageUrl) {
		const scrapedUrl = await getOpenGraphImage(item.link);
		if (scrapedUrl && !isGenericGoogleImage(scrapedUrl)) {
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
		image: imageUrl,
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

	// --- DEBUG LOG: Confirm number of items fetched from RSS feed ---
	console.log(`Fetched ${feed.items.length} raw items from RSS feed: ${feedUrl}`);
	/*
	// --- Previous debug log for inspecting a single raw item ---
	if (feed.items.length > 0) {
		console.log('--- RAW RSS ITEM DEBUG ---');
		console.log(JSON.stringify(feed.items[0], null, 2));
		console.log('--------------------------');
	}
	*/
	// --- END DEBUG LOG ---

	const limitedItems = feed.items.slice(0, limit);

	// Normalize items in parallel and filter out any that are invalid
	const normalizationPromises = limitedItems.map(item => normalizeItem(item, source));
	const normalizedItems = (await Promise.all(normalizationPromises)).filter(
		(item): item is NormalizedItem => item !== null
	);

	return normalizedItems;
}