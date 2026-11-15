import { ApiError } from "./http";

// In-memory fixed-window limiter. Fine for a single Node process (cPanel);
// it resets on restart, which is acceptable for brute-force protection.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimit(req: Request, name: string, limit: number, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const k = `${name}:${clientIp(req)}`;
  let b = buckets.get(k);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(k, b);
  }
  b.count += 1;
  if (b.count > limit) {
    throw new ApiError(429, "Too many requests. Please try again later.", "RATE_LIMITED");
  }
  if (buckets.size > 5000) {
    for (const [key, v] of buckets) if (v.resetAt <= now) buckets.delete(key);
  }
}
