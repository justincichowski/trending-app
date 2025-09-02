
// Simple in-memory TTL cache with in-flight de-duplication.
// Works on Vercel serverless: per-warm instance, ephemeral, but reduces thrash and cost.
type CacheEntry<T> = { value: T; expiresAt: number };
const _cache = new Map<string, CacheEntry<any>>();
const _inflight = new Map<string, Promise<any>>();

export function getCache<T>(key: string): T | undefined {
  const hit = _cache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) { _cache.delete(key); return undefined; }
  return hit.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  _cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function getInflight<T>(key: string): Promise<T> | undefined {
  const p = _inflight.get(key);
  return p as Promise<T> | undefined;
}

export function setInflight<T>(key: string, p: Promise<T>): void {
  _inflight.set(key, p);
  p.finally(() => _inflight.delete(key));
}

export function hashKey(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}
