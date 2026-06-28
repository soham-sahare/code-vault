import { redis } from "./client";

/**
 * Enqueue a reminder into the Redis ZSET queue
 */
export async function enqueueSRS(userId: string, reminderId: string, dueTimeSec: number): Promise<void> {
  try {
    await redis.zadd(`srs:queue:${userId}`, dueTimeSec, reminderId);
  } catch (e: any) {
    console.error("Failed to enqueue in Redis:", e.message);
  }
}

/**
 * Dequeue a reminder from the Redis ZSET queue
 */
export async function dequeueSRS(userId: string, reminderId: string): Promise<void> {
  try {
    await redis.zrem(`srs:queue:${userId}`, reminderId);
  } catch (e: any) {
    console.error("Failed to dequeue from Redis:", e.message);
  }
}

/**
 * Fetch all due reminder IDs from the Redis ZSET queue
 */
export async function getDueFromQueue(userId: string, nowSec: number): Promise<string[]> {
  try {
    return await redis.zrangebyscore(`srs:queue:${userId}`, 0, nowSec);
  } catch (e: any) {
    console.error("Failed to fetch due items from Redis queue:", e.message);
    return [];
  }
}
