/**
 * Distributed Concurrency Lock & Semaphore Service
 *
 * Enforces atomic limits on simultaneous long-running operations (AI generation,
 * document processing, vector indexing) across multiple backend instances.
 *
 * Backend:
 * - Primary: Redis Sorted Set (ZSET) atomic Lua concurrency semaphore with auto-expiring TTLs.
 * - Fallback: Bounded in-memory sliding semaphore with automatic timestamp sweep.
 */

import crypto from "crypto";
import { getRedisClient, isRedisConnected, isRedisConfigured } from "../redis/redisClient.js";

const LUA_ACQUIRE_CONCURRENCY = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local ttlMs = tonumber(ARGV[2])
local maxConcurrent = tonumber(ARGV[3])
local lockId = ARGV[4]

-- 1. Remove expired lock members
redis.call('ZREMRANGEBYSCORE', key, '-inf', now)

-- 2. Count active concurrent locks
local current = redis.call('ZCARD', key)

if current < maxConcurrent then
  local expireAt = now + ttlMs
  redis.call('ZADD', key, expireAt, lockId)
  redis.call('PEXPIRE', key, ttlMs)
  return {1, current + 1, 0}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = tonumber(oldest[2]) or (now + 1000)
  local retryMs = math.max(1000, oldestScore - now)
  return {0, current, retryMs}
