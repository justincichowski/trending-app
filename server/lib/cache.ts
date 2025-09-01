import fs from 'fs/promises';
import path from 'path';
import type { TopTrendsData } from './types';
import type { NormalizedItem } from './types';

const CACHE_DIR = path.resolve(__dirname, '../.cache');

// Ensure the cache directory exists
fs.mkdir(CACHE_DIR, { recursive: true });

type CacheData = TopTrendsData | Record<string, NormalizedItem[]>;

function isMeaningful(data:any):boolean{
  if (data == null) return false;
  if (Array.isArray(data)) return data.length>0;
  if (typeof data === 'object') return Object.keys(data).length>0;
  return true;
}

/**
 * Writes data to a cache file.
 * @param key The cache key (e.g., 'topTrends', 'trending').
 * @param data The data to write to the cache.
 */
export async function writeToCache(key: string, data: CacheData): Promise<void> {
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);
    if (!isMeaningful(data)) {
        return; // do not write empty
    }
    const cacheEntry = {
        lastFetched: Date.now(),
        data: data,
    };
    await fs.writeFile(cacheFile, JSON.stringify(cacheEntry, null, 2));
}

/**
 * Reads data from a cache file.
 * @param key The cache key.
 * @param maxAge The maximum age of the cache in milliseconds.
 * @returns The cached data, or null if it's stale or doesn't exist.
 */
export async function readFromCache<T extends CacheData>(key: string, maxAge: number): Promise<T | null> {
    const cacheFile = path.join(CACHE_DIR, `${key}.json`);
    try {
        const fileContent = await fs.readFile(cacheFile, 'utf-8');
        const cacheEntry = JSON.parse(fileContent);
        const now = Date.now();

        if (now - cacheEntry.lastFetched < maxAge) {
            if (!isMeaningful(cacheEntry.data)) return null;
            return cacheEntry.data as T;
        }
        return null;
    } catch (error) {
        // If the file doesn't exist or is invalid, return null
        return null;
    }
}