"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file in the project root
// Check if running in a development environment
if (process.env.NODE_ENV !== 'production') {
    // In development, load .env file from the project root
    dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
}
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const static_1 = __importDefault(require("@fastify/static"));
const view_1 = __importDefault(require("@fastify/view"));
const ejs_1 = __importDefault(require("ejs"));
const rss_1 = require("./lib/rss");
const youtube_1 = require("./lib/youtube");
const presets_1 = require("./lib/presets");
const toptrends_1 = require("./lib/toptrends");
const cache_1 = require("./lib/cache");
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
     * Renders the main HTML page, injecting server-side data.
     * This function is used for both the root route and the catch-all 404 handler
     * to support client-side routing.
     */
    const renderApp = async (request, reply) => {
        const { theme: themeCookie } = request.cookies;
        const theme = themeCookie === 'dark' ? 'dark' : 'light';
        server.log.info(`[Server] Reading 'theme' cookie: ${themeCookie}. Setting theme to: ${theme}`);
        /*
        // Define critical CSS variables for both themes to prevent FOUC.
        const criticalCss = `
            <style>
                :root { --background-color: #ffffff; --text-color: #333333; }
                html.dark-theme { --background-color: #121212; --text-color: #ffffff; }
            </style>
        `;

        const TRENDING_FEEDS = [
            { title: 'Sports', source: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
            { title: 'Movies', source: 'The New York Times', url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/movies/rss.xml' },
            { title: 'Sales', source: 'Slickdeals', url: 'https://slickdeals.net/rss/frontpage.php' },
            { title: 'Websites', source: 'TechCrunch', url: 'http://feeds.feedburner.com/TechCrunch/' },
            { title: 'Books', source: 'NPR', url: 'https://www.npr.org/rss/rss.php?id=1032' },
        ];

        // NOTE: This is a simple in-memory cache for stateful server environments (e.g., local dev).
        // For a stateless deployment (like Vercel), this will not work as expected.
        // A durable, external cache like Vercel KV would be required for production.
        const now = Date.now();
        const topTrendsCacheDuration = 60 * 60 * 1000; // 1 hour
        const trendingCacheDuration = 15 * 60 * 1000; // 15 minutes

        let topTrendsData: TopTrendsData | null;
        if (cache.topTrends.data && now - cache.topTrends.lastFetched < topTrendsCacheDuration) {
            server.log.info('Using in-memory cache for Top Trends.');
            topTrendsData = cache.topTrends.data;
        } else {
            server.log.info('Fetching new Top Trends data.');
            topTrendsData = await fetchTopTrends();
            cache.topTrends.data = topTrendsData;
            cache.topTrends.lastFetched = now;
        }

        let trendingData: Record<string, NormalizedItem[]> | null;
        if (cache.trending.data && now - cache.trending.lastFetched < trendingCacheDuration) {
            server.log.info('Using in-memory cache for Trending data.');
            trendingData = cache.trending.data;
        } else {
            server.log.info('Fetching new Trending data.');
            const trendingResults = await Promise.allSettled(
                TRENDING_FEEDS.map(feed => getRssFeed({ url: feed.url, source: feed.source, limit: 3 }))
            );

            trendingData = trendingResults.reduce((acc: Record<string, NormalizedItem[]>, result, index) => {
                const feed = TRENDING_FEEDS[index];
                if (result.status === 'fulfilled') {
                    acc[feed.title] = result.value;
                } else {
                    server.log.error(`Failed to fetch trending feed for ${feed.title}:`, result.reason);
                }
                return acc;
            }, {});
            cache.trending.data = trendingData;
            cache.trending.lastFetched = now;
        }
        */
        return reply.view('index.html', {});
    };
    // Use the renderApp function for both the root and catch-all routes
    server.get('/', renderApp);
    server.setNotFoundHandler(renderApp);
    /**
        * A health check endpoint that responds with an "ok" status.
     */
    server.get('/api/health', async (request, reply) => {
        return { status: 'ok' };
    });
    /**
     * An endpoint to set the theme cookie.
     */
    server.post('/api/v1/theme', async (request, reply) => {
        const { theme } = request.body;
        // roo do not delete
        // console.log(`[Server] Received theme update request: ${theme}`);
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
     * An endpoint that fetches and normalizes an RSS feed.
     */
    server.get('/api/rss', async (request, reply) => {
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
    server.get('/api/presets', async (request, reply) => {
        const { id, page, excludedIds: excludedIdsQuery, limit, query } = request.query;
        const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',') : [];
        if (!id) {
            return presets_1.presets;
        }
        // Handle dynamic YouTube search
        if (id === 'search') {
            if (!query) {
                reply.status(400).send({ error: 'A `query` parameter must be provided for search.' });
                return;
            }
            try {
                const pageNumber = page ? parseInt(page, 10) : 0;
                const items = await (0, youtube_1.getYouTubeVideos)({ query, page: pageNumber, limit: limit ? parseInt(limit, 10) : undefined });
                const filteredItems = items.filter(item => !excludedIds.includes(item.id));
                return filteredItems;
            }
            catch (error) {
                server.log.error(error);
                reply.status(500).send({ error: `Failed to fetch data for search query: ${query}.` });
            }
            return;
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
                case 'youtube':
                    items = await (0, youtube_1.getYouTubeVideos)({ ...preset.params, page: pageNumber, limit: limit ? parseInt(limit, 10) : undefined });
                    break;
            }
            // Filter out excluded IDs
            const filteredItems = items.filter(item => !excludedIds.includes(item.id));
            // roo do not delete
            // console.log(`Sending ${filteredItems.length} items for preset: ${preset.name}`);
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
    server.get('/api/all', async (request, reply) => {
        const { page, excludedIds: excludedIdsQuery, limit } = request.query;
        const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',') : [];
        try {
            const pageNumber = page ? parseInt(page, 10) : 0;
            const limitNumber = limit ? parseInt(limit, 10) : 5;
            const fetchPromises = [];
            // Get all presets except for local ones (like 'Favorites')
            const remotePresets = presets_1.presets.filter(p => p.source !== 'local');
            for (const preset of remotePresets) {
                switch (preset.source) {
                    case 'youtube':
                        fetchPromises.push((0, youtube_1.getYouTubeVideos)({ ...preset.params, page: pageNumber, limit: limitNumber }));
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
    server.get('/api/trending', async (request, reply) => {
        const trendingCacheDuration = 15 * 60 * 1000; // 15 minutes
        const cachedData = await (0, cache_1.readFromCache)('trending', trendingCacheDuration);
        if (cachedData) {
            // roo do not delete
            server.log.info('Using file cache for Trending data.');
            return cachedData;
        }
        const TRENDING_FEEDS = [
            { title: 'Sports', source: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
            { title: 'Movies', source: 'The New York Times', url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/movies/rss.xml' },
            { title: 'Sales', source: 'Google News', query: 'product deals' },
            { title: 'Websites', source: 'TechCrunch', url: 'http://feeds.feedburner.com/TechCrunch/' },
            { title: 'Books', source: 'NPR', url: 'https://www.npr.org/rss/rss.php?id=1032' },
        ];
        try {
            server.log.info('Fetching new Trending data.');
            const trendingResults = await Promise.allSettled(TRENDING_FEEDS.map(feed => (0, rss_1.getRssFeed)({ url: feed.url, query: feed.query, source: feed.source, limit: 3 })));
            const trendingData = trendingResults.reduce((acc, result, index) => {
                const feed = TRENDING_FEEDS[index];
                if (result.status === 'fulfilled') {
                    acc[feed.title] = result.value;
                }
                else {
                    server.log.error(`Failed to fetch trending feed for ${feed.title}:`, result.reason);
                }
                return acc;
            }, {});
            await (0, cache_1.writeToCache)('trending', trendingData);
            return trendingData;
        }
        catch (error) {
            server.log.error(error, 'Failed to fetch trending data');
            reply.status(500).send({ error: 'Failed to fetch trending data' });
        }
    });
    server.get('/api/toptrends', async (request, reply) => {
        const topTrendsCacheDuration = 60 * 60 * 1000; // 1 hour
        const cachedData = await (0, cache_1.readFromCache)('toptrends', topTrendsCacheDuration);
        if (cachedData) {
            // roo do not delete
            server.log.info('Using file cache for Top Trends.');
            return cachedData;
        }
        try {
            server.log.info('Fetching new Top Trends data.');
            const topTrendsData = await (0, toptrends_1.fetchTopTrends)();
            await (0, cache_1.writeToCache)('toptrends', topTrendsData);
            return topTrendsData;
        }
        catch (error) {
            server.log.error(error, 'Failed to fetch top trends');
            reply.status(500).send({ error: 'Failed to fetch top trends' });
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
