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
    const image = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url;
    const title = item.snippet.title?.toLowerCase() || '';
    const description = item.snippet.description?.toLowerCase() || '';
    // Filter out videos that are genuinely unavailable or lack essential content.
    // Comparisons are case-insensitive and check if the string starts with the given text.
    if (!image || // Must have an image
        title.indexOf('private video') === 0 ||
        description.indexOf('this video is unavailable') === 0 ||
        (title.indexOf('deleted video') === 0 && !item.snippet.description)) {
        return null;
    }
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
        image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
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
    const { playlistId, query, limit = 15, page = 0 } = options;
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.warn('YouTube API key is missing. YouTube category will be empty.');
        return [];
    }
    // 1. Attempt to fetch from a shuffled playlist
    if (playlistId) {
        const playlistIds = playlistId.split(',').map(id => id.trim());
        // Shuffle the playlist IDs to get a random one each time
        for (let i = playlistIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playlistIds[i], playlistIds[j]] = [playlistIds[j], playlistIds[i]];
        }
        // Use the page number to cycle through the shuffled playlists
        const playlistToFetch = playlistIds[page % playlistIds.length];
        console.log(`Attempting to fetch YouTube playlist: ${playlistToFetch}`);
        try {
            const response = await axios_1.default.get(`${YOUTUBE_API_BASE_URL}/playlistItems`, {
                params: { part: 'snippet', playlistId: playlistToFetch, maxResults: limit, key: apiKey },
                timeout: 5000,
            });
            const normalizedItems = response.data.items
                .map(normalizeItem)
                .filter((item) => item !== null);
            console.log(`Successfully fetched ${normalizedItems.length} items from playlist ${playlistToFetch}.`);
            return normalizedItems;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error(`Failed to fetch YouTube playlist ${playlistToFetch}. Reason: ${errorMessage}`);
        }
    }
    // 2. Fallback to search query if all playlists failed or none were provided
    if (query) {
        try {
            console.log(`Attempting to fetch YouTube videos with query: "${query}"`);
            const response = await axios_1.default.get(`${YOUTUBE_API_BASE_URL}/search`, {
                params: { part: 'snippet', q: query, type: 'video', maxResults: limit, key: apiKey },
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
            return [];
        }
    }
    if (!playlistId && !query) {
        console.error('Neither playlistId nor query was provided for YouTube fetch.');
    }
    return [];
}
