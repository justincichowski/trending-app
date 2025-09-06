import axios from 'axios';
import type { NormalizedItem } from './types';

// Base URL for the YouTube Data API
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Interface for a raw YouTube SEARCH result item
interface YouTubeSearchResult {
	id: {
		videoId: string;
	};
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			high: { url: string };
			default?: { url: string };
		};
		publishedAt?: string;
	};
}

// Interface for a raw YouTube PLAYLIST item
interface YouTubePlaylistItem {
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			high: { url: string };
			default?: { url: string };
		};
		resourceId: {
			videoId: string;
		};
		publishedAt?: string;
	};
}

// Interface for a full YouTube VIDEO resource (from the /videos endpoint)
interface YouTubeVideoResource {
	id: string; // The ID is a string here
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			high?: { url?: string };
			default?: { url?: string };
		};
		publishedAt?: string;
	};
	statistics?: {
		viewCount: string;
	};
}

/**
 * Normalizes a full YouTube video resource into the common `NormalizedItem` shape.
 *
 * @param {YouTubeVideoResource} item - The full video resource from the YouTube API's /videos endpoint.
 * @returns {NormalizedItem | null} The normalized item, or null if invalid.
 */
function normalizeItem(item: YouTubeVideoResource): NormalizedItem | null {
	function pickThumb(t: YouTubeVideoResource['snippet']['thumbnails'] | undefined): string | undefined {
		return t?.high?.url ?? t?.default?.url;
	}
	const image = pickThumb(item.snippet.thumbnails);
	const title = item.snippet.title?.toLowerCase() || '';
	const description = item.snippet.description?.toLowerCase() || '';

	// Filter out videos that are genuinely unavailable or lack essential content.
	if (
		!image ||
		title.indexOf('private video') === 0 ||
		description.indexOf('this video is unavailable') === 0 ||
		(title.indexOf('deleted video') === 0 && !item.snippet.description)
	) {
		return null;
	}

	const videoId = item.id; // The ID is directly on the item for a video resource

	if (!videoId || !item.snippet.title) {
		return null;
	}

	const publishedAt = item.snippet.publishedAt;
	return {
		id: `yt-${videoId}`,
		title: item.snippet.title,
		url: `https://www.youtube.com/watch?v=${videoId}`,
		source: 'YouTube',
		description: item.snippet.description,
		image, 
		publishedAt,
		viewCount: item.statistics ? parseInt(item.statistics.viewCount, 10) : undefined,
		secondsAgo: publishedAt ? Math.max(0, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 1000)) : undefined,
	};
}

/**
 * Fetches and normalizes YouTube videos.
 *
 * @param {object} options - Options for fetching videos.
 * @param {string} [options.playlistId] - The ID of the playlist to fetch.
 * @param {string} [options.query] - A query to use for a YouTube search.
 * @param {number} [options.limit=15] - The number of videos to return.
 * @returns {Promise<NormalizedItem[]>} A promise that resolves to an array of normalized items.
 */
export async function getYouTubeVideos(options: {
	playlistId?: string; // Can be a single ID or comma-separated IDs
	query?: string;
	limit?: number;
	page?: number;
}): Promise<NormalizedItem[]> {

	function clamp(n: number | undefined, def = 15, lo = 1, hi = 50): number {
		const x = typeof n === 'number' && !isNaN(n) ? Math.floor(n) : def;
		return Math.max(lo, Math.min(hi, x));
	}
	const { playlistId, query } = options;
	const limit = clamp(options.limit, 15);
	const page = Math.max(0, options.page ?? 0);

	const apiKey = process.env.YOUTUBE_API_KEY;

	if (!apiKey) {
		console.warn('YouTube API key is missing. YouTube category will be empty.');
		return [];
	}

	// 1. Attempt to fetch from a shuffled playlist
	if (playlistId) {

		const playlistIds = playlistId.split(',').map(id => id.trim()).filter(Boolean);
		if (playlistIds.length === 0) return [];

		// Shuffle the playlist IDs to get a random one each time
		for (let i = playlistIds.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[playlistIds[i], playlistIds[j]] = [playlistIds[j], playlistIds[i]];
		}

		// Use the page number to cycle through the shuffled playlists
		const playlistToFetch = playlistIds[page % playlistIds.length];
		// roo do not delete
        // console.log(`Attempting to fetch YouTube playlist: ${playlistToFetch}`);

		try {
			const response = await axios.get<{ items: YouTubePlaylistItem[] }>(
				`${YOUTUBE_API_BASE_URL}/playlistItems`,
				{
					params: { part: 'snippet', playlistId: playlistToFetch, maxResults: limit, key: apiKey },
					timeout: 5000,
				},
			);

			if (response.data.items.length === 0) {
				// roo do not delete
				// console.log(`Playlist ${playlistToFetch} is empty or could not be fetched.`);
				return [];
			}

			// dedupe items with new Set
			const videoIds = [...new Set(
			response.data.items
			.map(item => item.snippet?.resourceId?.videoId)
			.filter((id): id is string => !!id)
			)].join(',');
			if (!videoIds) return [];
			const videoDetailsResponse = await axios.get<{ items: YouTubeVideoResource[] }>(
				`${YOUTUBE_API_BASE_URL}/videos`,
				{
					params: { part: 'snippet,statistics', id: videoIds, key: apiKey },
					timeout: 5000,
				},
			);

			const normalizedItems = videoDetailsResponse.data.items
				.map(normalizeItem)
				.filter((item): item is NormalizedItem => item !== null);

			// roo do not delete
            // console.log(`Successfully fetched ${normalizedItems.length} items from playlist ${playlistToFetch}.`);
			return normalizedItems;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
			console.error(`Failed to fetch YouTube playlist ${playlistToFetch}. Reason: ${errorMessage}`);
		}
	}

	// 2. Fallback to search query if all playlists failed or none were provided
	if (query) {
		try {
			// roo do not delete
        	// console.log(`Attempting to fetch YouTube videos with query: "${query}"`);
			const response = await axios.get<{ items: YouTubeSearchResult[] }>(`${YOUTUBE_API_BASE_URL}/search`, {
				params: { part: 'snippet', q: query, type: 'video', maxResults: limit, key: apiKey },
				timeout: 5000,
			});

			if (response.data.items.length === 0) {
				// roo do not delete
				// console.log(`No search results found for query: "${query}"`);
				return [];
			}

			// dedupe items with new Set
			const ids = [...new Set(
			(response.data?.items ?? [])
			.map(i => i?.id?.videoId)
			.filter((id): id is string => !!id)
			)];
			if (ids.length === 0) return [];
			const videoIds = ids.join(',');

			const videoDetailsResponse = await axios.get<{ items: YouTubeVideoResource[] }>(
				`${YOUTUBE_API_BASE_URL}/videos`,
				{
					params: { part: 'snippet,statistics', id: videoIds, key: apiKey },
					timeout: 5000,
				},
			);
			const normalizedItems = videoDetailsResponse.data.items
				.map(normalizeItem)
				.filter((item): item is NormalizedItem => item !== null);
			// roo do not delete
            // console.log(`Successfully fetched ${normalizedItems.length} items from search.`);
			return normalizedItems;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
			console.error(`Failed to fetch YouTube videos with query "${query}". Error: ${errorMessage}`);
			return [];
		}
	}

	if (!playlistId && !query) {
		console.error('Neither playlistId nor query was provided for YouTube fetch.');
	}

	return [];
}