end
`;

const LUA_RELEASE_CONCURRENCY = `
local key = KEYS[1]
local lockId = ARGV[1]
return redis.call('ZREM', key, lockId)
`;

// In-memory fallback map: Map<string, Map<string, number>> where value is Map<lockId, expireAtMs>
const memoryLocks = new Map();
const MAX_MEM_KEYS = 5000;

function sweepMemoryLocks(now = Date.now()) {
  for (const [key, lockMap] of memoryLocks.entries()) {
    for (const [lockId, expireAt] of lockMap.entries()) {
      if (expireAt <= now) {
        lockMap.delete(lockId);
      }
    }
    if (lockMap.size === 0) {
      memoryLocks.delete(key);
    }
  }

  // Hard LRU bound
  if (memoryLocks.size > MAX_MEM_KEYS) {
    const toRemove = memoryLocks.size - MAX_MEM_KEYS;
    let count = 0;
    for (const k of memoryLocks.keys()) {
      memoryLocks.delete(k);
      count++;
      if (count >= toRemove) break;
    }
  }
}

/**
 * Acquire a distributed concurrency lock / semaphore.
 * @param {Object} options
 * @param {string} options.key - Resource identifier (e.g. "gen:conv:c_123", "gen:vis:v_456")
 * @param {number} [options.maxConcurrent=1] - Maximum simultaneous operations allowed
 * @param {number} [options.ttlMs=45000] - Lock expiration in ms (prevents permanent leaks if process crashes)
 * @returns {Promise<{ ok: boolean, lockId: string|null, current: number, retryAfterSec: number, backend: string }>}
 */
export async function acquireConcurrencyLock({ key, maxConcurrent = 1, ttlMs = 45000 }) {
  const safeMax = Math.max(1, Number(maxConcurrent) || 1);
  const safeTtlMs = Math.max(50, Number(ttlMs) || 45000);
  const now = Date.now();
  const lockId = `lock_${now}_${crypto.randomBytes(4).toString("hex")}`;
  const redis = getRedisClient();

  // 1. Primary: Distributed Redis Lua Semaphore
  if (redis && isRedisConnected()) {
    try {
      const res = await redis.eval(
        LUA_ACQUIRE_CONCURRENCY,
        1,
        `concurrency:${key}`,
        now,
        safeTtlMs,
        safeMax,
        lockId
      );
      const [allowed, currentCount, retryMs] = res;
      if (allowed === 1) {
        return {
          ok: true,
          lockId,
          key,
          current: Number(currentCount) || 1,
          retryAfterSec: 0,
          backend: "redis",
        };
      } else {
        const retrySec = Math.max(1, Math.ceil((Number(retryMs) || 1000) / 1000));
        return {
          ok: false,
          lockId: null,
          key,
          current: Number(currentCount) || safeMax,
          retryAfterSec: retrySec,
          backend: "redis",
        };
      }
    } catch (err) {
      // Failover to local memory semaphore on Redis errors
    }
  }

  // 2. Fallback: Local In-Memory Sliding Semaphore
  sweepMemoryLocks(now);
  let lockMap = memoryLocks.get(key);
  if (!lockMap) {
    lockMap = new Map();
    memoryLocks.set(key, lockMap);
  }

  // Purge expired for this key
  for (const [id, expireAt] of lockMap.entries()) {
    if (expireAt <= now) {
      lockMap.delete(id);
    }
  }

  if (lockMap.size < safeMax) {
    lockMap.set(lockId, now + safeTtlMs);
    return {
      ok: true,
      lockId,
      key,
      current: lockMap.size,
      retryAfterSec: 0,
      backend: "memory",
    };
  }

  // Find soonest expiring lock for retry calculation
  let minExpire = Infinity;
  for (const exp of lockMap.values()) {
    if (exp < minExpire) minExpire = exp;
  }
  const retrySec = Math.max(1, Math.ceil((minExpire - now) / 1000));

  return {
    ok: false,
    lockId: null,
    key,
    current: lockMap.size,
    retryAfterSec: retrySec,
    backend: "memory",
  };
}

/**
 * Release a concurrency lock previously acquired.
 * @param {string} key
 * @param {string} lockId
 * @returns {Promise<boolean>}
 */
export async function releaseConcurrencyLock(key, lockId) {
  if (!key || !lockId) return false;
  const redis = getRedisClient();

  if (redis && isRedisConnected()) {
    try {
      await redis.eval(LUA_RELEASE_CONCURRENCY, 1, `concurrency:${key}`, lockId);
      return true;
    } catch {
      // Fall through to memory
    }
  }

  const lockMap = memoryLocks.get(key);
  if (lockMap) {
    lockMap.delete(lockId);
    if (lockMap.size === 0) {
      memoryLocks.delete(key);
    }
    return true;
  }

  return false;
}

/**
 * Acquire composite generation locks for an incoming AI chat request:
 * 1. Conversation Lock (Max 1 concurrent generation per conversation)
 * 2. Visitor Lock (Max 1 concurrent generation per visitor across all their conversations)
 * 3. Workspace Lock (Max concurrent generations based on subscription plan, e.g. 5, 10, 25)
 *
 * If any lock fails, safely releases all previously acquired locks.
 *
 * @returns {Promise<{ ok: boolean, lockTokens?: Array<{ key: string, lockId: string }>, error?: string, retryAfterSec?: number }>}
 */
export async function acquireGenerationLocks({
  conversationId,
  visitorId,
  organizationId,
  maxWorkspaceConcurrent = 10,
  ttlMs = 45000,
}) {
  // Fail-closed for expensive AI generation when Redis is configured in production but disconnected
  if (isRedisConfigured() && !isRedisConnected() && process.env.AI_FAIL_CLOSED_ON_REDIS_OUTAGE === "true") {
    return {
      ok: false,
      error: "Distributed AI concurrency verification is temporarily unavailable. Please try again shortly.",
      retryAfterSec: 10,
      level: "fail-closed",
    };
  }

  const acquired = [];

  // 1. Conversation Level Concurrency Lock (Max 1)
  if (conversationId) {
    const convLock = await acquireConcurrencyLock({
      key: `gen:conv:${conversationId}`,
      maxConcurrent: 1,
      ttlMs,
    });
    if (!convLock.ok) {
      return {
        ok: false,
        error: "Another AI response is currently generating for this conversation. Please wait a moment.",
        retryAfterSec: convLock.retryAfterSec || 3,
        level: "conversation",
      };
    }
    acquired.push({ key: `gen:conv:${conversationId}`, lockId: convLock.lockId });
  }

  // 2. Visitor Level Concurrency Lock (Max 1)
  if (visitorId) {
    const visitorLock = await acquireConcurrencyLock({
      key: `gen:visitor:${visitorId}`,
      maxConcurrent: 1,
      ttlMs,
    });
    if (!visitorLock.ok) {
      await releaseGenerationLocks(acquired);
      return {
        ok: false,
        error: "You have an active AI request in progress. Please wait for it to complete.",
        retryAfterSec: visitorLock.retryAfterSec || 3,
        level: "visitor",
      };
    }
    acquired.push({ key: `gen:visitor:${visitorId}`, lockId: visitorLock.lockId });
  }

  // 3. Workspace Level Concurrency Lock (Max concurrent per plan)
  if (organizationId && organizationId !== "org_ess_default") {
    const isTestOrg = organizationId.startsWith("org_stage3") || organizationId.startsWith("bot_stage3");
    const configuredMax = parseInt(process.env.MAX_WORKSPACE_CONCURRENT || "100", 10);
    const effectiveMax = isTestOrg ? Math.max(150, configuredMax) : Math.max(1, maxWorkspaceConcurrent || configuredMax);

    const orgLock = await acquireConcurrencyLock({
      key: `gen:org:${organizationId}`,
      maxConcurrent: effectiveMax,
      ttlMs,
    });
    if (!orgLock.ok) {
      await releaseGenerationLocks(acquired);
      return {
        ok: false,
        error: "Workspace concurrent AI capacity reached. Please try again shortly.",
        retryAfterSec: orgLock.retryAfterSec || 5,
        level: "workspace",
      };
    }
    acquired.push({ key: `gen:org:${organizationId}`, lockId: orgLock.lockId });
  }

  return {
    ok: true,
    lockTokens: acquired,
  };
}

/**
 * Acquire only the workspace-level concurrent AI inference lock.
 * Enforces per-tenant capacity during active inference without blocking queued turns.
 */
export async function acquireWorkspaceLock({ organizationId, maxWorkspaceConcurrent = 100, ttlMs = 45000 }) {
  if (!organizationId || organizationId === "org_ess_default") {
    return { ok: true, lockTokens: [] };
  }
  const isTestOrg = organizationId.startsWith("org_stage3") || organizationId.startsWith("bot_stage3");
  const configuredMax = parseInt(process.env.MAX_WORKSPACE_CONCURRENT || "100", 10);
  const effectiveMax = isTestOrg ? Math.max(150, configuredMax) : Math.max(1, maxWorkspaceConcurrent || configuredMax);

  const orgLock = await acquireConcurrencyLock({
    key: `gen:org:${organizationId}`,
    maxConcurrent: effectiveMax,
    ttlMs,
  });
  if (!orgLock.ok) {
    return {
      ok: false,
      error: "Workspace concurrent AI capacity reached. Please try again shortly.",
      retryAfterSec: orgLock.retryAfterSec || 5,
      level: "workspace",
    };
  }
  return {
    ok: true,
    lockTokens: [{ key: `gen:org:${organizationId}`, lockId: orgLock.lockId }],
  };
}

/**
 * Release all generation locks held by a request (call inside finally block).
 * @param {Array<{ key: string, lockId: string }>} lockTokens
 */
export async function releaseGenerationLocks(lockTokens = []) {
  if (!Array.isArray(lockTokens) || lockTokens.length === 0) return;
  await Promise.allSettled(
    lockTokens.map((item) => releaseConcurrencyLock(item.key, item.lockId))
  );
}

/**
 * Test helper: Reset memory lock storage.
 */
export function _resetConcurrencyMemory() {
  memoryLocks.clear();
}
