"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file in the project root
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const static_1 = __importDefault(require("@fastify/static"));
const view_1 = __importDefault(require("@fastify/view"));
const ejs_1 = __importDefault(require("ejs"));
const hackernews_1 = require("./lib/hackernews");
const rss_1 = require("./lib/rss");
const youtube_1 = require("./lib/youtube");
const presets_1 = require("./lib/presets");
// Create a new Fastify server instance
const server = (0, fastify_1.default)({
    logger: true,
});
/**
 * Main function to set up and start the server.
 */
const main = async () => {
    // Register the CORS plugin to handle cross-origin requests
    await server.register(cors_1.default, {
        origin: 'http://localhost:5173', // Allow requests from the Vite client
        credentials: true, // Allow cookies to be sent
    });
    // Register the cookie parser plugin
    await server.register(cookie_1.default, {
        secret: process.env.COOKIE_SECRET || 'a-default-secret-for-development', // Use a default for safety
    });
    // Register the view engine
    await server.register(view_1.default, {
        engine: {
            ejs: ejs_1.default,
        },
        root: path_1.default.join(__dirname, '../../client'),
    });
    // In production, serve static files from the client's 'dist' directory.
    // In development, Vite handles this.
    if (process.env.NODE_ENV === 'production') {
        await server.register(static_1.default, {
            root: path_1.default.join(__dirname, '../../client/dist'),
            prefix: '/',
        });
    }
    /**
     * Serves the main index.html file as a view, injecting the theme.
     * This is used in both development (via Vite proxy) and production.
     */
    server.get('/', async (request, reply) => {
        const { theme: themeCookie } = request.cookies;
        const theme = themeCookie === 'dark' ? 'dark' : 'light';
        server.log.info(`[Server] Reading 'theme' cookie: ${themeCookie}. Setting theme to: ${theme}`);
        // Define critical CSS variables for both themes to prevent FOUC.
        // The correct theme is applied via the class on the <html> tag.
        const criticalCss = `
			<style>
				:root {
					--background-color: #ffffff;
					--text-color: #333333;
				}
				html.dark-theme {
					--background-color: #121212;
					--text-color: #ffffff;
				}
			</style>
		`;
        return reply.view('index.html', { theme, criticalCss });
    });
    /**
        * A health check endpoint that responds with an "ok" status.
     */
    server.get('/health', async (request, reply) => {
        return { status: 'ok' };
    });
    /**
     * An endpoint to set the theme cookie.
     */
    server.post('/v1/theme', async (request, reply) => {
        const { theme } = request.body;
        console.log(`[Server] Received theme update request: ${theme}`);
        if (theme === 'light' || theme === 'dark') {
            reply.setCookie('theme', theme, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 31536000, // 1 year
            });
            return { success: true };
        }
        reply.status(400).send({ error: 'Invalid theme' });
    });
    /**
     * An endpoint that returns the top Hacker News stories.
     */
    server.get('/hackernews', async (request, reply) => {
        try {
            const stories = await (0, hackernews_1.getHackerNewsStories)({ limit: 30 });
            return stories;
        }
        catch (error) {
            server.log.error(error);
            reply.status(500).send({ error: 'Failed to fetch Hacker News stories.' });
        }
    });
    /**
     * An endpoint that fetches and normalizes an RSS feed.
     */
    server.get('/rss', async (request, reply) => {
        const { url, query, source, limit } = request.query;
        if (!url && !query) {
            reply.status(400).send({ error: 'Either a `url` or a `query` parameter must be provided.' });
            return;
        }
        try {
            const feed = await (0, rss_1.getRssFeed)({
                url,
                query,
                source,
                limit: limit ? parseInt(limit, 10) : undefined,
            });
            return feed;
        }
        catch (error) {
            server.log.error(error);
            reply.status(500).send({ error: 'Failed to fetch RSS feed.' });
        }
    });
    /**
     * An endpoint that returns a list of preset categories or the items for a specific category.
     */
    server.get('/presets', async (request, reply) => {
        const { id, page, excludedIds: excludedIdsQuery } = request.query;
        const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',') : [];
        if (!id) {
            return presets_1.presets;
        }
        const preset = presets_1.presets.find(p => p.id === id);
        if (!preset) {
            reply.status(404).send({ error: 'Preset not found.' });
            return;
        }
        try {
            let items = [];
            const pageNumber = page ? parseInt(page, 10) : 0;
            switch (preset.source) {
                case 'hackernews':
                    items = await (0, hackernews_1.getHackerNewsStories)({ ...preset.params, page: pageNumber });
                    break;
                case 'rss':
                    items = await (0, rss_1.getRssFeed)({ ...preset.params, page: pageNumber });
                    break;
                case 'youtube':
                    items = await (0, youtube_1.getYouTubeVideos)({ ...preset.params, page: pageNumber });
                    break;
            }
            // Filter out excluded IDs
            const filteredItems = items.filter(item => !excludedIds.includes(item.id));
            console.log(`Sending ${filteredItems.length} items for preset: ${preset.name}`);
            return filteredItems;
        }
        catch (error) {
            server.log.error(error);
            reply.status(500).send({ error: `Failed to fetch data for preset: ${preset.name}.` });
        }
    });
    /**
     * An endpoint that returns a shuffled mix of items from all presets.
     * Used for the "All" category feed.
     */
    server.get('/all', async (request, reply) => {
        const { page, excludedIds: excludedIdsQuery } = request.query;
        const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',') : [];
        try {
            const pageNumber = page ? parseInt(page, 10) : 0;
            const fetchPromises = [];
            // Get all presets except for local ones (like 'Favorites')
            const remotePresets = presets_1.presets.filter(p => p.source !== 'local');
            for (const preset of remotePresets) {
                switch (preset.source) {
                    case 'hackernews':
                        fetchPromises.push((0, hackernews_1.getHackerNewsStories)({ ...preset.params, page: pageNumber, limit: 5 }));
                        break;
                    case 'rss':
                        fetchPromises.push((0, rss_1.getRssFeed)({ ...preset.params, page: pageNumber, limit: 5 }));
                        break;
                    case 'youtube':
                        fetchPromises.push((0, youtube_1.getYouTubeVideos)({ ...preset.params, page: pageNumber, limit: 5 }));
                        break;
                }
            }
            const allItemsArrays = await Promise.all(fetchPromises);
            let allItems = allItemsArrays.flat();
            // Filter out excluded IDs
            const filteredItems = allItems.filter(item => !excludedIds.includes(item.id));
            // Shuffle the combined items
            for (let i = filteredItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredItems[i], filteredItems[j]] = [filteredItems[j], filteredItems[i]];
            }
            return filteredItems;
        }
        catch (error) {
            server.log.error(error, 'Failed to fetch the "All" feed');
            reply.status(500).send({ error: 'Failed to fetch the "All" feed.' });
        }
    });
    /**
     * Starts the Fastify server on port 3000.
     */
    try {
        await server.listen({ port: 3000 });
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
main();
