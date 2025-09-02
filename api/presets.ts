import type { VercelRequest, VercelResponse } from '@vercel/node';
import { presets } from './lib/presets';
import { getRssFeed } from './lib/rss';
import { getYouTubeVideos } from './lib/youtube';
import type { NormalizedItem } from './lib/types';

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

 * /api/presets — category list and per-category items (center column)
 *
 * - NO id: return the list of categories (cached 60m)
 * - WITH id: return items for that category (supports endless scroll via page+limit+excludedIds)
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
	const {
		id,
		page,
		limit,
		excludedIds: excludedIdsQuery,
		query,
	} = request.query as {
		id?: string;
		page?: string;
		limit?: string;
		excludedIds?: string;
		query?: string;
	};

	// Categories list
	if (!id) {
		response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300'); // 60m
		return response.status(200).json(presets);
	}

	const pageNumber = page ? parseInt(page, 10) : 0;
	const limitNumber = limit ? parseInt(limit, 10) : 15;
	const excludedIds = excludedIdsQuery ? excludedIdsQuery.split(',').filter(Boolean) : [];

	try {
		let items: NormalizedItem[] = [];

		if (id === 'search') {
			if (!query) {
				return response
					.status(400)
					.json({ error: 'A `query` parameter must be provided for search.' });
			}
			const overfetch = limitNumber * (pageNumber + 1);
			const y = await getYouTubeVideos({ query: String(query), max: overfetch });
			const filtered = y.filter((item) => !excludedIds.includes(item.id));
			const offset = pageNumber * limitNumber;
			response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60'); // 5m
			return response.status(200).json(filtered.slice(offset, offset + limitNumber));
		}

		const preset = presets.find((p) => p.id === id);
		if (!preset) {
			return response.status(404).json({ error: `Unknown preset id: ${id}` });
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
				const y = await getYouTubeVideos({ ...(preset.params as any), max: overfetch });
				const filtered = y.filter((item) => !excludedIds.includes(item.id));
				const offset = pageNumber * limitNumber;
				items = filtered.slice(offset, offset + limitNumber);
				break;
			}
			default:
				items = [];
		}

		response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60'); // 5m
		return response.status(200).json(items);
	} catch (error) {
		console.error(error);
		return response.status(500).json({ error: `Failed to fetch data for preset: ${id}.` });
	}
}
