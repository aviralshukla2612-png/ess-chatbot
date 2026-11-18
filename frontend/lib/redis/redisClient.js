/**
 * Distributed Redis Client & Connection Manager
 * Supports Redis Cluster / Standalone with automatic self-healing reconnection,
 * bounded command timeouts, and graceful local fallback when Redis is offline.
 */

let Redis = null;
try {
  const ioredis = await import("ioredis");
  Redis = ioredis.default || ioredis;
} catch {
  // ioredis not available in this environment
}

function resolveRedisUrl() {
  return (
    process.env.REDIS_URL ||
    (process.env.REDIS_HOST
      ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
      : null)
  );
}

let redisClient = null;
let isConnected = false;

export function getRedisClient() {
  const redisUrl = resolveRedisUrl();
  if (!Redis || !redisUrl) return null;

  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        connectTimeout: 2500,
        commandTimeout: 1500,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy(times) {
          if (process.env.NODE_ENV === "test" && times > 2) return null;
          // Bounded exponential backoff up to 5s so production self-heals after Redis restarts
          return Math.min(times * 300, 5000);
        },
      });

      redisClient.on("connect", () => {
        isConnected = true;
      });

      redisClient.on("ready", () => {
        isConnected = true;
        console.log("✅ [REDIS] Ready on distributed Redis instance.");
      });

      redisClient.on("close", () => {
        isConnected = false;
      });

      redisClient.on("end", () => {
        isConnected = false;
      });

      redisClient.on("error", () => {
        isConnected = false;
      });
    } catch {
      redisClient = null;
      isConnected = false;
    }
  }

  return isConnected ? redisClient : null;
}

export function isRedisConnected() {
  return isConnected && Boolean(redisClient);
}

export async function closeRedisClient() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      try {
        redisClient.disconnect();
      } catch {}
    }
    redisClient = null;
    isConnected = false;
  }
}
