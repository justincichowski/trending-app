import type { VercelResponse } from '@vercel/node';

/** parse a numeric query param with defaults and bounds */
export function parseIntParam(v: unknown, def: number, min: number, max: number): number {
	const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
	if (!Number.isFinite(n)) return def;
	return Math.min(max, Math.max(min, n));
}

/** normalize excludedIds CSV → unique trimmed array */
export function parseExcludedIds(csv?: string): string[] {
	if (!csv) return [];
	const set = new Set<string>();
	csv.split(',').forEach((s) => {
		const id = s.trim();
		if (id) set.add(id);
	});
	return [...set];
}

/** set Cache-Control header for CDN caching */
export function setCache(res: VercelResponse, sMaxage: number, swr: number): void {
	res.setHeader('Cache-Control', `s-maxage=${sMaxage}, stale-while-revalidate=${swr}`);
}

/** attach a weak ETag based on returned item ids */
export function setWeakEtag(res: VercelResponse, ids: string[]): void {
	const str = ids.join(',');
	let hash = 0;
	for (let i = 0; i < str.length; i++) hash = (hash + str.charCodeAt(i)) >>> 0;
	res.setHeader('ETag', `W/\"${hash.toString(16)}-${ids.length}\"`);
}
