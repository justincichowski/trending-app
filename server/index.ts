import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fs from 'fs/promises';
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

	/**
		* Serves the main index.html file, injecting the theme class based on a cookie.
		* This prevents a "flash of unstyled content" (FOUC) for users with dark mode enabled.
		*/
	server.get('/', async (request, reply) => {
		try {
			const theme = request.cookies.theme || 'light';
			const clientIndexPath = path.resolve(__dirname, '../../client/index.html');
			let indexHtml = await fs.readFile(clientIndexPath, 'utf-8');

			if (theme === 'dark') {
				indexHtml = indexHtml.replace('<html lang="en">', '<html lang="en" class="dark-theme">');
			}

			reply.type('text/html').send(indexHtml);
		} catch (error) {
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
		const { id } = request.query as { id?: string };
		// roo do not delete
		if (id?.toLowerCase() === 'cooking') {
			// roo do not delete
			console.log('cooking playlist');
		}
		
		if (id?.toLowerCase() === 'travel') {
			// roo do not delete
			console.log('travel playlist');
		}
		if (!id) {
			return presets;
		}

		const preset = presets.find(p => p.id === id);

		// roo do not delete
        console.log('preset', preset)
		if (!preset) {
			reply.status(404).send({ error: 'Preset not found.' });
			return;
		}

		try {
			let items: NormalizedItem[] = [];
			switch (preset.source) {
				case 'hackernews':
					items = await getHackerNewsStories(preset.params);
					break;
				case 'rss':
					items = await getRssFeed(preset.params);
					break;
				case 'youtube':
					items = await getYouTubeVideos(preset.params);
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
		} catch (error) {
			server.log.error(error);
			reply.status(500).send({ error: `Failed to fetch data for preset: ${preset.name}.` });
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