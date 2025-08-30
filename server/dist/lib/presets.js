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
            url: 'https://feeds.ign.com/ign/all',
            source: 'IGN',
        },
    },
    {
        id: 'movies',
        name: 'Movies',
        source: 'rss',
        params: {
            url: 'https://variety.com/feed/',
            source: 'Variety',
        },
    },
    {
        id: 'music',
        name: 'Music',
        source: 'rss',
        params: {
            url: 'https://www.billboard.com/feed/',
            source: 'Billboard',
        },
    },
    {
        id: 'tv',
        name: 'TV',
        source: 'rss',
        params: {
            url: 'https://tvline.com/feed/',
            source: 'TVLine',
        },
    },
    {
        id: 'books',
        name: 'Books',
        source: 'rss',
        params: {
            url: 'https://rss.nytimes.com/services/xml/rss/nyt/Books-BestSellers.xml',
            source: 'NYT Books',
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
            playlistId: process.env.COOKING_PLAYLIST_ID || 'PLUoqX-s3I6kJ_M2i_zK713A3M3sW_M4b9', // Bon Appétit
            query: 'cooking recipes',
        },
    },
    {
        id: 'travel',
        name: 'Travel',
        source: 'youtube',
        params: {
            playlistId: process.env.TRAVEL_PLAYLIST_ID || 'PLgJ4KxAso640j_a8M_2A043v4g0E1s3G-', // Kara and Nate
            query: 'travel vlogs',
        },
    },
    {
        id: 'celebrities',
        name: 'Celebrities',
        source: 'rss',
        params: {
            url: 'https://people.com/feed/',
            source: 'People',
        },
    },
    {
        id: 'finance',
        name: 'Finance',
        source: 'rss',
        params: {
            url: 'http://feeds.reuters.com/reuters/businessNews',
            source: 'Reuters',
        },
    },
    {
        id: 'science',
        name: 'Science',
        source: 'rss',
        params: {
            url: 'https://www.sciencedaily.com/rss/all.xml',
            source: 'ScienceDaily',
        },
    },
    {
        id: 'world',
        name: 'World',
        source: 'rss',
        params: {
            url: 'http://feeds.reuters.com/Reuters/worldNews',
            source: 'Reuters',
        },
    },
];
