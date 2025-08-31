"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.presets = void 0;
const playlists = __importStar(require("./playlists"));
/**
 * An array of all the preset categories.
 */
exports.presets = [
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
            query: 'video game news',
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
            query: 'new music videos',
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
            query: 'coding tutorials',
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
            query: 'celebrity interviews',
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
            query: 'science videos',
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
