/**
 * Redis caching helpers for all hot paths defined in PLAN.md § 12.3.
 *
 * Key map:
 *  - notif:count:{userId}          String  5 min   Unread notification count badge
 *  - analytics:{userId}            String  1 hour  Full analytics payload
 *  - sheet:public:{shareToken}     String  24 hours Public sheet + problems + solutions
 *  - tags:{userId}                 String  1 hour  Comma-separated tag list for autocomplete
 *  - rl:{userId}:{route}           String  60 sec  Rate limiter counter
 */

import { redis } from "./client";

// ─── Notification Count Cache ───────────────────────────────────────────────

const NOTIF_COUNT_TTL = 300; // 5 minutes

export async function getCachedNotifCount(userId: string): Promise<number | null> {
  try {
    const val = await redis.get(`notif:count:${userId}`);
    return val !== null ? parseInt(val as string, 10) : null;
  } catch {
    return null;
  }
}

export async function setCachedNotifCount(userId: string, count: number): Promise<void> {
  try {
    await redis.set(`notif:count:${userId}`, String(count), { ex: NOTIF_COUNT_TTL });
  } catch {
    // Non-fatal: notification count will just be fetched from DB
  }
}

export async function invalidateNotifCount(userId: string): Promise<void> {
  try {
    await redis.del(`notif:count:${userId}`);
  } catch {
    // Non-fatal
  }
}

// ─── Analytics Cache ─────────────────────────────────────────────────────────

const ANALYTICS_TTL = 3600; // 1 hour

export async function getCachedAnalytics(userId: string): Promise<any | null> {
  try {
    const val = await redis.get(`analytics:${userId}`);
    return val ? JSON.parse(val as string) : null;
  } catch {
    return null;
  }
}

export async function setCachedAnalytics(userId: string, data: any): Promise<void> {
  try {
    await redis.set(`analytics:${userId}`, JSON.stringify(data), { ex: ANALYTICS_TTL });
  } catch {
    // Non-fatal
  }
}

export async function invalidateAnalyticsCache(userId: string): Promise<void> {
  try {
    await redis.del(`analytics:${userId}`);
  } catch {
    // Non-fatal
  }
}

// ─── Public Sheet Cache ───────────────────────────────────────────────────────

const SHEET_PUBLIC_TTL = 86400; // 24 hours (per PLAN.md §12.3)

export async function getCachedPublicSheet(shareToken: string): Promise<any | null> {
  try {
    const val = await redis.get(`sheet:public:${shareToken}`);
    return val ? JSON.parse(val as string) : null;
  } catch {
    return null;
  }
}

export async function setCachedPublicSheet(shareToken: string, data: any): Promise<void> {
  try {
    await redis.set(`sheet:public:${shareToken}`, JSON.stringify(data), { ex: SHEET_PUBLIC_TTL });
  } catch {
    // Non-fatal
  }
}

export async function invalidatePublicSheetCache(shareToken: string): Promise<void> {
  try {
    await redis.del(`sheet:public:${shareToken}`);
  } catch {
    // Non-fatal
  }
}

// ─── Public Problem Cache ───────────────────────────────────────────────────

const PROBLEM_PUBLIC_TTL = 86400; // 24 hours

export async function getCachedPublicProblem(slug: string): Promise<any | null> {
  try {
    const val = await redis.get(`problem:public:${slug}`);
    return val ? JSON.parse(val as string) : null;
  } catch {
    return null;
  }
}

export async function setCachedPublicProblem(slug: string, data: any): Promise<void> {
  try {
    await redis.set(`problem:public:${slug}`, JSON.stringify(data), { ex: PROBLEM_PUBLIC_TTL });
  } catch {
    // Non-fatal
  }
}

export async function invalidatePublicProblemCache(slug: string): Promise<void> {
  try {
    await redis.del(`problem:public:${slug}`);
  } catch {
    // Non-fatal
  }
}

// ─── Tags Cache (for autocomplete) ───────────────────────────────────────────

const TAGS_TTL = 3600; // 1 hour

export async function getCachedTags(userId: string): Promise<string[] | null> {
  try {
    const val = await redis.get(`tags:${userId}`);
    return val ? JSON.parse(val as string) : null;
  } catch {
    return null;
  }
}

export async function setCachedTags(userId: string, tags: string[]): Promise<void> {
  try {
    await redis.set(`tags:${userId}`, JSON.stringify(tags), { ex: TAGS_TTL });
  } catch {
    // Non-fatal
  }
}

export async function invalidateTagsCache(userId: string): Promise<void> {
  try {
    await redis.del(`tags:${userId}`);
  } catch {
    // Non-fatal
  }
}

export async function invalidateUserCaches(userId: string): Promise<void> {
  await Promise.allSettled([
    invalidateAnalyticsCache(userId),
    invalidateTagsCache(userId),
    invalidateNotifCount(userId),
  ]);
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW = 60;       // 60 seconds per PLAN.md §12.3
const RATE_LIMIT_MAX = 100;          // 100 req/min per user per route

/**
 * Checks and increments rate limit for a given user+route combination.
 * Returns { allowed: boolean, remaining: number }.
 * Per PLAN.md §12.3: rl:{userId}:{route} String 60 sec
 */
export async function checkRateLimit(
  userId: string,
  route: string
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rl:${userId}:${route}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // First request in window — set expiry
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    const remaining = Math.max(0, RATE_LIMIT_MAX - count);
    return { allowed: count <= RATE_LIMIT_MAX, remaining };
  } catch {
    // Redis unavailable → fail open (allow request)
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }
}
