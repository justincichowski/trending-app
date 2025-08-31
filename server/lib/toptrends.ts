import type { TopTrendsData, TopTrendItem } from './types';
import { getYouTubeVideos } from './youtube';

/**
 * Gathers all YouTube playlist IDs from environment variables.
 * @returns An array of playlist ID strings.
 */
function getPlaylistIds(): string[] {
	const playlistIds: string[] = [];
	for (const key in process.env) {
		if (key.endsWith('_PLAYLIST_ID') && process.env[key]) {
			playlistIds.push(...(process.env[key] as string).split(','));
		}
	}
	return playlistIds;
}

/**
 * Fetches the top 25 trending topics from a random YouTube playlist.
 * This function does not handle caching; it directly fetches the data.
 *
 * @returns A promise that resolves to the top trends data.
 */
export async function fetchTopTrends(): Promise<TopTrendsData> {
	console.log('Fetching new top trends data from YouTube...');
	const allPlaylistIds = getPlaylistIds();
	if (allPlaylistIds.length === 0) {
		console.error('No YouTube playlist IDs found in environment variables.');
		return { items: [], source: 'YouTube (Error)', fetchedAt: new Date().toISOString() };
	}

	const randomPlaylistId = allPlaylistIds[Math.floor(Math.random() * allPlaylistIds.length)];

	try {
		// Fetch more items to ensure we can find 25 unique topics after deduplication.
		const rawItems = await getYouTubeVideos({ playlistId: randomPlaylistId, limit: 50 });

		const uniqueItems: TopTrendItem[] = [];
		const seenTitles = new Set<string>();

		for (const item of rawItems) {
			const title = extractKeyword(item.title);
			const lowerCaseTitle = title.toLowerCase();

			// Add the item only if the title is valid and we haven't seen it before.
			if (title && !seenTitles.has(lowerCaseTitle)) {
				seenTitles.add(lowerCaseTitle);
				uniqueItems.push({
					title,
					url: item.url,
				});
			}

			// Stop once we have collected 25 unique items.
			if (uniqueItems.length >= 25) {
				break;
			}
		}

		const data: TopTrendsData = {
			items: uniqueItems,
			source: `YouTube Playlist: ${randomPlaylistId}`,
			fetchedAt: new Date().toISOString(),
		};

		return data;
	} catch (error) {
		console.error(`Failed to fetch YouTube playlist ${randomPlaylistId}:`, error);
		return {
			items: [],
			source: 'YouTube (Error)',
			fetchedAt: new Date().toISOString(),
		};
	}
}

/**
	* A list of common English stop words and YouTube-specific jargon.
	*/
const STOP_WORDS = new Set([
	// Common English
	'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
	'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
	'can', 'could',
	'did', 'do', 'does', 'doing', 'down', 'during',
	'each',
	'few', 'for', 'from', 'further',
	'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
	'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
	'just',
	'me', 'more', 'most', 'my', 'myself',
	'no', 'nor', 'not', 'now',
	'o', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
	's', 'same', 'she', 'should', 'so', 'some', 'such',
	't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
	'under', 'until', 'up',
	'very',
	'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would',
	'you', 'your', 'yours', 'yourself', 'yourselves',

	// YouTube & Media Specific
	'official', 'video', 'music', 'trailer', 'teaser', 'lyric', 'lyrics', 'audio', 'hd', '4k', 'live',
	'performance', 'cover', 'remix', 'ft', 'feat', 'featuring', 'prod', 'by',
	'episode', 'part', 'clip', 'scene', 'highlight', 'highlights',
	'gameplay', 'walkthrough', 'review', 'unboxing', 'tutorial', 'guide', 'how',
	'new', 'exclusive', 'full', 'album', 'movie', 'show', 'series',
	'vs', 'vs.',
]);

/**
	* Extracts an intelligent keyword from a video title.
	* @param title The raw video title.
	* @returns A single keyword, or the first word if no better one is found.
	*/
function extractKeyword(title: string): string {
	if (!title) return '';

	// Clean the title from bracketed/parenthesized content first
	const cleanedTitle = title.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();

	// 1. Prioritize multi-word capitalized phrases (potential proper nouns)
	// This regex finds sequences of 2 or more capitalized words.
	const capitalizedPhrases = cleanedTitle.match(/([A-Z][a-z']*\s){1,}[A-Z][a-z']*/g);
	if (capitalizedPhrases) {
		for (const phrase of capitalizedPhrases) {
			// Return the first valid capitalized phrase found
			const trimmedPhrase = phrase.trim();
			if (trimmedPhrase) return trimmedPhrase;
		}
	}

	// 2. If no phrases, fall back to single significant words
	const words = cleanedTitle
		.toLowerCase()
		.replace(/[^\w\s]/g, '') // Remove punctuation
		.split(/\s+/);

	for (const word of words) {
		if (word && !STOP_WORDS.has(word)) {
			return word;
		}
	}

	// 3. As a final fallback, return the first word of the original title
	return title.split(/\s+/)[0] || '';
}