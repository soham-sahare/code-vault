/**
 * Redis client — uses @upstash/redis (HTTP-based, serverless-safe) when
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set (production/Vercel).
 * Falls back to ioredis for local development (REDIS_URL=redis://localhost:6379).
 *
 * Per PLAN.md § 18.2 & 18.5:
 *  "@upstash/redis is fully compatible with Vercel Edge Runtime.
 *   No `ioredis` or `node:net` dependency."
 */

export type RedisClient = {
  zadd: (key: string, score: number, member: string) => Promise<unknown>;
  zrem: (key: string, ...members: string[]) => Promise<unknown>;
  zrangebyscore: (key: string, min: number, max: number) => Promise<string[]>;
  zcount: (key: string, min: number, max: number) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
};

let redisInstance: RedisClient | null = null;

function createRedisClient(): RedisClient {
  // Upstash (production / Vercel): HTTP-based, no persistent TCP connections
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // Dynamic import to avoid bundling issues in environments without it
    const { Redis } = require("@upstash/redis");
    const upstash = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    return {
      zadd: (key, score, member) => upstash.zadd(key, { score, member }),
      zrem: (key, ...members) => upstash.zrem(key, ...members),
      zrangebyscore: (key, min, max) => upstash.zrangebyscore(key, min, max) as Promise<string[]>,
      zcount: (key, min, max) => upstash.zcount(key, min, max) as Promise<number>,
      get: (key) => upstash.get(key) as Promise<string | null>,
      set: (key, value, opts) =>
        opts?.ex
          ? upstash.set(key, value, { ex: opts.ex })
          : upstash.set(key, value),
      del: (key) => upstash.del(key),
      incr: (key) => upstash.incr(key) as Promise<number>,
      expire: (key, seconds) => upstash.expire(key, seconds),
    };
  }

  // Local dev fallback: ioredis (TCP, requires a running Redis server)
  const IoRedis = require("ioredis");
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  const globalForRedis = global as unknown as { _ioredis: InstanceType<typeof IoRedis> };
  if (!globalForRedis._ioredis) {
    globalForRedis._ioredis = new IoRedis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    globalForRedis._ioredis.on("error", (err: Error) => {
      // Non-fatal: Redis unavailable in dev -> SRS queue falls back to DB
      // Suppress logging to keep local dev logs clean when no Redis server is running.
    });
  }

  const ioClient = globalForRedis._ioredis;
  return {
    zadd: (key, score, member) => ioClient.zadd(key, score, member),
    zrem: (key, ...members) => ioClient.zrem(key, ...members),
    zrangebyscore: (key, min, max) => ioClient.zrangebyscore(key, min, max),
    zcount: (key, min, max) => ioClient.zcount(key, min, max),
    get: (key) => ioClient.get(key),
    set: (key, value, opts) =>
      opts?.ex ? ioClient.set(key, value, "EX", opts.ex) : ioClient.set(key, value),
    del: (key) => ioClient.del(key),
    incr: (key) => ioClient.incr(key),
    expire: (key, seconds) => ioClient.expire(key, seconds),
  };
}

export function getRedis(): RedisClient {
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  return redisInstance;
}

// Named export for convenience (matches existing import pattern)
export const redis = new Proxy({} as RedisClient, {
  get(_target, prop) {
    return (getRedis() as any)[prop];
  },
});
