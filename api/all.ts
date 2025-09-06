import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getYouTubeVideos } from './lib/youtube';
import type { NormalizedItem } from './lib/types';
import { presets } from './lib/presets';

function randomShuffle<T>(arr: T[]): T[] {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	const {
		page,
		excludedIds: excludedIdsQuery,
		limit,
	} = req.query as { page?: string; excludedIds?: string; limit?: string };
	const excludedIds = excludedIdsQuery
		? excludedIdsQuery
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		: [];

	try {
		const pageNumber = Math.max(0, Number.isFinite(Number(page)) ? parseInt(page!, 10) : 0);
		const rawLimit = Number.isFinite(Number(limit)) ? parseInt(limit!, 10) : 15;
		const limitNumber = Math.min(50, Math.max(1, rawLimit)); // cap 1..50

		const PER_PRESET_LIMIT = 5; // hard cap you wanted
		const perPresetLimiter = Math.min(PER_PRESET_LIMIT, Math.max(1, limitNumber));
		const fetchPromises: Promise<NormalizedItem[]>[] = [];

		// Get all presets except for local ones (like 'Favorites')
		const remotePresets = presets.filter((p) => p.source !== 'local');

		if (remotePresets.length === 0) {
			return res.status(200).json([]); // nothing to fetch
		}

		// How many presets do we need to reach the page limit?
		const BUFFER_PRESETS = 2; // small hedge for dupes/exclusions
		const neededPresets = Math.min(
			remotePresets.length,
			Math.ceil(limitNumber / perPresetLimiter) + BUFFER_PRESETS,
		);

		// Shuffle all categories based on mode (affects WHAT we fetch)
		const shuffledPresets = randomShuffle(remotePresets);

		const selectedPresets: typeof remotePresets = shuffledPresets.slice(0, neededPresets);

		// console.log('limitNumber (page size):', limitNumber, 'perPresetLimiter:', perPresetLimiter);

		for (const preset of selectedPresets) {
			switch (preset.source) {
				case 'youtube':
					fetchPromises.push(
						getYouTubeVideos({
							...(preset.params as any),
							page: pageNumber,
							limit: perPresetLimiter,
							excludeIds: excludedIds,
						}),
					);
					break;
			}
		}

		const allItemsSettled = await Promise.allSettled(fetchPromises);
		let allItems = allItemsSettled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

		// Exclude and dedupe by id
		const seen = new Set<string>(excludedIds);
		const filteredItems: NormalizedItem[] = [];
		for (const item of allItems) {
			if (!item?.id) continue;
			if (seen.has(item.id)) continue;
			seen.add(item.id);
			filteredItems.push(item);
		}

		// exit early
		if (filteredItems.length >= limitNumber) {
			const result = filteredItems.slice(0, limitNumber);
			return res.status(200).json(result);
		}

		// If we’re short after exclusions/dupes, “top up” from the next presets
		if (filteredItems.length < limitNumber && neededPresets < remotePresets.length) {
			const remaining = limitNumber - filteredItems.length;
			const extraPresetsCount = Math.min(
				remotePresets.length - neededPresets,
				Math.ceil(remaining / perPresetLimiter),
			);

			if (extraPresetsCount > 0) {
				const extraPresets = shuffledPresets.slice(
					neededPresets,
					neededPresets + extraPresetsCount,
				);

				const dynamicExclude = new Set<string>([
					...excludedIds,
					...filteredItems.map((i) => i.id),
				]);

				const extraSettled = await Promise.allSettled(
					extraPresets.map((p) =>
						p.source === 'youtube'
							? getYouTubeVideos({
									...(p.params as any),
									page: pageNumber,
									limit: perPresetLimiter,
									excludeIds: Array.from(dynamicExclude),
								})
							: Promise.resolve<NormalizedItem[]>([]),
					),
				);

				for (const r of extraSettled) {
					if (r.status !== 'fulfilled') continue;
					for (const item of r.value) {
						if (!item?.id) continue;
						if (dynamicExclude.has(item.id)) continue;
						dynamicExclude.add(item.id);
						filteredItems.push(item);
						if (filteredItems.length >= limitNumber) break;
					}
					if (filteredItems.length >= limitNumber) break;
				}
			}
		}

		const orderedItems = filteredItems;

		// Return exactly `limitNumber` items
		const result = orderedItems.slice(0, limitNumber);
		return res.status(200).json(result);
	} catch (error) {
		console.log(error, 'Failed to fetch the "All" feed');
		res.status(500).send({ error: 'Failed to fetch the "All" feed.' });
	}
}
