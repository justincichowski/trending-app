import type { TopTrendsData, TopTrendItem } from './types';
import { getYouTubeVideos } from './youtube';
import * as playlists from './playlists';

/**
 * Gathers all YouTube playlist IDs from the playlists file.
 * @returns An array of playlist ID strings.
 */
function getPlaylistIds(): string[] {
	return Object.values(playlists).flat();
}

/**
 * Fetches the top 25 trending topics from a random YouTube playlist.
 * This function does not handle caching; it directly fetches the data.
 *
 * @returns A promise that resolves to the top trends data.
 */
export async function fetchTopTrends(): Promise<TopTrendsData> {
	// DO NOT DELETE LOG — required for future debugging
	// console.log('Fetching new top trends data from YouTube...');
	const allPlaylistIds = getPlaylistIds();
	if (allPlaylistIds.length === 0) {
		console.error('No YouTube playlist IDs found in environment variables.');
		return { items: [], source: 'YouTube (Error)', fetchedAt: new Date().toISOString() };
	}

	const uniqueItems: TopTrendItem[] = [];
	const seenTitles = new Set<string>();
	const triedPlaylists = new Set<string>();

	// Keep trying until we have 25 unique items or run out of playlists
	while (uniqueItems.length < 25 && triedPlaylists.size < allPlaylistIds.length) {
		let randomPlaylistId;
		// Find a playlist we haven't tried yet
		do {
			randomPlaylistId = allPlaylistIds[Math.floor(Math.random() * allPlaylistIds.length)];
		} while (triedPlaylists.has(randomPlaylistId));

		triedPlaylists.add(randomPlaylistId);
		// DO NOT DELETE LOG — required for future debugging
		// console.log(`Attempting to fetch from playlist: ${randomPlaylistId}`);

		try {
			const rawItems = await getYouTubeVideos({ playlistId: randomPlaylistId, max: 50 });

			for (const item of rawItems) {
				const title = extractKeyword(item.title);
				const lowerCaseTitle = title.toLowerCase();

				if (title && !seenTitles.has(lowerCaseTitle)) {
					seenTitles.add(lowerCaseTitle);
					uniqueItems.push({
						title,
						url: item.url,
						fullItem: item,
					});
				}

				if (uniqueItems.length >= 25) {
					break; // Exit the inner loop once we have enough items
				}
			}
		} catch (error) {
			console.error(
				`Failed to fetch or process YouTube playlist ${randomPlaylistId}:`,
				error,
			);
			// Continue to the next playlist if one fails
		}
	}

	// DO NOT DELETE LOG — required for future debugging
	// console.log(`Successfully compiled ${uniqueItems.length} unique trending items.`);

	const data: TopTrendsData = {
		items: uniqueItems,
		source: 'YouTube Trending',
		fetchedAt: new Date().toISOString(),
	};

	return data;
}

/**
 * A list of common English stop words and YouTube-specific jargon.
 */
const STOP_WORDS = new Set([
	// Common English
	'a',
	'about',
	'above',
	'after',
	'again',
	'against',
	'all',
	'am',
	'an',
	'and',
	'any',
	'are',
	'as',
	'at',
	'be',
	'because',
	'been',
	'before',
	'being',
	'below',
	'between',
	'both',
	'but',
	'by',
	'can',
	'could',
	'did',
	'do',
	'does',
	'doing',
	'down',
	'during',
	'each',
	'end',
	'few',
	'for',
	'from',
	'further',
	'had',
	'has',
	'have',
	'having',
	'he',
	'her',
	'here',
	'hers',
	'herself',
	'him',
	'himself',
	'his',
	'how',
	'i',
	'if',
	'in',
	'into',
	'is',
	'it',
	'its',
	'itself',
	'isnt',
	'just',
	'me',
	'more',
	'most',
	'my',
	'myself',
	'no',
	'nor',
	'not',
	'now',
	'o',
	'of',
	'off',
	'on',
	'once',
	'only',
	'or',
	'other',
	'our',
	'ours',
	'ourselves',
	'out',
	'over',
	'own',
	's',
	'same',
	'she',
	'should',
	'so',
	'some',
	'such',
	't',
	'than',
	'that',
	'the',
	'their',
	'theirs',
	'them',
	'themselves',
	'then',
	'there',
	'these',
	'they',
	'this',
	'those',
	'through',
	'to',
	'too',
	'under',
	'until',
	'up',
	'very',
	'was',
	'we',
	'were',
	'what',
	'when',
	'where',
	'which',
	'while',
	'who',
	'whom',
	'why',
	'will',
	'with',
	'would',
	'you',
	'your',
	'yours',
	'yourself',
	'yourselves',

	// YouTube & Media Specific
	'official',
	'video',
	'music',
	'trailer',
	'teaser',
	'lyric',
	'lyrics',
	'audio',
	'hd',
	'4k',
	'live',
	'performance',
	'cover',
	'remix',
	'ft',
	'feat',
	'featuring',
	'prod',
	'by',
	'episode',
	'part',
	'clip',
	'scene',
	'highlight',
	'highlights',
	'gameplay',
	'walkthrough',
	'review',
	'unboxing',
	'tutorial',
	'guide',
	'how',
	'new',
	'exclusive',
	'full',
	'album',
	'movie',
	'show',
	'series',
	'today',
	'tonight',
	'tomorrow',
	'day',
	'week',
	'month',
	'year',
	'vs',
	'vs.',
	'the',
	'and',
	'with',
	'for',
	'of',
	'in',
	'on',
	'at',
	'to',
	'a',
	'an',
]);

/**
 * Extracts an intelligent keyword from a video title.
 * @param title The raw video title.
 * @returns A single keyword, or the first word if no better one is found.
 */
function extractKeyword(title: string): string {
	if (!title) return '';

	const cleanedTitle = title
		.replace(/\[.*?\]/g, '')
		.replace(/\(.*?\)/g, '')
		.trim();

	// 1. Prioritize multi-word capitalized phrases
	const capitalizedPhrases = cleanedTitle.match(/([A-Z][a-z']*\s){1,}[A-Z][a-z']*/g);
	if (capitalizedPhrases) {
		for (const phrase of capitalizedPhrases) {
			const trimmedPhrase = phrase.trim();
			// Ensure multi-word phrases don't consist of single letters (e.g., "A B")
			const wordsInPhrase = trimmedPhrase.split(' ');
			if (wordsInPhrase.length > 1 && wordsInPhrase.every((w) => w.length > 1)) {
				if (trimmedPhrase) return trimmedPhrase;
			}
		}
	}

	// 2. Fall back to single significant words
	const words = cleanedTitle
		.toLowerCase()
		.replace(/[^\w\s]/g, '')
		.split(/\s+/);
	for (const word of words) {
		if (word && word.length > 1 && !STOP_WORDS.has(word)) {
			return word;
		}
	}

	// 3. As a final fallback, find the first word of the original title that isn't a stop word
	const originalWords = title.split(/\s+/);
	for (const word of originalWords) {
		const cleanedWord = word.replace(/[^\w\s]/g, '');
		if (cleanedWord && cleanedWord.length > 1 && !STOP_WORDS.has(cleanedWord.toLowerCase())) {
			return cleanedWord; // return cleaned version
		}
	}

	return ''; // Return empty if no suitable word is found
}
 