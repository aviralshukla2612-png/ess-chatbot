/**
 * Distributed Atomic Sliding-Window Rate Limiter
 * Primary backend: Redis Sorted Set (ZSET) atomic Lua Sliding Window Log.
 * Fallback backend: Bounded in-memory Sliding Window Log with automatic TTL sweep
 * and max-bucket eviction (prevents OOM under spoofed/distributed scans when Redis is offline).
 */

import crypto from "crypto";
import { getRedisClient, isRedisConnected } from "../redis/redisClient.js";

const MAX_MEMORY_BUCKETS = 10000;
const SWEEP_INTERVAL_MS = 30000;

// Map<string, number[]> storing request timestamps within the active window
const memorySlidingMap = new Map();
let lastSweepAt = Date.now();
let localSeq = 0;

/**
 * Atomic Redis Lua Sliding Window Log:
 * ARGV[1] = now (ms)
 * ARGV[2] = window (ms)
 * ARGV[3] = limit (max requests)
 * ARGV[4] = unique member ID (prevents same-ms collision)
 *
 * Returns { allowed (1|0), remaining, retryMs, resetEpochMs }
 */
const LUA_SLIDING_WINDOW = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local clearBefore = now - window

redis.call('ZREMRANGEBYSCORE', key, '-inf', clearBefore)
local current = redis.call('ZCARD', key)

if current < limit then
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, window)
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = tonumber(oldest[2]) or now
  local resetAtMs = oldestScore + window
  return {1, limit - current - 1, 0, resetAtMs}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = tonumber(oldest[2]) or now
  local resetAtMs = oldestScore + window
  local retryMs = math.max(1000, resetAtMs - now)
  return {0, 0, retryMs, resetAtMs}
end
`;

function sweepMemoryBuckets(now, maxWindowMs = 900000) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS && memorySlidingMap.size < MAX_MEMORY_BUCKETS) {
    return;
  }
  lastSweepAt = now;

  for (const [k, timestamps] of memorySlidingMap.entries()) {
    if (!timestamps || timestamps.length === 0 || now - timestamps[timestamps.length - 1] > maxWindowMs) {
      memorySlidingMap.delete(k);
    }
  }

  // Hard LRU cap: evict oldest inserted keys if map still exceeds MAX_MEMORY_BUCKETS
  if (memorySlidingMap.size >= MAX_MEMORY_BUCKETS) {
    const excess = memorySlidingMap.size - MAX_MEMORY_BUCKETS + 500;
    let removed = 0;
    for (const k of memorySlidingMap.keys()) {
      memorySlidingMap.delete(k);
      removed++;
      if (removed >= excess) break;
    }
  }
}

/**
 * Evaluate sliding-window rate limit for a composite key.
 * @param {string} key - Identifier (e.g., "chat:ip:203.0.113.5:bot_1")
 * @param {number} maxRequests - Allowed requests inside windowMs
 * @param {number} windowMs - Sliding window duration in milliseconds
 */
export async function checkDistributedRateLimit(key, maxRequests = 30, windowMs = 60000) {
  const safeLimit = Math.max(1, Number(maxRequests) || 30);
  const safeWindowMs = Math.max(100, Number(windowMs) || 60000);
  const now = Date.now();
  const redis = getRedisClient();

  // 1. Primary: Redis Atomic Lua Sliding Window Log
  if (redis && isRedisConnected()) {
    try {
      localSeq = (localSeq + 1) % 1000000;
      const memberId = `${now}:${localSeq}:${crypto.randomBytes(4).toString("hex")}`;
      const res = await redis.eval(
        LUA_SLIDING_WINDOW,
        1,
        `ratelimit:${key}`,
        now,
        safeWindowMs,
        safeLimit,
        memberId
      );

      const [allowed, remaining, retryMs, resetAtMs] = res;
      const retrySec = allowed === 1 ? 0 : Math.max(1, Math.ceil(Number(retryMs) / 1000));
      const resetEpochSec = Math.ceil((Number(resetAtMs) || now + safeWindowMs) / 1000);

      return {
        ok: allowed === 1,
        limit: safeLimit,
        remaining: Math.max(0, Number(remaining) || 0),
        retrySec,
        resetAt: resetEpochSec,
        windowSec: Math.ceil(safeWindowMs / 1000),
        backend: "redis",
      };
    } catch {
      // Fail-open to bounded local sliding-window log on transient Redis error
    }
  }

  // 2. Fallback: Bounded In-Memory Sliding Window Log (identical semantics to Redis ZSET)
  sweepMemoryBuckets(now, Math.max(safeWindowMs, 900000));

  const clearBefore = now - safeWindowMs;
  const existing = memorySlidingMap.get(key);
  const activeTimestamps = existing ? existing.filter((ts) => ts > clearBefore) : [];

  if (activeTimestamps.length >= safeLimit) {
    memorySlidingMap.set(key, activeTimestamps);
    const oldestTs = activeTimestamps[0] || now;
    const resetAtMs = oldestTs + safeWindowMs;
    const retrySec = Math.max(1, Math.ceil((resetAtMs - now) / 1000));
    return {
      ok: false,
      limit: safeLimit,
      remaining: 0,
      retrySec,
      resetAt: Math.ceil(resetAtMs / 1000),
      windowSec: Math.ceil(safeWindowMs / 1000),
      backend: "memory",
    };
  }

  activeTimestamps.push(now);
  // Refresh insertion order for LRU behavior
  memorySlidingMap.delete(key);
  memorySlidingMap.set(key, activeTimestamps);

  const oldestTs = activeTimestamps[0] || now;
  const resetAtMs = oldestTs + safeWindowMs;

  return {
    ok: true,
    limit: safeLimit,
    remaining: Math.max(0, safeLimit - activeTimestamps.length),
    retrySec: 0,
    resetAt: Math.ceil(resetAtMs / 1000),
    windowSec: Math.ceil(safeWindowMs / 1000),
    backend: "memory",
  };
}

/**
 * Test helper: Clear in-memory fallback buckets.
 */
export function _resetRateLimitMemory() {
  memorySlidingMap.clear();
}
