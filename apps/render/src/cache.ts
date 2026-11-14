// In-memory LRU cache keyed by SHA-256 of the normalized render request.
const MAX_ENTRIES = 200;

const map = new Map<string, { value: unknown; expires: number }>();

export function cacheGet<T>(key: string): T | null {
  const hit = map.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    map.delete(key);
    return null;
  }
  // refresh recency
  map.delete(key);
  map.set(key, hit);
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
  map.set(key, { value, expires: Date.now() + ttlMs });
  while (map.size > MAX_ENTRIES) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

export function cacheClear(): void {
  map.clear();
}
