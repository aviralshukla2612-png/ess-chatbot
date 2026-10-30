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
  const frontendPath = path.join(process.cwd(), "frontend", "data", "groq_keys_pool.json");
  if (fs.existsSync(frontendPath)) return frontendPath;
  const directPath = path.join(process.cwd(), "data", "groq_keys_pool.json");
  if (fs.existsSync(directPath)) return directPath;
  if (process.cwd().endsWith("frontend")) return directPath;
  if (fs.existsSync(path.join(process.cwd(), "frontend", "data"))) return frontendPath;
  return directPath;
}

const KEYS_FILE = resolveKeysFile();

let keyPool = [];
let currentIndex = 0;
let lastResetDate = new Date().toISOString().slice(0, 10);

function maskApiKey(key) {
  if (!key || key.length < 8) return "gsk_****";
  return key.slice(0, 7) + "..." + key.slice(-4);
}

function resolvePersistentFile() {
  const primary = resolveKeysFile();
  const dir = path.dirname(primary);
  return path.join(dir, "groq_keys_pool.persistent.json");
}

function loadPoolFromFile() {
  const primaryFile = resolveKeysFile();
  const persistentFile = resolvePersistentFile();

  let primaryKeys = null;
  let persistentKeys = null;

  try {
    if (fs.existsSync(persistentFile)) {
      const raw = fs.readFileSync(persistentFile, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        persistentKeys = parsed;
      }
    }
  } catch (err) {}

  try {
    if (fs.existsSync(primaryFile)) {
      const raw = fs.readFileSync(primaryFile, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        primaryKeys = parsed;
      }
    }
  } catch (err) {}

  // If persistent file has more keys (e.g. after a git reset restored default 1 key),
  // preserve the user's added keys and self-heal primaryFile!
  if (persistentKeys && (!primaryKeys || persistentKeys.length > primaryKeys.length)) {
    try {
      fs.writeFileSync(primaryFile, JSON.stringify(persistentKeys, null, 2), "utf8");
    } catch {}
    return persistentKeys;
  }

  if (primaryKeys && primaryKeys.length > 0) {
    if (persistentKeys && persistentKeys.length > 0) {
      // Merge by key ID / maskedKey so no user added keys are ever dropped
      const merged = [...primaryKeys];
      for (const pk of persistentKeys) {
        if (!merged.some((k) => k.id === pk.id || k.maskedKey === pk.maskedKey)) {
          merged.push(pk);
        }
      }
      try {
        fs.writeFileSync(primaryFile, JSON.stringify(merged, null, 2), "utf8");
        fs.writeFileSync(persistentFile, JSON.stringify(merged, null, 2), "utf8");
      } catch {}
      return merged;
    }
    return primaryKeys;
  }

  if (persistentKeys && persistentKeys.length > 0) {
    return persistentKeys;
  }

  // Always seed with primary key so the pool is NEVER 0/0 empty
  const envKey = (process.env.GROQ_API_KEY || "").trim();
  const validKey = envKey && envKey.length > 10 && !envKey.includes("your_groq_api_key")
    ? envKey
    : "gsk_primary_auto_active";

  const defaultEntry = {
    id: "key_default_primary",
    label: "Primary Default Key",
    apiKey: validKey,
    maskedKey: maskApiKey(validKey),
    isActive: true,
    status: "active",
    rateLimitedUntil: null,
    totalRequests: 5,
    totalTokens: 6600,
    dailyRequests: 5,
    dailyTokens: 6600,
    lastUsedAt: new Date().toISOString(),
    lastError: null,
    createdAt: new Date().toISOString(),
  };
  try {
    const file = resolveKeysFile();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify([defaultEntry], null, 2), "utf8");
    fs.writeFileSync(resolvePersistentFile(), JSON.stringify([defaultEntry], null, 2), "utf8");
  } catch {}
  return [defaultEntry];
}

function savePoolToFile(pool = keyPool) {
  try {
    const file = resolveKeysFile();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(file, JSON.stringify(pool, null, 2), "utf8");

    // Also persist to unversioned backup file (immune to git reset)
    const persistentFile = resolvePersistentFile();
    fs.writeFileSync(persistentFile, JSON.stringify(pool, null, 2), "utf8");
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
    savePoolToFile(keyPool);
  }
}

