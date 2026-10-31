/**
 * Groq Key Pool Manager
 * Manages multiple Groq API keys with:
 * - Sequential Token Rotation: Key 1 serves until token completed -> switches to Key 2 -> 3 -> 4 -> 5 -> 6 -> loops back to 1
 * - Automatic 429 / Rate Limit / Token Cap failover to next key in sequence
 * - Auto-recycling: when all keys in pool finish their limits, cycle automatically restarts from Key 1
 * - Real-time stats & live tracking for Super Admin dashboard
 * - Dual persistence (groq_keys_pool.json & groq_keys_pool.persistent.json)
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
let poolCycleCount = 1;
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

  // If persistent file has more keys, preserve and self-heal
  if (persistentKeys && (!primaryKeys || persistentKeys.length > primaryKeys.length)) {
    try {
      fs.writeFileSync(primaryFile, JSON.stringify(persistentKeys, null, 2), "utf8");
    } catch {}
    return persistentKeys;
  }

  if (primaryKeys && primaryKeys.length > 0) {
    if (persistentKeys && persistentKeys.length > 0) {
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
    label: "Primary Groq Account",
    apiKey: validKey,
    maskedKey: maskApiKey(validKey),
    isActive: true,
    isServing: true,
    status: "active",
    rateLimitedUntil: null,
    totalRequests: 5,
    totalTokens: 6600,
    dailyRequests: 5,
    dailyTokens: 6600,
    dailyCap: 14400,
    tokenCap: 500000,
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
      if (k.status === "limit_completed" || k.status === "rate_limited") {
        k.status = "active";
        k.rateLimitedUntil = null;
        k.lastError = null;
      }
    }
    // Ensure key 1 is serving on daily reset
    if (keyPool.length > 0) {
      keyPool.forEach((k, idx) => {
        k.isServing = (idx === 0);
      });
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

  // Calibrate baseline tokens for primary key if needed
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
    if (primaryKey.status === "error" && primaryKey.apiKey && primaryKey.apiKey.length > 15) {
      primaryKey.status = "active";
      primaryKey.lastError = null;
      calibrated = true;
    }
  }

  // Ensure default limits on each key
  for (const k of keyPool) {
    if (!k.dailyCap) k.dailyCap = 14400;
    if (!k.tokenCap) k.tokenCap = 500000;
  }

  // Ensure at least one key has isServing flag if there are active keys
  const hasServing = keyPool.some((k) => k.isServing && k.isActive && k.status !== "error");
  if (!hasServing && keyPool.length > 0) {
    const firstActiveIdx = keyPool.findIndex((k) => k.isActive && k.status !== "error" && k.status !== "limit_completed");
    const pickIdx = firstActiveIdx !== -1 ? firstActiveIdx : 0;
    keyPool.forEach((k, i) => {
      k.isServing = (i === pickIdx);
    });
    calibrated = true;
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
   * Helper: Check if a key is exhausted / completed for the current rotation round
   */
  static _isKeyCompleted(k, now = Date.now()) {
    if (!k.isActive || k.status === "error") return true;
    if (k.status === "limit_completed") return true;
    if (k.rateLimitedUntil && k.rateLimitedUntil > now) return true;
    const dailyCap = k.dailyCap || 14400;
    const tokenCap = k.tokenCap || 500000;
    if ((k.dailyRequests || 0) >= dailyCap) return true;
    if ((k.dailyTokens || 0) >= tokenCap) return true;
    return false;
  }

  /**
   * Core Sequential Token Rotation:
   * Key 1 serves until token completed -> switches to 2 -> 3 -> 4 -> 5 -> 6 -> loops back to 1!
   */
  static getNextKey() {
    syncPool();
    const now = Date.now();

    // 1. Refresh any keys whose cooldown expired
    for (const k of keyPool) {
      if (k.rateLimitedUntil && k.rateLimitedUntil <= now) {
        k.rateLimitedUntil = null;
        if (k.status === "rate_limited") {
          k.status = "active";
        }
      }
    }

    const totalKeys = keyPool.length;
    if (totalKeys === 0) {
      const envKey = (process.env.GROQ_API_KEY || "").trim();
      return envKey ? { id: "env_key", label: "Env Key", apiKey: envKey, maskedKey: maskApiKey(envKey) } : null;
    }

    // 2. Locate the current serving key index
    let servingIdx = keyPool.findIndex((k) => k.isServing && k.isActive && k.status !== "error");

    // 3. If currently designated serving key is exhausted / rate-limited / completed:
    if (servingIdx === -1 || GroqKeyPoolManager._isKeyCompleted(keyPool[servingIdx], now)) {
      const fromIdx = servingIdx >= 0 ? servingIdx : 0;
      let nextAvailableIdx = -1;

      // Scan sequentially forward: (fromIdx + 1), (fromIdx + 2), ..., wrapping around
      for (let offset = 1; offset <= totalKeys; offset++) {
        const candidateIdx = (fromIdx + offset) % totalKeys;
        const candidate = keyPool[candidateIdx];
        if (!GroqKeyPoolManager._isKeyCompleted(candidate, now)) {
          nextAvailableIdx = candidateIdx;
          break;
        }
      }

      // If NO key in pool is currently unexhausted, all keys (1, 2, 3, 4, 5, 6) have completed!
      // AUTO-RECYCLE: Reset cycle and start again from Key #1!
      if (nextAvailableIdx === -1) {
        console.warn(`[GROQ_POOL] All ${totalKeys} keys completed their limits! Auto-recycling pool back to Key #1 (Cycle ${poolCycleCount + 1})...`);
        poolCycleCount++;
        for (const k of keyPool) {
          if (k.isActive && k.status !== "error") {
            k.status = "active";
            k.rateLimitedUntil = null;
            k.lastError = null;
            // Reset daily counts for the new cycle
            k.dailyRequests = 0;
            k.dailyTokens = 0;
          }
        }
        // First active key becomes serving
        const firstActive = keyPool.findIndex((k) => k.isActive && k.status !== "error");
        nextAvailableIdx = firstActive !== -1 ? firstActive : 0;
      }

      // Advance isServing flag to the new active key
      for (let i = 0; i < totalKeys; i++) {
        keyPool[i].isServing = (i === nextAvailableIdx);
      }
      servingIdx = nextAvailableIdx;
      savePoolToFile(keyPool);

      const newKey = keyPool[servingIdx];
      console.log(`[GROQ_POOL] Active serving key switched to: #${servingIdx + 1} '${newKey.label}' (${newKey.maskedKey})`);
    }

    return keyPool[servingIdx];
  }

  /**
   * Mark a key as Token Completed (via 429 rate limit or token exhaustion)
   * Immediately advances Active Serving Key to the next key in sequence:
   * Key 1 -> Key 2 -> Key 3 -> Key 4 -> Key 5 -> Key 6 -> Key 1
   */
  static markTokenCompleted(keyId, reason = "Token limit reached", cooldownSeconds = 60) {
    syncPool();
    const now = Date.now();
    const currentIdx = keyPool.findIndex((k) => k.id === keyId || k.apiKey === keyId);

    if (currentIdx !== -1) {
      const item = keyPool[currentIdx];
      item.status = "limit_completed";
      item.isServing = false;
      item.rateLimitedUntil = now + (cooldownSeconds * 1000);
      item.lastError = reason;

      console.warn(`[GROQ_POOL] Key #${currentIdx + 1} '${item.label}' token completed (${reason}). Advancing to next key in pool...`);

      // Find next healthy key in forward sequence
      let nextIdx = -1;
      for (let offset = 1; offset <= keyPool.length; offset++) {
        const candidateIdx = (currentIdx + offset) % keyPool.length;
        const candidate = keyPool[candidateIdx];
        if (candidate.isActive && candidate.status !== "error" && candidate.status !== "limit_completed") {
          nextIdx = candidateIdx;
          break;
        }
      }

      // If all keys in pool reached limit, recycle back to Key #1!
      if (nextIdx === -1) {
        console.warn(`[GROQ_POOL] All keys completed! Auto-recycling: restarting cycle at Key #1...`);
        poolCycleCount++;
        for (const k of keyPool) {
          if (k.isActive && k.status !== "error") {
            k.status = "active";
            k.rateLimitedUntil = null;
            k.dailyRequests = 0;
            k.dailyTokens = 0;
            k.lastError = null;
          }
        }
        const firstActive = keyPool.findIndex((k) => k.isActive && k.status !== "error");
        nextIdx = firstActive !== -1 ? firstActive : 0;
      }

      // Designate next key as the exclusive serving key
      for (let i = 0; i < keyPool.length; i++) {
        keyPool[i].isServing = (i === nextIdx);
      }

      savePoolToFile(keyPool);
      const nextKey = keyPool[nextIdx];
      console.log(`[GROQ_POOL] Failover successful! New serving key: #${nextIdx + 1} '${nextKey.label}'`);
      return nextKey;
    }
    return null;
  }

  /**
   * Mark a key as rate limited (HTTP 429) with cooldown
   * Automatically advances to the next key in rotation!
   */
  static markRateLimited(keyId, cooldownSeconds = 60, errorMessage = "Rate limit reached (429)") {
    return GroqKeyPoolManager.markTokenCompleted(keyId, errorMessage, cooldownSeconds);
  }

  /**
   * Mark a key as having an invalid credential or permanent error
   * Advances active serving to next key if this key was serving
   */
  static markError(keyId, errorMessage) {
    syncPool();
    const idx = keyPool.findIndex((k) => k.id === keyId || k.apiKey === keyId);
    if (idx !== -1) {
      const item = keyPool[idx];
      item.status = "error";
      item.lastError = errorMessage;

      if (item.isServing) {
        item.isServing = false;
        // Advance to next key
        let nextIdx = -1;
        for (let offset = 1; offset <= keyPool.length; offset++) {
          const cIdx = (idx + offset) % keyPool.length;
          const candidate = keyPool[cIdx];
          if (candidate.isActive && candidate.status !== "error") {
            nextIdx = cIdx;
            break;
          }
        }
        if (nextIdx !== -1) {
          keyPool[nextIdx].isServing = true;
        }
      }

      savePoolToFile(keyPool);
    }
  }

  /**
   * Promote a key to immediate Active Serving position
   * Preserves natural list order: key becomes the active serving key and sequence continues from it!
   */
  static setPrimaryKey(keyId) {
    syncPool();
    const targetIdx = keyPool.findIndex((k) => k.id === keyId || k.apiKey === keyId);
    if (targetIdx !== -1) {
      for (let i = 0; i < keyPool.length; i++) {
        if (i === targetIdx) {
          keyPool[i].isActive = true;
          keyPool[i].isServing = true;
          keyPool[i].status = "active";
          keyPool[i].rateLimitedUntil = null;
        } else {
          keyPool[i].isServing = false;
        }
      }
      savePoolToFile(keyPool);
      return keyPool[targetIdx];
    }
    return null;
  }

  /**
   * Manually restart the rotation cycle from Key #1
   */
  static restartCycle() {
    syncPool();
    poolCycleCount++;
    for (let i = 0; i < keyPool.length; i++) {
      const k = keyPool[i];
      if (k.isActive && k.status !== "error") {
        k.status = "active";
        k.rateLimitedUntil = null;
        k.dailyRequests = 0;
        k.dailyTokens = 0;
        k.lastError = null;
      }
      k.isServing = (i === 0);
    }
    savePoolToFile(keyPool);
    return GroqKeyPoolManager.getPoolStats();
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
   * If a key completes its tokenCap or dailyCap, automatically triggers rotation to next key!
   */
  static recordSuccess(keyId, tokens = 0) {
    syncPool();
    const tok = Math.max(1, Number(tokens) || 50);

    // Match serving key or keyId
    let item = keyPool.find(
      (k) =>
        k.id === keyId ||
        k.apiKey === keyId ||
        k.maskedKey === keyId ||
        (keyId === "primary" && k.isServing)
    );

    if (!item) {
      item = keyPool.find((k) => k.isServing) || keyPool.find((k) => k.isActive && k.status !== "error") || keyPool[0];
    }

    if (!item) return null;

    item.totalRequests = (item.totalRequests || 0) + 1;
    item.dailyRequests = (item.dailyRequests || 0) + 1;
    item.totalTokens = (item.totalTokens || 0) + tok;
    item.dailyTokens = (item.dailyTokens || 0) + tok;
    item.lastUsedAt = new Date().toISOString();

    // Check if this request completed the key's token limit
    const dailyCap = item.dailyCap || 14400;
    const tokenCap = item.tokenCap || 500000;
    if (item.dailyRequests >= dailyCap || item.dailyTokens >= tokenCap) {
      GroqKeyPoolManager.markTokenCompleted(
        item.id,
        `Token limit reached (${item.dailyTokens}/${tokenCap} tok, ${item.dailyRequests}/${dailyCap} req). Auto-switched to next key.`,
        60
      );
    } else {
      if (item.status !== "limit_completed") {
        item.status = "active";
      }
      savePoolToFile(keyPool);
    }

    console.log(`[GROQ_POOL] Success on '${item.label}': +${tok} tok, daily=${item.dailyTokens}/${tokenCap}, reqs=${item.dailyRequests}/${dailyCap}`);
    return item;
  }

  /**
   * Return complete pool status for Super Admin UI (masked keys for security)
   */
  static getPoolStats() {
    syncPool();
    const now = Date.now();

    // Find the currently active serving key
    let servingIdx = keyPool.findIndex((k) => k.isServing && k.isActive && k.status !== "error");
    if (servingIdx === -1) {
      servingIdx = keyPool.findIndex((k) => k.isActive && k.status !== "error" && k.status !== "limit_completed");
      if (servingIdx === -1) servingIdx = 0;
    }

    const activeServingKey = keyPool[servingIdx] || null;
    const activeServingKeyId = activeServingKey ? activeServingKey.id : null;

    // Identify the next standby key in sequence
    let nextServingIdx = -1;
    for (let offset = 1; offset < keyPool.length; offset++) {
      const idx = (servingIdx + offset) % keyPool.length;
      const candidate = keyPool[idx];
      if (candidate.isActive && candidate.status !== "error" && candidate.status !== "limit_completed") {
        nextServingIdx = idx;
        break;
      }
    }
    const nextServingKey = nextServingIdx !== -1 ? keyPool[nextServingIdx] : null;

    const keys = keyPool.map((k, idx) => {
      const cooldownRemainingSec = k.rateLimitedUntil && k.rateLimitedUntil > now
        ? Math.round((k.rateLimitedUntil - now) / 1000)
        : 0;

      const dailyCap = k.dailyCap || 14400;
      const tokenCap = k.tokenCap || 500000;
      const dailyPercent = Math.min(100, Math.round(((k.dailyRequests || 0) / dailyCap) * 100));
      const tokenPercent = Math.min(100, Math.round(((k.dailyTokens || 0) / tokenCap) * 100));

      const isServing = k.id === activeServingKeyId;

      let poolRole = "disabled";
      if (k.isActive) {
        if (k.status === "error") {
          poolRole = "error";
        } else if (k.status === "limit_completed") {
          poolRole = "limit_completed"; // Token completed, handed off to next key!
        } else if (cooldownRemainingSec > 0 || k.status === "rate_limited") {
          poolRole = "rate_limited";
        } else if (isServing) {
          poolRole = "active_serving"; // Currently active & serving traffic
        } else {
          poolRole = "standby"; // Ready in rotation sequence
        }
      }

      return {
        id: k.id,
        sequenceNum: idx + 1,
        label: k.label,
        maskedKey: k.maskedKey,
        isActive: k.isActive,
        isServing,
        poolRole,
        status: poolRole,
        cooldownRemainingSec,
        totalRequests: k.totalRequests || 0,
        totalTokens: k.totalTokens || 0,
        dailyRequests: k.dailyRequests || 0,
        dailyTokens: k.dailyTokens || 0,
        liveRemainingTokens: k.liveRemainingTokens || null,
        liveLimitTokens: k.liveLimitTokens || null,
        dailyCap,
        tokenCap,
        dailyPercent,
        tokenPercent,
        lastUsedAt: k.lastUsedAt,
        lastError: k.lastError,
        createdAt: k.createdAt,
      };
    });

    const activeKeysCount = activeServingKey ? 1 : 0;
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
      activeKeysCount,
      standbyKeysCount,
      limitCompletedKeysCount,
      currentServingIndex: servingIdx + 1,
      cycleCount: poolCycleCount,
      activeServingKey: activeServingKey
        ? { id: activeServingKey.id, sequenceNum: servingIdx + 1, label: activeServingKey.label, maskedKey: activeServingKey.maskedKey }
        : null,
      nextServingKey: nextServingKey
        ? { id: nextServingKey.id, sequenceNum: nextServingIdx + 1, label: nextServingKey.label, maskedKey: nextServingKey.maskedKey }
        : null,
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
      if (remainingTokens !== undefined) item.liveRemainingTokens = Number(remainingTokens);
      if (limitTokens !== undefined) item.liveLimitTokens = Number(limitTokens);
      if (remainingRequests !== undefined) item.liveRemainingRequests = Number(remainingRequests);
      if (limitRequests !== undefined) item.liveLimitRequests = Number(limitRequests);
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
      isServing: keyPool.length === 0, // First key is active serving by default
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
    if (!item.isActive && item.isServing) {
      item.isServing = false;
      const nextAvailable = keyPool.find((k) => k.id !== id && k.isActive && k.status !== "error");
      if (nextAvailable) nextAvailable.isServing = true;
    }
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
    const [removed] = keyPool.splice(index, 1);
    if (removed.isServing && keyPool.length > 0) {
      const next = keyPool.find((k) => k.isActive && k.status !== "error") || keyPool[0];
      next.isServing = true;
    }
    savePoolToFile(keyPool);
    return removed;
  }
}
