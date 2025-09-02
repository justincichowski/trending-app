/**
 * -----------------------------------------------------------------------------
 * API Client
 * -----------------------------------------------------------------------------
 * This module provides a simple API client for fetching data from the backend.
 * It uses the `fetch` API and handles basic error handling.
 * -----------------------------------------------------------------------------
 */

import type { NormalizedItem, Preset } from '../types';
import type { TopTrendsData, TrendingData } from '../types';

// The base URL for the API, read from environment variables
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3000/api' : (import.meta.env.VITE_API_URL || '/api');
// roo: default logs, do not delete
// DO NOT DELETE LOG — required for future debugging
// console.log('[Client] API_BASE_URL =', API_BASE_URL);

/**
 * A helper function to fetch data from the API and handle errors.
 *
 * @param {string} url - The URL to fetch.
 * @returns {Promise<T>} A promise that resolves to the fetched data.
 */
export async function get<T>(url:string): Promise<T> {
	// DO NOT DELETE LOG — required for future debugging
	// console.log(`[Client] Sending request to: ${url}`);
	const response = await fetch(url);
	if (response.status === 204) {
		// treat as empty result
		// @ts-ignore
		return {} as any;
	}
	if (!response.ok) {
		throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
	}
	return response.json();
}

/**
 * Fetches the list of all preset categories.
 *
 * @returns {Promise<Preset[]>} A promise that resolves to an array of presets.
 */
export function getCategories(): Promise<Preset[]> {
	return get<Preset[]>(`${API_BASE_URL}/presets`);
}

/**
 * Fetches the items for the "All" category.
 *
 * @param {number} page - The page number to fetch.
 * @param {string[]} excludedIds - An array of item IDs to exclude.
 * @returns {Promise<NormalizedItem[]>} A promise that resolves to an array of normalized items.
 */
export function getAllItems(page = 0, excludedIds: string[] = [], limit?: number): Promise<NormalizedItem[]> {
	const excludedIdsParam = excludedIds.length > 0 ? `&excludedIds=${excludedIds.join(',')}` : '';
	let url = `${API_BASE_URL}/all?page=${page}${excludedIdsParam}`;
	if (limit) {
		url += `&limit=${limit}`;
	}
	return get<NormalizedItem[]>(url);
}

/**
 * Fetches the items for a specific preset category.
 *
 * @param {string} id - The ID of the preset to fetch.
 * @returns {Promise<NormalizedItem[]>} A promise that resolves to an array of normalized items.
 */
export function getCategoryItems(id: string, page = 0, limit?: number, excludedIds: string[] = [], query?: string): Promise<NormalizedItem[]> {
	let url = `${API_BASE_URL}/presets?id=${id}&page=${page}`;
	if (limit) {
		url += `&limit=${limit}`;
	}
	if (excludedIds.length > 0) {
		url += `&excludedIds=${excludedIds.join(',')}`;
	}
	if (query) {
		url += `&query=${encodeURIComponent(query)}`;
	}
	return get<NormalizedItem[]>(url);
}
/**
 * Fetches the top trends data.
 *
 * @returns {Promise<TopTrendsData>} A promise that resolves to the top trends data.
 */
export function getTopTrends(): Promise<TopTrendsData> {
	return get<TopTrendsData>(`${API_BASE_URL}/toptrends`);
}

/**
 * Fetches the trending data.
 *
 * @returns {Promise<TrendingData>} A promise that resolves to the trending data.
 */
export function getTrending(): Promise<TrendingData> {
	return get<TrendingData>(`${API_BASE_URL}/trending`);
}

export async function fetchAll(options?: { id?: string }) {
  const qs = options?.id ? `?id=${encodeURIComponent(options.id)}` : '';
  const r = await fetch(`${API_BASE_URL}/all${qs}`);
  if (!r.ok) throw new Error(`/all failed: ${r.status}`);
  return r.json();
}