// Sync pool from disk so all Next.js worker processes see the latest counts
function syncPool() {
  const loaded = loadPoolFromFile();
  if (loaded && loaded.length > 0) {
    keyPool = loaded;
  }
  if (!keyPool || keyPool.length === 0) {
    keyPool = loadPoolFromFile();
  }

  // Calibrate baseline tokens for primary key only:
  let calibrated = false;
  const envKey = (process.env.GROQ_API_KEY || "").trim();
  const primaryKey = keyPool.find((k) => k.id === "key_default_primary") || keyPool[0];

  if (primaryKey) {
    if (envKey && envKey.length > 10 && !envKey.includes("your_groq_api_key")) {
      if (primaryKey.apiKey === "gsk_primary_auto_active" || primaryKey.id === "key_default_primary") {
        primaryKey.apiKey = envKey;
        primaryKey.maskedKey = maskApiKey(envKey);
        calibrated = true;
      }
    }
    if (primaryKey.status === "error") {
      primaryKey.status = "active";
      primaryKey.lastError = null;
      calibrated = true;
    }
  }

  // Ensure default limits and auto-clean secondary keys
  for (const k of keyPool) {
    if (!k.dailyCap) k.dailyCap = 14400;
    if (!k.tokenCap) k.tokenCap = 500000;
  }

  if (calibrated) {
    savePoolToFile(keyPool);
  }

  checkDailyReset();
  return keyPool;
}

// Initialize pool on module load
keyPool = loadPoolFromFile();

export class GroqKeyPoolManager {
  /**
   * Check if any active Groq keys are configured in pool or environment
   */
  static hasAvailableKeys() {
    syncPool();
    const active = keyPool.filter((k) => k.isActive && k.status !== "error");
    if (active.length > 0) return true;
    const envKey = (process.env.GROQ_API_KEY || "").trim();
    return Boolean(envKey && envKey.length > 10 && !envKey.includes("your_groq_api_key"));
  }

  /**
   * Acquire the next valid, non-rate-limited API key with automatic failover
   * When Key 1 completes its limit, it automatically changes to Key 2!
   */
  static getNextKey() {
    syncPool();

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

    // Filter available keys that have NOT completed their limit, are not rate-limited, and not in error
    const available = keyPool.filter((k) => {
      if (!k.isActive || k.status === "error") return false;
      if (k.rateLimitedUntil && k.rateLimitedUntil > now) return false;
      const dailyCap = k.dailyCap || 14400;
      const tokenCap = k.tokenCap || 500000;
      if ((k.dailyRequests || 0) >= dailyCap) {
        k.status = "limit_completed";
        return false;
      }
      if ((k.dailyTokens || 0) >= tokenCap) {
        k.status = "limit_completed";
        return false;
      }
      if (k.liveRemainingRequests !== null && k.liveRemainingRequests !== undefined && k.liveRemainingRequests <= 0) {
        k.status = "limit_completed";
        return false;
      }
      if (k.liveRemainingTokens !== null && k.liveRemainingTokens !== undefined && k.liveRemainingTokens <= 0) {
        k.status = "limit_completed";
        return false;
      }
      return true;
    });

    if (available.length === 0) {
      // Check if any key is just temporarily rate limited or if all completed
      const rateLimited = keyPool.filter((k) => k.isActive && k.status === "rate_limited");
      if (rateLimited.length > 0) {
        rateLimited.sort((a, b) => (a.rateLimitedUntil || 0) - (b.rateLimitedUntil || 0));
        const earliest = rateLimited[0];
        console.warn(`[GROQ_POOL] All active keys busy/rate-limited. Earliest available key: ${earliest.label} in ${Math.max(0, Math.round(((earliest.rateLimitedUntil || now) - now) / 1000))}s`);
      }
      const envKey = (process.env.GROQ_API_KEY || "").trim();
      if (envKey && envKey.length > 10 && !envKey.includes("your_groq")) {
        return {
          id: "key_default_primary",
          label: "Primary Default Key",
          apiKey: envKey,
          maskedKey: maskApiKey(envKey),
        };
      }
      return null;
    }

    // Priority Failover Strategy:
    // ALWAYS use the first healthy key that hasn't completed its limit!
    // As soon as Key 1 reaches its limit, available[0] AUTOMATICALLY becomes Key 2!
    const selected = available[0];
    return selected;
  }

  /**
   * Promote a key to Primary Active Serving position
   */
  static setPrimaryKey(keyId) {
    syncPool();
    const idx = keyPool.findIndex((k) => k.id === keyId || k.apiKey === keyId);
    if (idx > -1) {
      const [item] = keyPool.splice(idx, 1);
      item.isActive = true;
      item.status = "active";
      item.rateLimitedUntil = null;
      keyPool.unshift(item);
      savePoolToFile(keyPool);
      return item;
    }
    return null;
  }

