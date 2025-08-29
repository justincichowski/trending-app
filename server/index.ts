import fastify from 'fastify';
import cors from '@fastify/cors';
import { getHackerNewsStories } from '../api/lib/hackernews';
import { getRssFeed } from '../api/lib/rss';
import { getYouTubeVideos } from '../api/lib/youtube';
import { presets } from '../api/lib/presets';
import type { NormalizedItem } from '../api/lib/types';

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
	});

	/**
	 * A simple route that returns a "Hello, World!" message.
	 * This mirrors the Vercel serverless function.
	 */
	server.get('/api', async (request, reply) => {
		return { message: 'Hello, World!' };
	});

	/**
	 * A health check endpoint that responds with an "ok" status.
	 */
	server.get('/api/health', async (request, reply) => {
		return { status: 'ok' };
	});

	/**
	 * An endpoint that returns the top Hacker News stories.
	 */
	server.get('/api/hackernews', async (request, reply) => {
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
			server.log.error(error);
			reply.status(500).send({ error: 'Failed to fetch RSS feed.' });
		}
	});

	/**
	 * An endpoint that returns a list of preset categories or the items for a specific category.
	 */
	server.get('/api/presets', async (request, reply) => {
		const { id } = request.query as { id?: string };

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