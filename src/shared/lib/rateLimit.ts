/**
 * FR-B10: per-IP / per-phone rate limiting for public endpoints.
 * Single-instance in-memory buckets (fine for v1 dev/single-node).
 * Swap with Redis/Upstash when horizontally scaling (Phase 7 hardening).
 */

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: boolean; remaining: number } {
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, remaining: 0 };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, remaining: limit - hits.length };
}

/** Test seam: clear all buckets. */
export function _clearRateLimits(): void {
  buckets.clear();
}

export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
