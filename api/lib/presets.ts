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
	source: 'rss' | 'youtube';

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

/**
 * An array of all the preset categories.
 */
export const presets: Preset[] = [
	{
		id: 'sports',
		name: 'Sports',
		source: 'rss',
		params: {
			url: 'https://sports.espn.go.com/espn/rss/news',
			source: 'ESPN',
		},
	},
	{
		id: 'gaming',
		name: 'Gaming',
		source: 'rss',
		params: {
			query: 'gaming OR "video games"',
			source: 'Google News',
		},
	},
	{
		id: 'movies',
		name: 'Movies',
		source: 'rss',
		params: {
			query: 'movies OR "film trailers" OR "box office"',
			source: 'Google News',
		},
	},
	{
		id: 'music',
		name: 'Music',
		source: 'rss',
		params: {
			query: 'music OR songs OR artists OR concerts',
			source: 'Google News',
		},
	},
	{
		id: 'tv',
		name: 'TV',
		source: 'rss',
		params: {
			query: 'tv shows OR "streaming series" OR television',
			source: 'Google News',
		},
	},
	{
		id: 'books',
		name: 'Books',
		source: 'rss',
		params: {
			query: 'books OR literature',
			source: 'Google News',
		},
	},
	{
		id: 'coding',
		name: 'Coding',
		source: 'youtube',
		params: {
			playlistId: process.env.CODING_PLAYLIST_ID,
			query: 'coding',
		},
	},
	{
		id: 'cooking',
		name: 'Cooking',
		source: 'youtube',
		params: {
			playlistId: process.env.COOKING_PLAYLIST_ID,
			query: 'cooking recipes',
		},
	},
	{
		id: 'travel',
		name: 'Travel',
		source: 'youtube',
		params: {
			playlistId: process.env.TRAVEL_PLAYLIST_ID,
			query: 'travel vlogs',
		},
	},
	{
		id: 'celebrities',
		name: 'Celebrities',
		source: 'rss',
		params: {
			query: 'celebrity news',
			source: 'Google News',
		},
	},
	{
		id: 'finance',
		name: 'Finance',
		source: 'rss',
		params: {
			query: 'finance OR markets OR stocks',
			source: 'Google News',
		},
	},
	{
		id: 'science',
		name: 'Science',
		source: 'rss',
		params: {
			query: 'science OR research',
			source: 'Google News',
		},
	},
	{
		id: 'world',
		name: 'World',
		source: 'rss',
		params: {
			query: 'world news OR international news',
			source: 'Google News',
		},
	},
];