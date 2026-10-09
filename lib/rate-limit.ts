import "server-only";

/**
 * Best-effort in-memory limiter, per server instance. It stops casual spamming; the
 * routes also enforce database-backed limits (per mobile number) that hold across
 * serverless instances.
 */
const hits = new Map<string, number[]>();

/**
 * Abuse limits are skipped in local development (`next dev`), where you submit the same form over and over
 * while testing. They are always enforced in production builds.
 */
export const LIMITS_ENABLED = process.env.NODE_ENV === "production";

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  if (!LIMITS_ENABLED) return true;
  // If the host doesn't tell us who the visitor is, never lump everyone into one shared bucket.
  if (key.endsWith(":unknown")) return true;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