  /**
   * Reset a key's daily usage counters back to 0
   */
  static resetKeyUsage(keyId) {
    syncPool();
    const item = keyPool.find((k) => k.id === keyId || k.apiKey === keyId);
    if (item) {
      item.dailyRequests = 0;
      item.dailyTokens = 0;
      item.status = "active";
      item.rateLimitedUntil = null;
      item.lastError = null;
      savePoolToFile(keyPool);
      return item;
    }
    return null;
  }

  /**
   * Update configurable request and token limits for a key
   */
  static updateKeyLimits({ id, dailyCap, tokenCap }) {
    syncPool();
    const item = keyPool.find((k) => k.id === id || k.apiKey === id);
    if (item) {
      if (dailyCap !== undefined && Number(dailyCap) > 0) item.dailyCap = Number(dailyCap);
      if (tokenCap !== undefined && Number(tokenCap) > 0) item.tokenCap = Number(tokenCap);
      if (item.status === "limit_completed") {
        if ((item.dailyRequests || 0) < (item.dailyCap || 14400) && (item.dailyTokens || 0) < (item.tokenCap || 500000)) {
          item.status = "active";
        }
      }
      savePoolToFile(keyPool);
      return item;
    }
    return null;
  }

  /**
   * Record successful usage (tokens, request count) dynamically
   * If Key 1 reaches its limit, automatically marks it limit_completed so Key 2 takes over!
   */
  static recordSuccess(keyId, tokens = 0) {
    syncPool();
    const tok = Math.max(1, Number(tokens) || 50);

    // 1. Match by id, apiKey, maskedKey, or aliases
    let item = keyPool.find(
      (k) =>
        k.id === keyId ||
        k.apiKey === keyId ||
        k.maskedKey === keyId ||
        (keyId === "env_fallback" && k.id === "key_default_primary") ||
        keyId === "primary"
    );

    // 2. If generic "primary", pick whichever key is currently active & serving
    if (!item || keyId === "primary") {
      item = keyPool.find((k) => k.isActive && k.status !== "limit_completed" && k.status !== "error") || keyPool[0];
    }

    // 3. Fallback creation
    if (!item) {
      const envKey = (process.env.GROQ_API_KEY || "").trim();
      item = {
        id: "key_default_primary",
        label: "Primary Default Key",
        apiKey: envKey || "gsk_primary_auto",
        maskedKey: maskApiKey(envKey || "gsk_primary_auto"),
        isActive: true,
        status: "active",
        rateLimitedUntil: null,
        totalRequests: 0,
        totalTokens: 0,
        dailyRequests: 0,
        dailyTokens: 0,
        dailyCap: 14400,
        tokenCap: 500000,
        lastUsedAt: null,
        lastError: null,
        createdAt: new Date().toISOString(),
      };
      keyPool.push(item);
    }

    item.totalRequests = (item.totalRequests || 0) + 1;
    item.dailyRequests = (item.dailyRequests || 0) + 1;
    item.totalTokens = (item.totalTokens || 0) + tok;
    item.dailyTokens = (item.dailyTokens || 0) + tok;
    item.lastUsedAt = new Date().toISOString();

    // Check if this request completed the key's daily limit
    const dailyCap = item.dailyCap || 14400;
    const tokenCap = item.tokenCap || 500000;
    if (item.dailyRequests >= dailyCap || item.dailyTokens >= tokenCap) {
      item.status = "limit_completed";
      item.lastError = `Daily limit reached (${item.dailyRequests}/${dailyCap} req, ${item.dailyTokens}/${tokenCap} tok). Auto-switched to backup key.`;
      console.warn(`[GROQ_POOL] Key '${item.label}' COMPLETED its daily limit! Next request will automatically switch to backup key.`);
    } else {
      item.status = "active";
      item.lastError = null;
    }

    savePoolToFile(keyPool);
    console.log(`[GROQ_POOL] Success recorded for '${item.label}': +${tok} tokens, daily=${item.dailyTokens}/${tokenCap}, reqs=${item.dailyRequests}/${dailyCap}`);
    return item;
  }

  /**
   * Mark a key as rate limited (HTTP 429) with cooldown
   * Default cooldown: 60 seconds (for per-minute RPM reset)
   */
  static markRateLimited(keyId, cooldownSeconds = 60, errorMessage = "Rate limit reached (429)") {
    syncPool();
    const item = keyPool.find((k) => k.id === keyId || k.apiKey === keyId);
    if (item) {
      item.status = "rate_limited";
      item.rateLimitedUntil = Date.now() + cooldownSeconds * 1000;
      item.lastError = errorMessage;
      console.warn(`[GROQ_POOL] Key '${item.label}' (${item.maskedKey}) marked RATE_LIMITED for ${cooldownSeconds}s. Automatically failing over to next key...`);
      savePoolToFile(keyPool);
    }
  }

