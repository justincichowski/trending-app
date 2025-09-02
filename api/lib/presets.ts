import * as playlists from './playlists';

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
		source: 'youtube',
		params: {
			playlistId: playlists.SPORTS_PLAYLIST_IDS.join(','),
			query: 'sports highlights',
		},
	},
	{
		id: 'gaming',
		name: 'Gaming',
		source: 'youtube',
		params: {
			playlistId: playlists.GAMING_PLAYLIST_IDS.join(','),
			query: 'gaming news',
		},
	},
	{
		id: 'movies',
		name: 'Movies',
		source: 'youtube',
		params: {
			playlistId: playlists.MOVIES_PLAYLIST_IDS.join(','),
			query: 'movie trailers',
		},
	},
	{
		id: 'music',
		name: 'Music',
		source: 'youtube',
		params: {
			playlistId: playlists.MUSIC_PLAYLIST_IDS.join(','),
			query: 'new music',
		},
	},
	{
		id: 'tv',
		name: 'TV',
		source: 'youtube',
		params: {
			playlistId: playlists.TV_PLAYLIST_IDS.join(','),
			query: 'tv show clips',
		},
	},
	{
		id: 'books',
		name: 'Books',
		source: 'youtube',
		params: {
			playlistId: playlists.BOOKS_PLAYLIST_IDS.join(','),
			query: 'book reviews',
		},
	},
	{
		id: 'coding',
		name: 'Coding',
		source: 'youtube',
		params: {
			playlistId: playlists.CODING_PLAYLIST_IDS.join(','),
			query: 'coding',
		},
	},
	{
		id: 'cooking',
		name: 'Cooking',
		source: 'youtube',
		params: {
			playlistId: playlists.COOKING_PLAYLIST_IDS.join(','),
			query: 'cooking recipes',
		},
	},
	{
		id: 'travel',
		name: 'Travel',
		source: 'youtube',
		params: {
			playlistId: playlists.TRAVEL_PLAYLIST_IDS.join(','),
			query: 'travel vlogs',
		},
	},
	{
		id: 'celebrities',
		name: 'Celebrities',
		source: 'youtube',
		params: {
			playlistId: playlists.CELEBRITIES_PLAYLIST_IDS.join(','),
			query: 'celebrity news',
		},
	},
	{
		id: 'finance',
		name: 'Finance',
		source: 'youtube',
		params: {
			playlistId: playlists.FINANCE_PLAYLIST_IDS.join(','),
			query: 'finance news',
		},
	},
	{
		id: 'science',
		name: 'Science',
		source: 'youtube',
		params: {
			playlistId: playlists.SCIENCE_PLAYLIST_IDS.join(','),
			query: 'science news',
		},
	},
	{
		id: 'world',
		name: 'World',
		source: 'youtube',
		params: {
			playlistId: playlists.WORLD_PLAYLIST_IDS.join(','),
			query: 'world news',
		},
	},
];
 