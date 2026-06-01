import { Redis } from "@upstash/redis";

// Redis client — shared across invocations on the same serverless instance
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// In-memory fallback for local dev without Upstash
const memStore = new Map<string, { count: number; resetAt: number }>();

function memLimit(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (entry.count >= max) return { allowed: false, retryAfterMs: entry.resetAt - now };
  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export async function rateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  if (!redis) return memLimit(key, max, windowMs);

  const windowSecs = Math.ceil(windowMs / 1000);
  const rk = `rl:${key}`;

  try {
    const count = await redis.incr(rk);
    if (count === 1) await redis.expire(rk, windowSecs);
    if (count > max) {
      const ttl = await redis.ttl(rk);
      return { allowed: false, retryAfterMs: Math.max(ttl, 1) * 1000 };
    }
    return { allowed: true, retryAfterMs: 0 };
  } catch (err) {
    console.error("[rate-limit] Redis error, allowing request:", err);
    return { allowed: true, retryAfterMs: 0 };
  }
}