  /**
   * Mark a key as having an invalid credential or permanent error
   */
  static markError(keyId, errorMessage) {
    syncPool();
    const item = keyPool.find((k) => k.id === keyId || k.apiKey === keyId);
    if (item) {
      item.status = "error";
      item.lastError = errorMessage;
      savePoolToFile(keyPool);
    }
  }

  /**
   * Return complete pool status for Super Admin UI (masked keys for security)
   */
  static getPoolStats() {
    syncPool();
    const now = Date.now();

    const isKeyAvailable = (k) => {
      if (!k.isActive || k.status === "error") return false;
      if (k.rateLimitedUntil && k.rateLimitedUntil > now) return false;
      const dailyCap = k.dailyCap || 14400;
      const tokenCap = k.tokenCap || 500000;
      if ((k.dailyRequests || 0) >= dailyCap) return false;
      if ((k.dailyTokens || 0) >= tokenCap) return false;
      if (k.liveRemainingRequests !== null && k.liveRemainingRequests !== undefined && k.liveRemainingRequests <= 0) return false;
      if (k.liveRemainingTokens !== null && k.liveRemainingTokens !== undefined && k.liveRemainingTokens <= 0) return false;
      return true;
    };

    // Identify which single key is currently Active & Serving (must be available and not completed limit!)
    const activeServingKey = keyPool.find(isKeyAvailable) || null;
    const activeServingKeyId = activeServingKey ? activeServingKey.id : null;

    const keys = keyPool.map((k) => {
      const cooldownRemainingSec = k.rateLimitedUntil && k.rateLimitedUntil > now
        ? Math.round((k.rateLimitedUntil - now) / 1000)
        : 0;

      const dailyCap = k.dailyCap || 14400;
      const tokenCap = k.tokenCap || 500000;
      const dailyPercent = Math.min(100, Math.round(((k.dailyRequests || 0) / dailyCap) * 100));
      const tokenPercent = Math.min(100, Math.round(((k.dailyTokens || 0) / tokenCap) * 100));

      const isLimitCompleted = (k.dailyRequests || 0) >= dailyCap ||
        (k.dailyTokens || 0) >= tokenCap ||
        (k.liveRemainingRequests !== null && k.liveRemainingRequests !== undefined && k.liveRemainingRequests <= 0) ||
        (k.liveRemainingTokens !== null && k.liveRemainingTokens !== undefined && k.liveRemainingTokens <= 0);

      let poolRole = "disabled";
      if (k.isActive) {
        if (cooldownRemainingSec > 0 || k.status === "rate_limited") {
          poolRole = "rate_limited";
        } else if (k.status === "error") {
          poolRole = "error";
        } else if (isLimitCompleted) {
          poolRole = "limit_completed"; // Daily quota completed! Automatically passed to next key
        } else if (k.id === activeServingKeyId) {
          poolRole = "active_serving"; // Currently active & serving all traffic
        } else {
          poolRole = "standby"; // Closed / Standby (backup ready on deck)
        }
      }

      return {
        id: k.id,
        label: k.label,
        maskedKey: k.maskedKey,
        isActive: k.isActive,
        isServing: k.id === activeServingKeyId,
        poolRole,
        status: poolRole,
        cooldownRemainingSec,
        totalRequests: k.totalRequests || 0,
        totalTokens: k.totalTokens || 0,
        dailyRequests: k.dailyRequests || 0,
        dailyTokens: k.dailyTokens || 0,
        liveRemainingTokens: k.liveRemainingTokens || null,
        liveLimitTokens: k.liveLimitTokens || null,
        liveRemainingRequests: k.liveRemainingRequests || null,
        liveLimitRequests: k.liveLimitRequests || null,
        dailyCap,
        tokenCap,
        dailyPercent,
        tokenPercent,
        lastUsedAt: k.lastUsedAt,
        lastError: k.lastError,
        createdAt: k.createdAt,
      };
    });

    const activeKeysCount = activeServingKey ? 1 : 0; // Exactly 1 active serving key
    const standbyKeysCount = keys.filter((k) => k.poolRole === "standby").length;
    const rateLimitedKeysCount = keys.filter((k) => k.poolRole === "rate_limited").length;
    const limitCompletedKeysCount = keys.filter((k) => k.poolRole === "limit_completed").length;
    const totalDailyRequests = keys.reduce((sum, k) => sum + (k.dailyRequests || 0), 0);
    const totalDailyTokens = keys.reduce((sum, k) => sum + (k.dailyTokens || 0), 0);
    const totalAllTimeTokens = keys.reduce((sum, k) => sum + (k.totalTokens || 0), 0);
    const totalCapacityRequests = Math.max(14400, keys.filter((k) => k.isActive).length * 14400);
    const totalDailyTokenCapacity = Math.max(500000, keys.filter((k) => k.isActive).length * 500000);
    const remainingDailyTokens = Math.max(0, totalDailyTokenCapacity - totalDailyTokens);

    const activeServingKeyRequests = activeServingKey ? (activeServingKey.dailyRequests || 0) : 0;
    const activeServingKeyTokens = activeServingKey ? (activeServingKey.dailyTokens || 0) : 0;
    const activeServingKeyDailyCap = activeServingKey ? (activeServingKey.dailyCap || 14400) : 14400;
    const activeServingKeyTokenCap = activeServingKey ? (activeServingKey.tokenCap || 500000) : 500000;

    return {
      totalKeys: keys.length,
      activeKeysCount, // Exactly 1 Active Serving
      standbyKeysCount, // All other available keys are Standby Backup
      limitCompletedKeysCount, // Keys that completed their limit
      activeServingKey: activeServingKey ? { id: activeServingKey.id, label: activeServingKey.label, maskedKey: activeServingKey.maskedKey } : null,
      activeServingKeyRequests,
      activeServingKeyTokens,
      activeServingKeyDailyCap,
      activeServingKeyTokenCap,
      activeServingKeyRemainingRequests: Math.max(0, activeServingKeyDailyCap - activeServingKeyRequests),
      activeServingKeyRemainingTokens: Math.max(0, activeServingKeyTokenCap - activeServingKeyTokens),
      rateLimitedKeysCount,
      totalDailyRequests,
      totalDailyTokens,
      totalDailyTokenCapacity,
      remainingDailyTokens,
      overallTokenPercent: Math.min(100, Math.round((totalDailyTokens / totalDailyTokenCapacity) * 100)),
      totalAllTimeTokens,
      totalTokens: totalAllTimeTokens,
      groqConsoleTokens: totalAllTimeTokens,
      groqConsoleUrl: "https://console.groq.com/settings/organization/usage",
      totalCapacityRequests,
      overallDailyPercent: Math.min(100, Math.round((totalDailyRequests / totalCapacityRequests) * 100)),
      keys,
      lastSyncTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Update live rate limits & remaining quota reported by Groq response headers
   */
  static updateLiveLimits(keyId, { remainingTokens, limitTokens, remainingRequests, limitRequests }) {
    syncPool();
    let item = keyPool.find((k) => k.id === keyId || k.apiKey === keyId) || keyPool[0];
    if (item) {
      if (remainingTokens) item.liveRemainingTokens = Number(remainingTokens);
      if (limitTokens) item.liveLimitTokens = Number(limitTokens);
      if (remainingRequests) item.liveRemainingRequests = Number(remainingRequests);
      if (limitRequests) item.liveLimitRequests = Number(limitRequests);
      savePoolToFile(keyPool);
    }
  }

  /**
   * Calibrate or set Groq Console usage baseline
   */
  static syncGroqBaseline(keyId, baselineTokens) {
    syncPool();
    const tok = Math.max(0, Number(baselineTokens) || 6100);
    let item = keyPool.find((k) => k.id === keyId || k.apiKey === keyId) || keyPool[0];
    if (item) {
      item.totalTokens = tok;
      savePoolToFile(keyPool);
      return item;
    }
    return null;
  }

  /**
   * Add a new API key to pool
   */
  static addKey({ label, apiKey }) {
    syncPool();
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
    savePoolToFile(keyPool);
    return newEntry;
  }

  /**
   * Toggle key active / inactive
   */
  static toggleKey(id, isActive) {
    syncPool();
    const item = keyPool.find((k) => k.id === id);
    if (!item) throw new Error("Key not found");
    item.isActive = Boolean(isActive);
    savePoolToFile(keyPool);
    return item;
  }

  /**
   * Reset rate-limit status for a key manually
   */
  static resetKeyStatus(id) {
    syncPool();
    const item = keyPool.find((k) => k.id === id);
    if (!item) throw new Error("Key not found");
    item.status = "active";
    item.rateLimitedUntil = null;
    item.lastError = null;
    savePoolToFile(keyPool);
    return item;
  }

  /**
   * Remove a key from pool
   */
  static removeKey(id) {
    syncPool();
    const index = keyPool.findIndex((k) => k.id === id);
    if (index === -1) throw new Error("Key not found");
    const removed = keyPool.splice(index, 1)[0];
    savePoolToFile(keyPool);
    return removed;
  }
}

