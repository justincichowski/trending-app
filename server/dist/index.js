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
const promises_1 = __importDefault(require("fs/promises"));
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
    /**
        * Serves the main index.html file, injecting the theme class based on a cookie.
        * This prevents a "flash of unstyled content" (FOUC) for users with dark mode enabled.
        */
    server.get('/', async (request, reply) => {
        try {
            const theme = request.cookies.theme || 'light';
            const clientIndexPath = path_1.default.resolve(__dirname, '../../client/index.html');
            let indexHtml = await promises_1.default.readFile(clientIndexPath, 'utf-8');
            if (theme === 'dark') {
                indexHtml = indexHtml.replace('<html lang="en">', '<html lang="en" class="dark-theme">');
            }
            reply.type('text/html').send(indexHtml);
        }
        catch (error) {
            server.log.error(error, 'Failed to serve index.html');
            reply.status(500).send({ error: 'Could not load the application.' });
        }
    });
    /**
        * A health check endpoint that responds with an "ok" status.
     */
    server.get('/health', async (request, reply) => {
        return { status: 'ok' };
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
        const { id } = request.query;
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
            switch (preset.source) {
                case 'hackernews':
                    items = await (0, hackernews_1.getHackerNewsStories)(preset.params);
                    break;
                case 'rss':
                    items = await (0, rss_1.getRssFeed)(preset.params);
                    break;
                case 'youtube':
                    items = await (0, youtube_1.getYouTubeVideos)(preset.params);
                    break;
            }
            // --- DEBUG LOG: Confirm number of items sent to the client ---
            console.log(`Sending ${items.length} items for preset: ${preset.name}`);
            /*
            // --- Previous debug log for inspecting the full object ---
            console.log('--- FINAL NORMALIZED ITEMS ---');
            console.log(JSON.stringify(items, null, 2));
            console.log('------------------------------');
            */
            return items;
        }
        catch (error) {
            server.log.error(error);
            reply.status(500).send({ error: `Failed to fetch data for preset: ${preset.name}.` });
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
