import "server-only";

/**
 * In-memory sliding counter (per serverless instance; good enough for a demo).
 * hit() counts an attempt and returns false once `max` is exceeded within `windowMs`.
 */
export function createLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; first: number }>();
  return {
    hit(key: string): boolean {
      const now = Date.now();
      const h = hits.get(key);
      if (!h || now - h.first > windowMs) {
        hits.set(key, { count: 1, first: now });
        if (hits.size > 10_000) hits.clear();
        return true;
      }
      h.count += 1;
      return h.count <= max;
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}
