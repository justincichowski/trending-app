import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getYouTubeVideos } from './lib/youtube';
import type { NormalizedItem } from './lib/types';
import { presets } from './lib/presets';

export default async function handler(req: VercelRequest, res: VercelResponse) {

	const { page, excludedIds: excludedIdsQuery, limit } = req.query as { page?: string, excludedIds?: string, limit?: string };
	const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',') : [];
		
	try {
		const pageNumber = page ? parseInt(page, 10) : 0;
		const limitNumber = limit ? parseInt(limit, 10) : 5;
		const fetchPromises: Promise<NormalizedItem[]>[] = [];

		// Get all presets except for local ones (like 'Favorites')
		const remotePresets = presets.filter(p => p.source !== 'local');

		console.log('limitNumber', limitNumber)

		for (const preset of remotePresets) {
			switch (preset.source) {
				case 'youtube':
					// fetchPromises.push(getYouTubeVideos({ ...preset.params, page: pageNumber, limit: limitNumber }));
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

		return res.status(200).json(filteredItems);

	} catch (error) {
		console.log(error, 'Failed to fetch the "All" feed');
		res.status(500).send({ error: 'Failed to fetch the "All" feed.' });
	}
}
