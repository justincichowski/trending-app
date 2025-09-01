
/**
 * In-memory TTL cache for serverless warm instances.
 * NOTE: This survives only while the function instance is warm,
 * and does not persist across regions/instances.
 */
const store = new Map<string, { expires: number; value: any }>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) {
    return hit.value as T;
  }
  const value = await fn();
  store.set(key, { expires: now + ttlMs, value });
  return value;
}

// Optional: a way to clear for tests
export function _clear() { store.clear(); }
