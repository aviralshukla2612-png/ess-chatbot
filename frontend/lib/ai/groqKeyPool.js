/**
 * Groq Key Pool Manager
 * Manages multiple Groq API keys with:
 * - Round-robin balancing across active keys
 * - Automatic 429 / Rate Limit failover to next available key
 * - Usage, request count, token count, and rate limit cooldown tracking
 * - Real-time statistics for Super Admin dashboard
 * - Dynamic addition/removal/activation of keys via UI or environment
 */

import fs from "fs";
import path from "path";

function resolveKeysFile() {
  const directPath = path.join(process.cwd(), "frontend", "data", "groq_keys_pool.json");
  if (fs.existsSync(path.dirname(directPath))) return directPath;
  const rootData = path.join(process.cwd(), "data", "groq_keys_pool.json");
  return rootData;
}

const KEYS_FILE = resolveKeysFile();

// In-memory key state tracking
// Structure:
// {
//   id: string,
//   label: string,
//   apiKey: string, // full key
//   maskedKey: string,
//   isActive: boolean,
//   status: 'active' | 'rate_limited' | 'error',
//   rateLimitedUntil: number | null, // timestamp
//   totalRequests: number,
//   totalTokens: number,
//   dailyRequests: number,
//   dailyTokens: number,
//   lastUsedAt: string | null,
//   lastError: string | null,
//   createdAt: string
// }

let keyPool = [];
let currentIndex = 0;
let lastResetDate = new Date().toISOString().slice(0, 10);

function maskApiKey(key) {
  if (!key || key.length < 8) return "gsk_****";
  return key.slice(0, 7) + "..." + key.slice(-4);
}

function loadPoolFromFile() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const raw = fs.readFileSync(KEYS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[GROQ_POOL] Could not read keys pool file:", err.message);
  }

  // Fallback: seed with process.env.GROQ_API_KEY if available
  const envKey = (process.env.GROQ_API_KEY || "").trim();
  if (envKey && envKey.length > 10 && !envKey.includes("your_groq_api_key")) {
    return [
      {
        id: "key_default_primary",
        label: "Primary Default Key",
        apiKey: envKey,
        maskedKey: maskApiKey(envKey),
        isActive: true,
        status: "active",
        rateLimitedUntil: null,
        totalRequests: 0,
        totalTokens: 0,
        dailyRequests: 0,
        dailyTokens: 0,
        lastUsedAt: null,
        lastError: null,
        createdAt: new Date().toISOString(),
      },
    ];
  }
  return [];
}

function savePoolToFile() {
  try {
    const dir = path.dirname(KEYS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keyPool, null, 2), "utf8");
  } catch (err) {
    console.error("[GROQ_POOL_SAVE_ERROR] Failed to persist pool:", err.message);
  }
}

// Reset daily counters at midnight UTC
function checkDailyReset() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastResetDate) {
    lastResetDate = today;
    for (const k of keyPool) {
      k.dailyRequests = 0;
      k.dailyTokens = 0;
      if (k.status === "rate_limited") {
        k.status = "active";
        k.rateLimitedUntil = null;
      }
    }
    savePoolToFile();
  }
}

// Initialize pool on module load
keyPool = loadPoolFromFile();

export class GroqKeyPoolManager {
  /**
   * Acquire the next valid, non-rate-limited API key
   * Uses round-robin rotation across active keys
   */
  static getNextKey() {
    checkDailyReset();

    const now = Date.now();
    // Refresh any keys whose cooldown expired
    for (const k of keyPool) {
      if (k.rateLimitedUntil && k.rateLimitedUntil <= now) {
        k.rateLimitedUntil = null;
        if (k.status === "rate_limited") {
          k.status = "active";
        }
      }
    }

    const available = keyPool.filter((k) => k.isActive && k.status !== "rate_limited" && k.status !== "error");

    if (available.length === 0) {
      // Check if any key is just temporarily rate limited
      const rateLimited = keyPool.filter((k) => k.isActive && k.status === "rate_limited");
      if (rateLimited.length > 0) {
        // Find the one with earliest cooldown expiry
        rateLimited.sort((a, b) => (a.rateLimitedUntil || 0) - (b.rateLimitedUntil || 0));
        const earliest = rateLimited[0];
        console.warn(`[GROQ_POOL] All active keys rate-limited. Earliest available key: ${earliest.label} in ${Math.max(0, Math.round(((earliest.rateLimitedUntil || now) - now) / 1000))}s`);
      }
      // If nothing available in pool, return env key directly if valid
      const envKey = process.env.GROQ_API_KEY;
      if (envKey && envKey.trim().length > 10 && !envKey.includes("your_groq")) {
        return {
          id: "env_fallback",
          label: "Environment Fallback",
          apiKey: envKey.trim(),
          maskedKey: maskApiKey(envKey),
        };
      }
      return null;
    }

    // Round-robin selection
    currentIndex = (currentIndex + 1) % available.length;
    const selected = available[currentIndex];
    return selected;
  }

  /**
   * Record successful usage (tokens, request count)
   */
  static recordSuccess(keyId, tokens = 0) {
    checkDailyReset();
    const item = keyPool.find((k) => k.id === keyId || k.apiKey === keyId);
    if (item) {
      item.totalRequests = (item.totalRequests || 0) + 1;
      item.dailyRequests = (item.dailyRequests || 0) + 1;
      item.totalTokens = (item.totalTokens || 0) + (tokens || 0);
      item.dailyTokens = (item.dailyTokens || 0) + (tokens || 0);
      item.lastUsedAt = new Date().toISOString();
      item.status = "active";
      item.lastError = null;
      savePoolToFile();
    }
  }

