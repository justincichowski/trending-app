/**
 * In-memory TTL cache for serverless warm instances.
 * NOTE: This survives only while the function instance is warm,
 * and does not persist across regions/instances.
 */
const store = new Map();
// Guard: never cache empty results
export async function cached(key, ttlMs, fn) {
    const now = Date.now();
    const hit = store.get(key);
    if (hit && hit.expires > now) {
        return hit.value;
    }
    const value = await fn();
    // Only cache if value is "meaningful" (not empty/null)
    const isEmptyObject = value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0;
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    if (value != null && !isEmptyObject && !isEmptyArray) {
        store.set(key, { expires: now + ttlMs, value });
    }
    return value;
}
// Optional: a way to clear for tests
export function _clear() { store.clear(); }
