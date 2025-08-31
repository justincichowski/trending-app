import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import { getHackerNewsStories } from './lib/hackernews';
import { getRssFeed } from './lib/rss';
import { getYouTubeVideos } from './lib/youtube';
import { presets } from './lib/presets';
import type { NormalizedItem } from './lib/types';

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

		const TRENDING_FEEDS = [
			{
				title: 'Sports',
				source: 'ESPN',
				url: 'https://www.espn.com/espn/rss/news',
			},
			{
				title: 'Movies',
				source: 'The New York Times',
				url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/movies/rss.xml',
			},
			{
				title: 'Sales',
				source: 'Slickdeals',
				url: 'https://slickdeals.net/rss/frontpage.php',
			},
			{
				title: 'Websites',
				source: 'TechCrunch',
				url: 'http://feeds.feedburner.com/TechCrunch/',
			},
			{
				title: 'Books',
				source: 'NPR',
				url: 'https://www.npr.org/rss/rss.php?id=1032',
			},
		];

		const fetchPromises = TRENDING_FEEDS.map(feed =>
			getRssFeed({ url: feed.url, source: feed.source, limit: 3 })
		);
		const results = await Promise.allSettled(fetchPromises);
		const trendingData = results.reduce((acc, result, index) => {
			const feed = TRENDING_FEEDS[index];
			if (result.status === 'fulfilled') {
				acc[feed.title] = result.value;
			} else {
				server.log.error(`Failed to fetch trending feed for ${feed.title}:`, result.reason);
			}
			return acc;
		}, {} as Record<string, NormalizedItem[]>);

		return reply.view('index.html', { theme, criticalCss, trendingData: JSON.stringify(trendingData) });
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
		const { theme } = request.body as { theme: 'light' | 'dark' };
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
			const stories = await getHackerNewsStories({ limit: 30 });
			return stories;
		} catch (error) {
			server.log.error(error);
			reply.status(500).send({ error: 'Failed to fetch Hacker News stories.' });
		}
	});

	/**
	 * An endpoint that fetches and normalizes an RSS feed.
	 */
	server.get('/rss', async (request, reply) => {
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
			server.log.error(error);
			reply.status(500).send({ error: 'Failed to fetch RSS feed.' });
		}
	});

	/**
	 * An endpoint that returns a list of preset categories or the items for a specific category.
	 */
	server.get('/presets', async (request, reply) => {
		const { id, page, excludedIds: excludedIdsQuery, limit } = request.query as { id?: string; page?: string, excludedIds?: string, limit?: string };
		const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',') : [];

		if (!id) {
			return presets;
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
				case 'hackernews':
					items = await getHackerNewsStories({ ...preset.params, page: pageNumber, limit: limit ? parseInt(limit, 10) : undefined });
					break;
				case 'rss':
					items = await getRssFeed({ ...preset.params, page: pageNumber, limit: limit ? parseInt(limit, 10) : undefined });
					break;
				case 'youtube':
					items = await getYouTubeVideos({ ...preset.params, page: pageNumber, limit: limit ? parseInt(limit, 10) : undefined });
					break;
			}

			// Filter out excluded IDs
			const filteredItems = items.filter(item => !excludedIds.includes(item.id));

			console.log(`Sending ${filteredItems.length} items for preset: ${preset.name}`);
			return filteredItems;
		} catch (error) {
			server.log.error(error);
			reply.status(500).send({ error: `Failed to fetch data for preset: ${preset.name}.` });
		}
	});

	/**
	 * An endpoint that returns a shuffled mix of items from all presets.
	 * Used for the "All" category feed.
	 */
	server.get('/all', async (request, reply) => {
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
					case 'hackernews':
						fetchPromises.push(getHackerNewsStories({ ...preset.params, page: pageNumber, limit: limitNumber }));
						break;
					case 'rss':
						fetchPromises.push(getRssFeed({ ...preset.params, page: pageNumber, limit: limitNumber }));
						break;
					case 'youtube':
						fetchPromises.push(getYouTubeVideos({ ...preset.params, page: pageNumber, limit: limitNumber }));
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
			server.log.error(error, 'Failed to fetch the "All" feed');
			reply.status(500).send({ error: 'Failed to fetch the "All" feed.' });
		}
	});


	/**
	 * Starts the Fastify server on port 3000.
	 */
	try {
		await server.listen({ port: 3000 });
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};

main();