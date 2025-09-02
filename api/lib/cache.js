const _cache = new Map();
const _inflight = new Map();
export function getCache(key) {
    const hit = _cache.get(key);
    if (!hit)
        return undefined;
    if (hit.expiresAt < Date.now()) {
        _cache.delete(key);
        return undefined;
    }
    return hit.value;
}
export function setCache(key, value, ttlMs) {
    _cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}
export function getInflight(key) {
    const p = _inflight.get(key);
    return p;
}
export function setInflight(key, p) {
    _inflight.set(key, p);
    p.finally(() => _inflight.delete(key));
}
export function hashKey(obj) {
    try {
        return JSON.stringify(obj);
    }
    catch {
        return String(obj);
    }
}
