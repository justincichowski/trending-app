/**
 * persist.ts
 * In-memory TTL + optional Vercel KV persistence + in-flight de-dupe.
 */
type CacheEntry<T> = { value: T; expiresAt: number };
const mem = new Map<string, CacheEntry<any>>();
const inflight = new Map<string, Promise<any>>();

const KV_URL = process.env.KV_REST_API_URL || process.env.VERCEL_KV_REST_API_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.VERCEL_KV_REST_API_TOKEN || '';

function now() {
	return Date.now();
}

export function readFromMemory<T>(key: string): T | undefined {
	const hit = mem.get(key);
	if (!hit) return undefined;
	if (hit.expiresAt < now()) {
		mem.delete(key);
		return undefined;
	}
	return hit.value as T;
}

export function writeToMemory<T>(key: string, value: T, ttlMs: number): void {
	mem.set(key, { value, expiresAt: now() + ttlMs });
}

async function kvGetRaw(key: string): Promise<string | null> {
	if (!KV_URL || !KV_TOKEN) return null;
	try {
		const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
			headers: { Authorization: `Bearer ${KV_TOKEN}` },
			cache: 'no-store',
		});
		if (!res.ok) return null;
		const data = await res.json().catch(() => ({}) as any);
		return typeof data?.result === 'string' ? data.result : null;
	} catch {
		return null;
	}
}

async function kvSetRaw(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
	if (!KV_URL || !KV_TOKEN) return false;
	try {
		const url = ttlSeconds
			? `${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttlSeconds}`
			: `${KV_URL}/set/${encodeURIComponent(key)}`;
		const res = await fetch(url, {
			method: 'POST',
			headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
			body: value,
		});
		return res.ok;
	} catch {
		return false;
	}
}

export async function readFromCache<T>(key: string, ttlMs = 5 * 60 * 1000): Promise<T | undefined> {
	// 1) memory
	const m = readFromMemory<T>(key);
	if (m !== undefined) return m;
	// 2) kv
	const raw = await kvGetRaw(key);
	if (raw) {
		try {
			const parsed = JSON.parse(raw) as CacheEntry<T>;
			if (parsed.expiresAt && parsed.expiresAt > now()) {
				writeToMemory(key, parsed.value, parsed.expiresAt - now());
				return parsed.value;
			}
		} catch {}
	}
	return undefined;
}

export async function writeToCache<T>(key: string, value: T, ttlMs = 5 * 60 * 1000): Promise<void> {
	writeToMemory<T>(key, value, ttlMs);
	const payload: CacheEntry<T> = { value, expiresAt: now() + ttlMs };
	try {
		await kvSetRaw(key, JSON.stringify(payload), Math.ceil(ttlMs / 1000));
	} catch {}
}

export function getInflight<T>(key: string): Promise<T> | undefined {
	return inflight.get(key) as Promise<T> | undefined;
}
export function setInflight<T>(key: string, p: Promise<T>): void {
	inflight.set(key, p);
	p.finally(() => inflight.delete(key));
}

export function hashKey(obj: any): string {
	try {
		return JSON.stringify(obj);
	} catch {
		return String(obj);
	}
}

// compat shims
export function getCache<T>(key: string): T | undefined {
	return readFromMemory<T>(key);
}
export function setCache<T>(key: string, value: T, ttlMs: number): void {
	writeToMemory<T>(key, value, ttlMs);
}

// High-level cached helper (matches previous `cached(key, ttl, fetcher)` shape)
export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
	// mem/kv
	const existing = await readFromCache<T>(key, ttlMs);
	if (existing !== undefined) return existing;

	// de-dupe
	const inFlight = getInflight<T>(key);
	if (inFlight) return inFlight;

	const p = (async () => {
		const value = await fetcher();
		await writeToCache<T>(key, value, ttlMs);
		return value;
	})();
	setInflight<T>(key, p);
	return p;
}
 