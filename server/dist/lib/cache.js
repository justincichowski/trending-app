"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeToCache = writeToCache;
exports.readFromCache = readFromCache;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const CACHE_DIR = path_1.default.resolve(__dirname, '../.cache');
// Ensure the cache directory exists
promises_1.default.mkdir(CACHE_DIR, { recursive: true });
function isMeaningful(data) {
    if (data == null)
        return false;
    if (Array.isArray(data))
        return data.length > 0;
    if (typeof data === 'object')
        return Object.keys(data).length > 0;
    return true;
}
/**
 * Writes data to a cache file.
 * @param key The cache key (e.g., 'topTrends', 'trending').
 * @param data The data to write to the cache.
 */
async function writeToCache(key, data) {
    const cacheFile = path_1.default.join(CACHE_DIR, `${key}.json`);
    if (!isMeaningful(data)) {
        return; // do not write empty
    }
    const cacheEntry = {
        lastFetched: Date.now(),
        data: data,
    };
    await promises_1.default.writeFile(cacheFile, JSON.stringify(cacheEntry, null, 2));
}
/**
 * Reads data from a cache file.
 * @param key The cache key.
 * @param maxAge The maximum age of the cache in milliseconds.
 * @returns The cached data, or null if it's stale or doesn't exist.
 */
async function readFromCache(key, maxAge) {
    const cacheFile = path_1.default.join(CACHE_DIR, `${key}.json`);
    try {
        const fileContent = await promises_1.default.readFile(cacheFile, 'utf-8');
        const cacheEntry = JSON.parse(fileContent);
        const now = Date.now();
        if (now - cacheEntry.lastFetched < maxAge) {
            if (!isMeaningful(cacheEntry.data))
                return null;
            return cacheEntry.data;
        }
        return null;
    }
    catch (error) {
        // If the file doesn't exist or is invalid, return null
        return null;
    }
}
