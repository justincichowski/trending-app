import axios from 'axios';
import type { NormalizedItem } from './types';

// Base URL for the YouTube Data API
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Interface for the raw YouTube video shape from the API
interface YouTubeVideo {
	id: {
		videoId: string;
	};
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			high: {
				url: string;
			};
		};
	};
}

// Interface for the raw YouTube playlist item shape
interface YouTubePlaylistItem {
	snippet: {
		title: string;
		description: string;
		thumbnails: {
			high: {
				url: string;
			};
		};
		resourceId: {
			videoId: string;
		};
	};
}

/**
 * Type guard to check if an item is a YouTubePlaylistItem.
 *
 * @param {YouTubeVideo | YouTubePlaylistItem} item - The item to check.
 * @returns {item is YouTubePlaylistItem} True if the item is a YouTubePlaylistItem.
 */
function isPlaylistItem(item: YouTubeVideo | YouTubePlaylistItem): item is YouTubePlaylistItem {
	return 'resourceId' in item.snippet;
}

/**
 * Normalizes a raw YouTube video or playlist item into the common `NormalizedItem` shape.
 *
 * @param {YouTubeVideo | YouTubePlaylistItem} item - The raw item from the YouTube API.
 * @returns {NormalizedItem | null} The normalized item, or null if invalid.
 */
function normalizeItem(item: YouTubeVideo | YouTubePlaylistItem): NormalizedItem | null {
	let videoId: string;
	if (isPlaylistItem(item)) {
		videoId = item.snippet.resourceId.videoId;
	} else {
		videoId = item.id.videoId;
	}

	if (!videoId || !item.snippet.title) {
		return null;
	}

	return {
		id: `yt-${videoId}`,
		title: item.snippet.title,
		url: `https://www.youtube.com/watch?v=${videoId}`,
		source: 'YouTube',
		description: item.snippet.description,
		image: item.snippet.thumbnails.high.url,
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
	playlistId?: string;
	query?: string;
	limit?: number;
}): Promise<NormalizedItem[]> {
	const { playlistId, query, limit = 15 } = options;
	const apiKey = process.env.YOUTUBE_API_KEY;

	if (!apiKey) {
		throw new Error('YouTube API key is missing.');
	}

	let response;
	if (playlistId) {
		// Fetch videos from a playlist
		response = await axios.get<{ items: YouTubePlaylistItem[] }>(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
			params: {
				part: 'snippet',
				playlistId,
				maxResults: limit,
				key: apiKey,
			},
			timeout: 5000, // 5 second timeout
		});
	} else if (query) {
		// Fall back to a search query
		response = await axios.get<{ items: YouTubeVideo[] }>(`${YOUTUBE_API_BASE_URL}/search`, {
			params: {
				part: 'snippet',
				q: query,
				type: 'video',
				maxResults: limit,
				key: apiKey,
			},
			timeout: 5000, // 5 second timeout
		});
	} else {
		throw new Error('Either a playlistId or a query must be provided to fetch YouTube videos.');
	}

	// Normalize items and filter out any that are invalid
	const normalizedItems = response.data.items
		.map(normalizeItem)
		.filter((item): item is NormalizedItem => item !== null);

	return normalizedItems;
}