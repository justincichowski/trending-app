/**
 * Represents a normalized item returned by the API.
 * This shape is consistent across all data sources.
 */
export interface NormalizedItem {
	/**
	 * A stable, unique identifier for the item.
	 */
	id: string;

	/**
	 * The title of the item.
	 */
	title: string;

	/**
	 * The URL pointing to the original content.
	 */
	url: string;

	/**
	 * The source of the item (e.g., "Hacker News", "ESPN").
	 */
	source: string;

	/**
	 * An optional short description or summary of the item.
	 */
	description?: string;

	/**
	 * An optional URL for a thumbnail or preview image.
	 */
	image?: string;

	/**
	 * An optional timestamp indicating when the item was published.
	 * This is a string in ISO 8601 format.
	 */
	publishedAt?: string;
	viewCount?: number;
	secondsAgo?: number;
}

/**
	* Represents the configuration for a preset category.
	*/
export interface Preset {
	/**
	 * A unique identifier for the preset.
	 */
	id: string;

	/**
	 * The display name of the category.
	 */
	name: string;

	/**
	 * The data source to use for this category.
	 */
	source: 'hackernews' | 'rss' | 'youtube' | 'local';

	/**
	 * The parameters to pass to the data source service.
	 */
	params: {
		url?: string;
		query?: string;
		playlistId?: string;
		source?: string;
		limit?: number;
	};
}