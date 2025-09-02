/**
 * A utility for interacting with local storage.
 */
export const storage = {
	/**
	 * Gets an item from local storage.
	 *
	 * @param {string} key - The key of the item to get.
	 * @returns {T | null} The parsed item, or null if not found.
	 */
	get<T>(key: string): T | null {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	},

	/**
	 * Sets an item in local storage.
	 *
	 * @param {string} key - The key of the item to set.
	 * @param {T} value - The value to set.
	 */
	set<T>(key: string, value: T) {
		localStorage.setItem(key, JSON.stringify(value));
	},
};
 