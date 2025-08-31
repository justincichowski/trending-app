/**
 * -----------------------------------------------------------------------------
 * API Client
 * -----------------------------------------------------------------------------
 * This module provides a simple API client for fetching data from the backend.
 * It uses the `fetch` API and handles basic error handling.
 * -----------------------------------------------------------------------------
 */

import type { NormalizedItem, Preset } from '../types';

// The base URL for the API, read from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * A helper function to fetch data from the API and handle errors.
 *
 * @param {string} url - The URL to fetch.
 * @returns {Promise<T>} A promise that resolves to the fetched data.
 */
async function get<T>(url: string): Promise<T> {
	const response = await fetch(url);
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
 * Fetches the items for a specific preset category.
 *
 * @param {string} id - The ID of the preset to fetch.
 * @returns {Promise<NormalizedItem[]>} A promise that resolves to an array of normalized items.
 */
export function getCategoryItems(id: string, page = 0): Promise<NormalizedItem[]> {
	return get<NormalizedItem[]>(`${API_BASE_URL}/presets?id=${id}&page=${page}`);
}