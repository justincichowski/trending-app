import type { Preset } from './types';

/**
 * An array of all the preset categories.
 */
export const presets: Preset[] = [
	{
		id: 'sports',
		name: 'Sports',
		source: 'youtube',
		params: {
			playlistId: process.env.SPORTS_PLAYLIST_ID,
			query: 'sports highlights',
		},
	},
	{
		id: 'gaming',
		name: 'Gaming',
		source: 'youtube',
		params: {
			playlistId: process.env.GAMING_PLAYLIST_ID,
			query: 'video game news',
		},
	},
	{
		id: 'movies',
		name: 'Movies',
		source: 'youtube',
		params: {
			playlistId: process.env.MOVIES_PLAYLIST_ID,
			query: 'movie trailers',
		},
	},
	{
		id: 'music',
		name: 'Music',
		source: 'youtube',
		params: {
			playlistId: process.env.MUSIC_PLAYLIST_ID,
			query: 'new music videos',
		},
	},
	{
		id: 'tv',
		name: 'TV',
		source: 'youtube',
		params: {
			playlistId: process.env.TV_PLAYLIST_ID,
			query: 'tv show clips',
		},
	},
	{
		id: 'books',
		name: 'Books',
		source: 'youtube',
		params: {
			playlistId: process.env.BOOKS_PLAYLIST_ID,
			query: 'book reviews',
		},
	},
	{
		id: 'coding',
		name: 'Coding',
		source: 'youtube',
		params: {
			playlistId: process.env.CODING_PLAYLIST_ID,
			query: 'coding tutorials',
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
		source: 'youtube',
		params: {
			playlistId: process.env.CELEBRITIES_PLAYLIST_ID,
			query: 'celebrity interviews',
		},
	},
	{
		id: 'finance',
		name: 'Finance',
		source: 'youtube',
		params: {
			playlistId: process.env.FINANCE_PLAYLIST_ID,
			query: 'finance news',
		},
	},
	{
		id: 'science',
		name: 'Science',
		source: 'youtube',
		params: {
			playlistId: process.env.SCIENCE_PLAYLIST_ID,
			query: 'science videos',
		},
	},
	{
		id: 'world',
		name: 'World',
		source: 'youtube',
		params: {
			playlistId: process.env.WORLD_PLAYLIST_ID,
			query: 'world news',
		},
	},
];