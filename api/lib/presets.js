"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presets = void 0;
/**
 * An array of all the preset categories.
 */
exports.presets = [
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
        source: 'hackernews',
        params: {
            limit: 30,
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