  /**
   * Mark a key as rate limited (HTTP 429) with cooldown
   * Default cooldown: 60 seconds (for per-minute RPM reset)
   */
  static markRateLimited(keyId, cooldownSeconds = 60, errorMessage = "Rate limit reached (429)") {
    const item = keyPool.find((k) => k.id === keyId || k.apiKey === keyId);
    if (item) {
      item.status = "rate_limited";
      item.rateLimitedUntil = Date.now() + cooldownSeconds * 1000;
      item.lastError = errorMessage;
      console.warn(`[GROQ_POOL] Key '${item.label}' (${item.maskedKey}) marked RATE_LIMITED for ${cooldownSeconds}s. Failing over to next key...`);
      savePoolToFile();
    }
  }

  /**
   * Mark a key as having an invalid credential or permanent error
   */
  static markError(keyId, errorMessage) {
    const item = keyPool.find((k) => k.id === keyId || k.apiKey === keyId);
    if (item) {
      item.status = "error";
      item.lastError = errorMessage;
      savePoolToFile();
    }
  }

  /**
   * Return complete pool status for Super Admin UI (masked keys for security)
   */
  static getPoolStats() {
    checkDailyReset();
    const now = Date.now();

    const keys = keyPool.map((k) => {
      const cooldownRemainingSec = k.rateLimitedUntil && k.rateLimitedUntil > now
        ? Math.round((k.rateLimitedUntil - now) / 1000)
        : 0;

      // Groq Free Tier has ~14,400 daily requests per key
      const dailyCap = 14400;
      const dailyPercent = Math.min(100, Math.round(((k.dailyRequests || 0) / dailyCap) * 100));

      return {
        id: k.id,
        label: k.label,
        maskedKey: k.maskedKey,
        isActive: k.isActive,
        status: cooldownRemainingSec > 0 ? "rate_limited" : k.status,
        cooldownRemainingSec,
        totalRequests: k.totalRequests || 0,
        totalTokens: k.totalTokens || 0,
        dailyRequests: k.dailyRequests || 0,
        dailyTokens: k.dailyTokens || 0,
        dailyCap,
        dailyPercent,
        lastUsedAt: k.lastUsedAt,
        lastError: k.lastError,
        createdAt: k.createdAt,
      };
    });

    const activeKeysCount = keys.filter((k) => k.isActive && k.status === "active").length;
    const rateLimitedKeysCount = keys.filter((k) => k.status === "rate_limited").length;
    const totalDailyRequests = keys.reduce((sum, k) => sum + (k.dailyRequests || 0), 0);
    const totalDailyTokens = keys.reduce((sum, k) => sum + (k.dailyTokens || 0), 0);
    const totalCapacityRequests = Math.max(14400, keys.filter((k) => k.isActive).length * 14400);

    return {
      totalKeys: keys.length,
      activeKeysCount,
      rateLimitedKeysCount,
      totalDailyRequests,
      totalDailyTokens,
      totalCapacityRequests,
      overallDailyPercent: Math.min(100, Math.round((totalDailyRequests / totalCapacityRequests) * 100)),
      keys,
    };
  }

  /**
   * Add a new API key to pool
   */
  static addKey({ label, apiKey }) {
    if (!apiKey || apiKey.trim().length < 15) {
      throw new Error("Invalid Groq API key: must be at least 15 characters.");
    }
    const cleanKey = apiKey.trim();
    const existing = keyPool.find((k) => k.apiKey === cleanKey);
    if (existing) {
      throw new Error("This API key already exists in the pool.");
    }

    const newEntry = {
      id: "key_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      label: label ? label.trim() : `Groq Key #${keyPool.length + 1}`,
      apiKey: cleanKey,
      maskedKey: maskApiKey(cleanKey),
      isActive: true,
      status: "active",
      rateLimitedUntil: null,
      totalRequests: 0,
      totalTokens: 0,
      dailyRequests: 0,
      dailyTokens: 0,
      lastUsedAt: null,
      lastError: null,
      createdAt: new Date().toISOString(),
    };

    keyPool.push(newEntry);
    savePoolToFile();
    return newEntry;
  }

  /**
   * Toggle key active / inactive
   */
  static toggleKey(id, isActive) {
    const item = keyPool.find((k) => k.id === id);
    if (!item) throw new Error("Key not found");
    item.isActive = Boolean(isActive);
    savePoolToFile();
    return item;
  }

  /**
   * Reset rate-limit status for a key manually
   */
  static resetKeyStatus(id) {
    const item = keyPool.find((k) => k.id === id);
    if (!item) throw new Error("Key not found");
    item.status = "active";
    item.rateLimitedUntil = null;
    item.lastError = null;
    savePoolToFile();
    return item;
  }

  /**
   * Remove a key from pool
   */
  static removeKey(id) {
    const index = keyPool.findIndex((k) => k.id === id);
    if (index === -1) throw new Error("Key not found");
    const removed = keyPool.splice(index, 1)[0];
    savePoolToFile();
    return removed;
  }
}
