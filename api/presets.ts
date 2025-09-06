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

/**
	MAINTAINER NOTES — PER-CATEGORY ENDLESS SCROLL (/api/presets)
	--------------------------------------------------------------------
	Purpose
	- Powers center column when a *specific category* is selected.
	- Also returns the *category list* (`GET /api/presets` without `id`).

	Contract:
	- `GET /api/presets` (no id): returns array of presets (cached 60 min).
	- `GET /api/presets?id=<cat>&page&limit&excludedIds` returns one page of items.
	- Client sends `excludedIds` from items already shown to avoid duplicates.

	Paging & Sources:
	- RSS: supports `page` + `limit` natively in getRssFeed().
	- YouTube: uses *overfetch + slice* because the API pages differently.
	  For page N and limit L, we fetch `L * (N + 1)` then slice the last L after filtering.

	Caching:
	- Categories list: s-maxage=3600, stale-while-revalidate=300 (60 min).
	- Category items: s-maxage=300, stale-while-revalidate=60 (5 min).

	Separation of Concerns:
	- This endpoint does NOT fetch left (/api/toptrends) or right (/api/trending) data.
	- Those columns manage their own TTLs (60 min left, 15 min right).

	AI/Reviewer Tip:
	- If you change the default `limit`, confirm client infinite-scroll increments match.
	- Keep the `excludedIds` contract intact to prevent duplicates on scroll.
	--------------------------------------------------------------------
*/

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
		setCache(res, PRESETS_LIST_TTL_S, 300);
		return res.status(200).json(presets);
	}

	const pageNumber = parseIntParam(page, 0, 0, 1_000_000);
	const limitNumber = parseIntParam(limit, PRESET_ITEMS_LIMIT_DEFAULT, 1, MAX_LIMIT);
	const excludedIds = parseExcludedIds(excludedIdsQuery);

	try {
		let items: NormalizedItem[] = [];

		if (id === 'search') {
			if (!query) {
				return res
					.status(400)
					.json({ error: 'A `query` parameter must be provided for search.' });
			}
			const overfetch = limitNumber * (pageNumber + 1);
			const y = await getYouTubeVideos({ query: String(query), limit: overfetch, excludeIds: excludedIds });
			const filtered = y.filter((item) => !excludedIds.includes(item.id));
			const offset = pageNumber * limitNumber;
			setCache(res, PRESETS_ITEMS_TTL_S, SWR_TTL_S);
			const out = filtered.slice(offset, offset + limitNumber);
			setWeakEtag(res, out.map((i) => i.id).filter(Boolean));
			const __payload = out;
			setWeakEtag(res, Array.isArray(__payload) ? out.map((i) => i.id).filter(Boolean) : []);
			return res.status(200).json(__payload);
		}

		const preset = presets.find((p) => p.id === id);
		if (!preset) {
			return res.status(404).json({ error: `Unknown preset id: ${id}` });
		}

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
				const overfetch = limitNumber * (pageNumber + 1);
				const y = await getYouTubeVideos({ ...(preset.params as any), limit: overfetch, excludeIds: excludedIds });
				const filtered = y.filter((item) => !excludedIds.includes(item.id));
				const offset = pageNumber * limitNumber;
				items = filtered.slice(offset, offset + limitNumber);
				break;
			}
			default:
				items = [];
		}

		setCache(res, PRESETS_ITEMS_TTL_S, SWR_TTL_S);
		setWeakEtag(res, items.map((i) => i.id).filter(Boolean));
		const __payload = items;
		setWeakEtag(res, Array.isArray(__payload) ? items.map((i) => i.id).filter(Boolean) : []);
		return res.status(200).json(__payload);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: `Failed to fetch data for preset: ${id}.` });
	}
}
