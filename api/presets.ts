import type { VercelRequest, VercelResponse } from '@vercel/node';
import { presets } from './lib/presets';
import { getRssFeed } from './lib/rss';
import { getYouTubeVideos } from './lib/youtube';
import type { NormalizedItem } from './lib/types';
import {
	PRESET_ITEMS_LIMIT_DEFAULT,
	MAX_LIMIT,
	PRESETS_ITEMS_TTL_S,
	PRESETS_LIST_TTL_S,
	SWR_TTL_S,
} from './lib/config';
import { parseIntParam, parseExcludedIds, setCache, setWeakEtag } from './lib/utils';

function randomShuffle<T>(arr: T[]): T[] {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	console.log('API called with method:', req.method); // Log request method

	const {
		id,
		page,
		limit,
		excludedIds: excludedIdsQuery,
		query,
	} = req.query as {
		id?: string;
		page?: string;
		limit?: string;
		excludedIds?: string;
		query?: string;
	};

	// Categories list
	if (!id) {
		setCache(res, PRESETS_LIST_TTL_S, SWR_TTL_S);
		return res.status(200).json(presets);
	}

	const pageNumber = parseIntParam(page, 0, 0, 1_000_000);
	const limitNumber = parseIntParam(limit, PRESET_ITEMS_LIMIT_DEFAULT, 1, MAX_LIMIT);
	const excludedIds = parseExcludedIds(excludedIdsQuery);

	try {
		let items: NormalizedItem[] = [];

		if (id === 'search') {
			if (!query) {
				return res.status(400).json({ error: 'A `query` parameter must be provided for search.' });
			}

			const EXTRA = Math.min(20, Math.max(5, Math.ceil(limitNumber * 0.5)));
			const dynamicExclude = new Set<string>(excludedIds);
			const pool: NormalizedItem[] = [];

			// attempt #1
			const first = await getYouTubeVideos({
				query: String(query),
				limit: Math.min(50, limitNumber + EXTRA),
				excludeIds: Array.from(dynamicExclude),
			}).catch(() => [] as NormalizedItem[]);

			for (const it of first) {
				if (!it?.id || dynamicExclude.has(it.id)) continue;
				dynamicExclude.add(it.id);
				pool.push(it);
				if (pool.length >= limitNumber) break;
			}

			// top-up once if still short
			if (pool.length < limitNumber) {
				const second = await getYouTubeVideos({
				query: String(query),
				limit: Math.min(50, limitNumber + EXTRA * 2),
				excludeIds: Array.from(dynamicExclude),
				}).catch(() => [] as NormalizedItem[]);

				for (const it of second) {
				if (!it?.id || dynamicExclude.has(it.id)) continue;
				dynamicExclude.add(it.id);
				pool.push(it);
				if (pool.length >= limitNumber) break;
				}
			}

			setCache(res, PRESETS_ITEMS_TTL_S, SWR_TTL_S);
			setWeakEtag(res, pool.map((i) => i.id).filter(Boolean));
			return res.status(200).json(pool.slice(0, limitNumber));
			}


		const preset = presets.find((p) => p.id === id);
		if (!preset) {
			return res.status(404).json({ error: `Unknown preset id: ${id}` });
		}

		console.log('pageNumber', pageNumber);
		console.log('limit', limitNumber);

		switch (preset.source) {
			case 'rss': {
				items = await getRssFeed({
					...(preset.params as any),
					source: preset.name,
					limit: limitNumber,
					page: pageNumber,
				});
				items = items.filter((item) => !excludedIds.includes(item.id));
				break;
			}
			case 'youtube': {
				// Parse the category’s playlist list
				const allIds = String((preset.params as any).playlistId || '')
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean);

				if (allIds.length === 0) {
					items = [];
					break;
				}

				// Shuffle playlists each request for variety
				const shuffled = randomShuffle(allIds);

				// Pull from several playlists to reach the page size
				const PER_PLAYLIST = Math.min(4, Math.max(1, limitNumber)); // same cap as elsewhere
				const BUFFER_LISTS = 1;
				const neededLists = Math.min(
					shuffled.length,
					Math.ceil(limitNumber / PER_PLAYLIST) + BUFFER_LISTS,
				);

				const dynamicExclude = new Set<string>(excludedIds);
				const out: NormalizedItem[] = [];

				for (let i = 0; i < shuffled.length && out.length < limitNumber; i++) {
					const pid = shuffled[i];

					const batch = await getYouTubeVideos({
						// pass a single playlistId so youtube.ts won’t re-shuffle the set internally
						playlistId: pid,
						// page can still be forwarded; with a single PID it just rotates within that list
						page: Math.max(0, pageNumber),
						// categories should stay random across PIDs, but stable within the picked PID
						sticky: true,
						limit: PER_PLAYLIST,
						excludeIds: Array.from(dynamicExclude),
					}).catch(() => [] as NormalizedItem[]);

					for (const it of batch) {
						if (!it?.id || dynamicExclude.has(it.id)) continue;
						dynamicExclude.add(it.id);
						out.push(it);
						if (out.length >= limitNumber) break;
					}
				}

				items = out.slice(0, limitNumber);
				break;
			}

			default:
				items = [];
		}

		setCache(res, PRESETS_ITEMS_TTL_S, SWR_TTL_S);
		setWeakEtag(res, items.map((i) => i.id).filter(Boolean));
		return res.status(200).json(items);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: `Failed to fetch data for preset: ${id}.` });
	}
}
