"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHackerNewsStories = getHackerNewsStories;
const axios_1 = __importDefault(require("axios"));
// Base URL for the Hacker News API
const HACKERNEWS_API_BASE_URL = 'https://hacker-news.firebaseio.com/v0';
/**
 * Fetches the top story IDs from Hacker News.
 *
 * @returns {Promise<number[]>} A promise that resolves to an array of story IDs.
 */
async function getTopStoryIds() {
    const response = await axios_1.default.get(`${HACKERNEWS_API_BASE_URL}/topstories.json`, {
        timeout: 5000, // 5 second timeout
    });
    return response.data;
}
/**
 * Fetches a single Hacker News item by its ID.
 *
 * @param {number} id - The ID of the item to fetch.
 * @returns {Promise<HackerNewsItem>} A promise that resolves to the item data.
 */
async function getItem(id) {
    const response = await axios_1.default.get(`${HACKERNEWS_API_BASE_URL}/item/${id}.json`, {
        timeout: 5000, // 5 second timeout
    });
    return response.data;
}
/**
 * Normalizes a raw Hacker News item into the common `NormalizedItem` shape.
 *
 * @param {HackerNewsItem} item - The raw item from the Hacker News API.
 * @returns {NormalizedItem} The normalized item.
 */
function normalizeItem(item) {
    return {
        id: `hn-${item.id}`,
        title: item.title,
        url: item.url,
        source: 'Hacker News',
        description: `${item.score} points by ${item.by} | ${item.descendants} comments`,
        image: undefined,
    };
}
/**
 * Fetches and normalizes the top Hacker News stories.
 *
 * @param {object} [options] - Options for fetching stories.
 * @param {number} [options.limit=30] - The number of stories to return.
 * @returns {Promise<NormalizedItem[]>} A promise that resolves to an array of normalized items.
 */
async function getHackerNewsStories(options = {}) {
    const { limit = 30 } = options;
    const storyIds = await getTopStoryIds();
    const topStoryIds = storyIds.slice(0, limit);
    // Fetch items in parallel batches
    const storyPromises = topStoryIds.map(id => getItem(id));
    const stories = await Promise.all(storyPromises);
    return stories.map(normalizeItem);
}
