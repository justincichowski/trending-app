"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYouTubeVideos = getYouTubeVideos;
const axios_1 = __importDefault(require("axios"));
// Base URL for the YouTube Data API
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
/**
 * Type guard to check if an item is a YouTubePlaylistItem.
 *
 * @param {YouTubeVideo | YouTubePlaylistItem} item - The item to check.
 * @returns {item is YouTubePlaylistItem} True if the item is a YouTubePlaylistItem.
 */
function isPlaylistItem(item) {
    return 'resourceId' in item.snippet;
}
/**
 * Normalizes a raw YouTube video or playlist item into the common `NormalizedItem` shape.
 *
 * @param {YouTubeVideo | YouTubePlaylistItem} item - The raw item from the YouTube API.
 * @returns {NormalizedItem | null} The normalized item, or null if invalid.
 */
function normalizeItem(item) {
    let videoId;
    if (isPlaylistItem(item)) {
        videoId = item.snippet.resourceId.videoId;
    }
    else {
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
async function getYouTubeVideos(options) {
    const { playlistId, query, limit = 15 } = options;
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.warn('YouTube API key is missing. YouTube category will be empty.');
        return [];
    }
    // 1. Attempt to fetch from playlist if ID is provided
    if (playlistId) {
        try {
            console.log(`Attempting to fetch YouTube playlist: ${playlistId}`);
            const response = await axios_1.default.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
                params: {
                    part: 'snippet',
                    playlistId,
                    maxResults: limit,
                    key: apiKey,
                },
                timeout: 5000, // 5 second timeout
            });
            const normalizedItems = response.data.items
                .map(normalizeItem)
                .filter((item) => item !== null);
            // If we get items, return them. Otherwise, we'll fall through to search.
            if (normalizedItems.length > 0) {
                console.log(`Successfully fetched ${normalizedItems.length} items from playlist.`);
                return normalizedItems;
            }
            console.log('Playlist was empty or invalid, falling back to search query.');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error(`Failed to fetch YouTube playlist ${playlistId}. Falling back to search query. Error: ${errorMessage}`);
            // Don't re-throw, just log and fall through to the search query
        }
    }
    // 2. Fallback to search query if playlist failed or wasn't provided
    if (query) {
        try {
            console.log(`Attempting to fetch YouTube videos with query: "${query}"`);
            const response = await axios_1.default.get(`${YOUTUBE_API_BASE_URL}/search`, {
                params: {
                    part: 'snippet',
                    q: query,
                    type: 'video',
                    maxResults: limit,
                    key: apiKey,
                },
                timeout: 5000,
            });
            const normalizedItems = response.data.items
                .map(normalizeItem)
                .filter((item) => item !== null);
            console.log(`Successfully fetched ${normalizedItems.length} items from search.`);
            return normalizedItems;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error(`Failed to fetch YouTube videos with query "${query}". Error: ${errorMessage}`);
            // If search also fails, return an empty array to prevent crashing the app
            return [];
        }
    }
    // 3. If no query was provided and playlist failed, or if no params at all
    if (!playlistId && !query) {
        console.error('Neither playlistId nor query was provided for YouTube fetch.');
    }
    // This case is reached if playlist fetch fails and there is no query to fall back on.
    return [];
}
