import type { VercelRequest, VercelResponse } from '@vercel/node';
import { presets as PRESET_CONFIG } from './lib/presets';
import { getRssFeed } from './lib/rss';
import { getYouTubeVideos } from './lib/youtube';
import type { NormalizedItem } from './lib/types';
import { PER_CAT_MAX, ALL_LIMIT_DEFAULT, MAX_LIMIT, ALL_TTL_S, SWR_TTL_S } from './lib/config';
import { parseIntParam, parseExcludedIds, setCache, setWeakEtag } from './lib/utils';

/**
	MAINTAINER NOTES — CENTER COLUMN AGGREGATOR (/api/all)
	--------------------------------------------------------------------
	Purpose
	- This endpoint powers the *center column* "All" feed only.
	- It does *not* fetch the left (/api/toptrends) or right (/api/trending) columns.

	Key Contract (matches original server behavior + quota-friendly):
	- Client requests 15 items at a time (page load and each infinite-scroll step).
	- Server selects a *subset of categories*, fetches up to PER_CAT_MAX (5) from each,
	  shuffles, filters out duplicates via `excludedIds`, and returns exactly `limit`.
	- The subset size is ceil(limit / PER_CAT_MAX). For 15 → 3 categories × 5 each.
	- Category selection is *deterministic per page* (seededShuffle(page)) so the same
	  page is stable and quota usage is predictable.

	Quota Management:
	- By touching only the minimum needed categories per request, we avoid calling all 13
	  presets (which would be 13 × 5 = 65 videos per page) and reduce YouTube API usage.
	- `PER_CAT_MAX` is set to 5. Adjust carefully if product requirements change.
	- YouTube-specific quota/circuit breaker logic lives in api/lib/youtube.ts.

	De-duplication (client ↔ server contract):
	- Client *must* send `excludedIds` (IDs already rendered in the center column).
	- Server filters those IDs out prior to shuffling/slicing.

	Caching:
	- CDN header: s-maxage=300, stale-while-revalidate=60 (5 min).
	- This keeps "All" fresh enough while avoiding excessive API calls.

	Rules of Separation:
	- /api/all: center aggregator only.
	- /api/presets?id=<cat>: per-category pages with endless scroll.
	- /api/toptrends (left): 60 min TTL. /api/trending (right): 15 min TTL.

	Implementation Outline:
	1) Build non-local category list and seeded-shuffle by `page`.
	2) Pick as many categories as needed to hit `limit` with PER_CAT_MAX each.
	3) Fetch, filter `excludedIds`, then if still short, pull more categories.
	4) Seeded-shuffle again for variety, slice to `limit`, return.

	AI/Reviewer Tip:
	- If changing PER_CAT_MAX or `limit`, reconsider how many categories are needed,
	  and re-check quota/latency tradeoffs. Keep the seeded logic stable per page.
	--------------------------------------------------------------------
*/

function seededShuffle<T>(arr: T[], seed: number): T[] {
	// Simple LCG-based shuffle seed
	let a = 1664525;
	let c = 1013904223;
	let m = 2 ** 32;
	let state = seed >>> 0 || 1;
	const clone = arr.slice();
	for (let i = clone.length - 1; i > 0; i--) {
		state = (a * state + c) % m;
		const r = state / m;
		const j = Math.floor(r * (i + 1));
		[clone[i], clone[j]] = [clone[j], clone[i]];
	}
	return clone;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// Enable CORS
	res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins (adjust as needed)
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	const {
		id,
		page,
		limit,
		excludedIds: excludedIdsQuery,
	} = req.query as {
		id?: string;
		page?: string;
		limit?: string;
		excludedIds?: string;
	};

	// Enforce original contract: /api/all is aggregator only (no id)
	if (id) {
		return res
			.status(400)
			.json({ error: 'Use /api/presets?id=<category> for per-category items.' });
	}

	const limitNumber = parseIntParam(limit, ALL_LIMIT_DEFAULT, 1, MAX_LIMIT);
	const pageNumber = parseIntParam(page, 0, 0, 1_000_000);
	const excludedIds = parseExcludedIds(excludedIdsQuery);

	setCache(res, ALL_TTL_S, SWR_TTL_S);

	// Build candidate category list (non-local only), shuffled deterministically by page
	const candidates = PRESET_CONFIG.filter((p) => p.source === 'rss' || p.source === 'youtube');
	const ordered = seededShuffle(candidates, pageNumber + 1); // +1 to avoid seed=0 bias

	// How many categories do we need to touch for this limit?
	const needCategories = Math.max(1, Math.ceil(limitNumber / PER_CAT_MAX));

	const usedIndexes = new Set<number>();
	let collected: NormalizedItem[] = [];

	async function fetchFromPreset(idx: number): Promise<void> {
		const p = ordered[idx];
		if (!p) return;
		usedIndexes.add(idx);
		if (p.source === 'rss') {
			const items = await getRssFeed({
				...(p.params as any),
				source: p.name,
				limit: PER_CAT_MAX,
				page: 0,
			});
			collected.push(...items);
		} else if (p.source === 'youtube') {
			// Fetch up to PER_CAT_MAX, avoid heavy overfetch; rely on excludedIds to remove dups
			const items = await getYouTubeVideos({ ...(p.params as any), max: PER_CAT_MAX });
			collected.push(...items);
		}
	}

	try {
		// Step 1: sample the minimum number of categories needed
		for (let i = 0; i < ordered.length && usedIndexes.size < needCategories; i++) {
			await fetchFromPreset(i);
		}

		// Step 2: filter duplicates and already-seen items
		let filtered = collected.filter((item) => !excludedIds.includes(item.id));

		// Step 3: if we still don't have enough to satisfy limit, keep pulling from remaining categories
		for (let i = usedIndexes.size; filtered.length < limitNumber && i < ordered.length; i++) {
			if (usedIndexes.has(i)) continue;
			await fetchFromPreset(i);
			filtered = collected.filter((item) => !excludedIds.includes(item.id));
		}

		// Step 4: shuffle and slice to the requested page size
		const shuffled = seededShuffle(filtered, pageNumber + 12345);
		const result = shuffled.slice(0, limitNumber);

		setWeakEtag(res, result.map((i) => i.id).filter(Boolean));
		const __payload = result;
		setWeakEtag(res, Array.isArray(__payload) ? result.map((i) => i.id).filter(Boolean) : []);
		return res.status(200).json(__payload);
	} catch (err: any) {
		console.error('[API /all] error', err);
		return res.status(500).json({ error: 'Failed to fetch items' });
	}
}
