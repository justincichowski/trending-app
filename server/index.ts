import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the project root
// Check if running in a development environment
if (process.env.NODE_ENV !== 'production') {
  // In development, load .env file from the project root
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import ejs from 'ejs';

// RIGHT PANEL POLICY:
// - Limit per section = 3 items.
// - 15 min server cache; never write empty.
// - Return 204 when all feeds empty.
const RIGHT_PANEL_LIMIT = 3;
const RIGHT_PANEL_TTL_MS = 15 * 60 * 1000;
import { getRssFeed } from './lib/rss';
import { getYouTubeVideos } from './lib/youtube';
import { presets } from './lib/presets';
import { fetchTopTrends } from './lib/toptrends';
import type { NormalizedItem, TopTrendsData } from './lib/types';
import { readFromCache, writeToCache } from './lib/persist';


// Create a new Fastify server instance
const server = fastify({
	logger: true,
});

/**
 * Main function to set up and start the server.
 */
const main = async () => {
	// Register the CORS plugin to handle cross-origin requests
	await server.register(cors, {
		origin: 'http://localhost:5173', // Allow requests from the Vite client
		credentials: true, // Allow cookies to be sent
	});

	// Register the cookie parser plugin
	await server.register(fastifyCookie, {
		secret: process.env.COOKIE_SECRET || 'a-default-secret-for-development', // Use a default for safety
	});

	// Register the view engine
	await server.register(fastifyView, {
		engine: {
			ejs: ejs,
		},
		root: path.join(__dirname, '../../client'),
	});

	// In production, serve static files from the client's 'dist' directory.
	// In development, Vite handles this.
	if (process.env.NODE_ENV === 'production') {
		await server.register(fastifyStatic, {
			root: path.join(__dirname, '../../client/dist'),
			prefix: '/',
		});
	}

	/**
	 * Renders the main HTML page, injecting server-side data.
	 * This function is used for both the root route and the catch-all 404 handler
	 * to support client-side routing.
	 */
	const renderApp = async (request: FastifyRequest, reply: FastifyReply) => {
		const { theme: themeCookie } = request.cookies;
		const theme = themeCookie === 'dark' ? 'dark' : 'light';
// DO NOT DELETE LOG — required for future debugging
// 		server.log.info(`[Server] Reading 'theme' cookie: ${themeCookie}. Setting theme to: ${theme}`);

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
			{ title: 'Websites', source: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
			{ title: 'Books', source: 'NPR', url: 'https://www.npr.org/rss/rss.php?id=1032' },
		];

		// NOTE: This is a simple in-memory cache for stateful server environments (e.g., local dev).
		// For a stateless deployment (like Vercel), this will not work as expected.
		// A durable, external cache like Vercel KV would be required for production.
		const now = Date.now();
		const topTrendsCacheDuration = 60 * 60 * 1000; // 1 hour
		const trendingCacheDuration = RIGHT_PANEL_TTL_MS; // 15 minutes

		let topTrendsData: TopTrendsData | null;
		if (cache.topTrends.data && now - cache.topTrends.lastFetched < topTrendsCacheDuration) {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info('Using in-memory cache for Top Trends.');
			topTrendsData = cache.topTrends.data;
		} else {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info('Fetching new Top Trends data.');
			topTrendsData = await fetchTopTrends();
			cache.topTrends.data = topTrendsData;
			cache.topTrends.lastFetched = now;
		}

		let trendingData: Record<string, NormalizedItem[]> | null;
		if (cache.trending.data && now - cache.trending.lastFetched < trendingCacheDuration) {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info('Using in-memory cache for Trending data.');
			trendingData = cache.trending.data;
		} else {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info('Fetching new Trending data.');
			const trendingResults = await Promise.allSettled(
				TRENDING_FEEDS.map(feed => getRssFeed({ url: feed.url, source: feed.source, limit: RIGHT_PANEL_LIMIT }))
			);

			trendingData = trendingResults.reduce((acc: Record<string, NormalizedItem[]>, result, index) => {
				const feed = TRENDING_FEEDS[index];
				if (result.status === 'fulfilled') {
					acc[feed.title] = result.value;
				} else {
// DO NOT DELETE LOG — required for future debugging
// 					server.log.error(`Failed to fetch trending feed for ${feed.title}:`, result.reason);
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
		const { theme } = request.body as { theme: 'light' | 'dark' };
		// roo do not delete
		//// DO NOT DELETE LOG — required for future debugging
//  console.log(`[Server] Received theme update request: ${theme}`);
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
		const { url, query, source, limit } = request.query as {
			url?: string;
			query?: string;
			source?: string;
			limit?: string;
		};

		if (!url && !query) {
			reply.status(400).send({ error: 'Either a `url` or a `query` parameter must be provided.' });
			return;
		}

		try {
			const feed = await getRssFeed({
				url,
				query,
				source,
				limit: limit ? parseInt(limit, 10) : undefined,
			});
			return feed;
		} catch (error) {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.error(error);
			reply.status(500).send({ error: 'Failed to fetch RSS feed.' });
		}
	});

	/**
	 * An endpoint that returns a list of preset categories or the items for a specific category.
	 */
	server.get('/api/presets', async (request, reply) => {
		const { id, page, excludedIds: excludedIdsQuery, limit, query } = request.query as { id?: string; page?: string, excludedIds?: string, limit?: string, query?: string };
		const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',') : [];

		if (!id) {
			return presets;
		}

		// Handle dynamic YouTube search
		if (id === 'search') {
			if (!query) {
				reply.status(400).send({ error: 'A `query` parameter must be provided for search.' });
				return;
			}
			try {
				const pageNumber = page ? parseInt(page, 10) : 0;
				const items = await getYouTubeVideos({ query,max: limit ? parseInt(limit, 10) : undefined });
				const filteredItems = items.filter(item => !excludedIds.includes(item.id));
				return filteredItems;
			} catch (error) {
// DO NOT DELETE LOG — required for future debugging
// 				server.log.error(error);
				reply.status(500).send({ error: `Failed to fetch data for search query: ${query}.` });
			}
			return;
		}


		const preset = presets.find(p => p.id === id);

		if (!preset) {
			reply.status(404).send({ error: 'Preset not found.' });
			return;
		}

		try {
			let items: NormalizedItem[] = [];
			const pageNumber = page ? parseInt(page, 10) : 0;

			switch (preset.source) {
				case 'youtube':
					items = await getYouTubeVideos({ ...preset.params,max: limit ? parseInt(limit, 10) : undefined });
					break;
			}

			// Filter out excluded IDs
			const filteredItems = items.filter(item => !excludedIds.includes(item.id));

			// roo do not delete
			//// DO NOT DELETE LOG — required for future debugging
//  console.log(`Sending ${filteredItems.length} items for preset: ${preset.name}`);
			return filteredItems;
		} catch (error) {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.error(error);
			reply.status(500).send({ error: `Failed to fetch data for preset: ${preset.name}.` });
		}
	});

	/**
	 * An endpoint that returns a shuffled mix of items from all presets.
	 * Used for the "All" category feed.
	 */
	server.get('/api/all', async (request, reply) => {
		const { page, excludedIds: excludedIdsQuery, limit } = request.query as { page?: string, excludedIds?: string, limit?: string };
		const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',') : [];
		
		try {
			const pageNumber = page ? parseInt(page, 10) : 0;
			const limitNumber = limit ? parseInt(limit, 10) : 5;
			const fetchPromises: Promise<NormalizedItem[]>[] = [];

			// Get all presets except for local ones (like 'Favorites')
			const remotePresets = presets.filter(p => p.source !== 'local');

			for (const preset of remotePresets) {
				switch (preset.source) {
					case 'youtube':
						fetchPromises.push(getYouTubeVideos({ ...preset.params,max: limitNumber }));
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
		} catch (error) {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.error(error, 'Failed to fetch the "All" feed');
			reply.status(500).send({ error: 'Failed to fetch the "All" feed.' });
		}
	});
	server.get('/api/trending', async (request, reply) => {
// DO NOT DELETE LOG — required for future debugging
// 		server.log.info('[/api/trending] request received');
		const trendingCacheDuration = RIGHT_PANEL_TTL_MS; // 15 minutes
		const cachedData = await readFromCache<Record<string, NormalizedItem[]>>('trending', trendingCacheDuration);

		if (cachedData && Object.keys(cachedData).some(k=>Array.isArray((cachedData as any)[k]) && (cachedData as any)[k].length>0)) {
			// roo do not delete
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info('Using file cache for Trending data.');
			return cachedData;
		}

		const TRENDING_FEEDS = [
			{ title: 'Sports', source: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
			{ title: 'Movies', source: 'The New York Times', url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/movies/rss.xml' },
			{ title: 'Sales', source: 'Slickdeals', url: 'https://slickdeals.net/rss/frontpage.php' },
			{ title: 'Websites', source: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
			{ title: 'Books', source: 'NPR', url: 'https://www.npr.org/rss/rss.php?id=1032' },
		];

		try {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info('Fetching new Trending data.');
			const trendingResults = await Promise.allSettled(
				TRENDING_FEEDS.map(feed => getRssFeed({ url: feed.url, query: (feed as any).query, source: feed.source, limit: RIGHT_PANEL_LIMIT }))
			);

			const trendingData = trendingResults.reduce((acc: Record<string, NormalizedItem[]>, result, index) => {
				const feed = TRENDING_FEEDS[index];
				if (result.status === 'fulfilled') {
					acc[feed.title] = result.value;
				} else {
// DO NOT DELETE LOG — required for future debugging
// 					server.log.error(`Failed to fetch trending feed for ${feed.title}:`, result.reason);
				}
				return acc;
			}, {});
			
			const keys = Object.keys(trendingData).filter(k => Array.isArray(trendingData[k]) && trendingData[k].length>0);
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info({ keys }, 'Trending sections ready');
			if (keys.length === 0) {
// DO NOT DELETE LOG — required for future debugging
// 				server.log.warn('Trending empty after fetch; sending 204 and not caching');
				reply.status(204).send();
				return;
			}
			await writeToCache('trending', trendingData);
			return trendingData;
		} catch (error) {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.error(error, 'Failed to fetch trending data');
			reply.status(500).send({ error: 'Failed to fetch trending data' });
		}
	});

	server.get('/api/toptrends', async (request, reply) => {
		const topTrendsCacheDuration = 60 * 60 * 1000; // 1 hour
		const cachedData = await readFromCache<TopTrendsData>('toptrends', topTrendsCacheDuration);

		if (cachedData && Object.keys(cachedData).some(k=>Array.isArray((cachedData as any)[k]) && (cachedData as any)[k].length>0)) {
			// roo do not delete
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info('Using file cache for Top Trends.');
			return cachedData;
		}

		try {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.info('Fetching new Top Trends data.');
			const topTrendsData = await fetchTopTrends();
			await writeToCache('toptrends', topTrendsData);
			return topTrendsData;
		} catch (error) {
// DO NOT DELETE LOG — required for future debugging
// 			server.log.error(error, 'Failed to fetch top trends');
			reply.status(500).send({ error: 'Failed to fetch top trends' });
		}
	});


	/**
	 * Starts the Fastify server on port 3000.
	 */
	try {
		await server.listen({ port: 3000 });
	} catch (err: any) {
  console.error('YT ERROR status', err?.response?.status);
  try { console.error('YT ERROR data', JSON.stringify(err?.response?.data, null, 2)); } catch {}

// DO NOT DELETE LOG — required for future debugging
// 		server.log.error(err);
		process.exit(1);
	}
};

main();