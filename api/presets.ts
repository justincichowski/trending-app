import type { VercelRequest, VercelResponse } from '@vercel/node';
import { presets } from './lib/presets';
import { getRssFeed } from './lib/rss';
import { getYouTubeVideos } from './lib/youtube';
import type { NormalizedItem } from './lib/types';

/**
 * An API endpoint that returns a list of preset categories or the items for a specific category.
 *
 * @param {VercelRequest} request - The incoming request object.
 * @param {VercelResponse} response - The outgoing response object.
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
	const { id } = request.query;

	// If no ID is provided, return the list of all presets
	if (!id) {
		response.status(200).json(presets);
		return;
	}

	// Find the preset with the matching ID
	const preset = presets.find(p => p.id === id);
	if (!preset) {
		response.status(404).json({ error: 'Preset not found.' });
		return;
	}

	try {
		// Set caching headers
		response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

		let items: NormalizedItem[] = [];
		switch (preset.source) {
			case 'rss':
				items = await getRssFeed(preset.params);
				break;
			case 'youtube':
				items = await getYouTubeVideos({ ...(preset.params as any), max: 15 });
				break;
		}

		response.status(200).json(items);
	} catch (error) {
		// Handle any errors that occur during the fetch
		console.error(error);
		response.status(500).json({
			error: `Failed to fetch data for preset: ${preset.name}.`,
		});
	}
}