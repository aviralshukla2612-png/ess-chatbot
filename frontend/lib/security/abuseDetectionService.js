/**
 * Enterprise Abuse Detection, IP/Visitor Reputation, and Traffic Management Service
 *
 * Capabilities:
 * 1. Repetitive message spam detection (cryptographic content fingerprinting)
 * 2. Multi-tier progressive cooldowns on repeated rate-limit violations
 * 3. IP & Visitor automated / administrative temporary blocklist (Redis + in-memory fallback)
 * 4. Bot & anomalous traffic risk scoring (heuristics, burst timing, user-agent analysis)
 * 5. Security audit logging & ring buffer for Admin monitoring
 */

import crypto from "crypto";
import { getRedisClient, isRedisConnected } from "../redis/redisClient.js";
import { queryDb } from "../db/dbPool.js";

// In-memory ring buffer for recent abuse events (kept at max 1,000 items)
const MAX_EVENT_LOG_SIZE = 1000;
const abuseEventsLog = [];

// Local in-memory store for active blocks: Map<string, { reason: string, expiresAt: number, blockedBy: string }>
const memoryBlocks = new Map();

// Local in-memory store for recent message hashes: Map<string, Array<{ hash: string, time: number }>>
const memoryMessageHashes = new Map();

// Local in-memory violation counter for progressive cooldowns: Map<string, { count: number, lastViolation: number, cooldownUntil: number }>
const memoryViolations = new Map();

// Progressive cooldown penalty tiers (in seconds)
const COOLDOWN_TIERS = [
  60,       // Tier 1: 1 minute
  5 * 60,   // Tier 2: 5 minutes
  30 * 60,  // Tier 3: 30 minutes
  2 * 3600, // Tier 4: 2 hours
];

function nowMs() {
  return Date.now();
}

/**
 * Normalizes and hashes message text for duplicate spam detection.
 */
export function hashMessageContent(text = "") {
  const normalized = (typeof text === "string" ? text : "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

export const abuseDetectionService = {
  /**
   * 1. Detect repetitive identical message flooding.
   * If a subject (visitor or conversation) sends the exact same message >= 3 times within 10 seconds, reject it.
   */
  async checkRepetitiveMessage(subjectKey, rawMessage) {
    if (!subjectKey || !rawMessage) return { allowed: true };
    const hash = hashMessageContent(rawMessage);
    const now = nowMs();
    const windowMs = 10000; // 10-second window
    const maxIdentical = 3;

    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        const redisKey = `abuse:hash:${subjectKey}`;
        // Store hash and score
        await redis.zremrangebyscore(redisKey, "-inf", now - windowMs);
        const existingEntries = await redis.zrange(redisKey, 0, -1, "WITHSCORES");

        let matchCount = 0;
        for (let i = 0; i < existingEntries.length; i += 2) {
          const val = existingEntries[i];
          if (val.startsWith(hash)) {
            matchCount++;
          }
        }

        if (matchCount >= maxIdentical - 1) {
          await this.logSecurityEvent({
            type: "REPETITIVE_MESSAGE_SPAM",
            severity: "MEDIUM",
            subjectType: "VISITOR",
            subjectKey,
            actionTaken: "THROTTLED",
            details: `Identical message submitted ${matchCount + 1} times within 10s.`,
          });
          return {
            allowed: false,
            reason: "REPETITIVE_MESSAGE",
            message: "You're sending repetitive messages too quickly. Please wait a moment before trying again.",
            retrySec: 8,
          };
        }

        const memberId = `${hash}:${now}:${crypto.randomBytes(2).toString("hex")}`;
        await redis.zadd(redisKey, now, memberId);
        await redis.pexpire(redisKey, windowMs);
        return { allowed: true };
      } catch {
        // Fallback to memory below
      }
    }

    // Memory fallback
    let list = memoryMessageHashes.get(subjectKey);
    if (!list) {
      list = [];
      memoryMessageHashes.set(subjectKey, list);
    }

    // Purge expired
    list = list.filter((item) => now - item.time < windowMs);
    memoryMessageHashes.set(subjectKey, list);

    const matchCount = list.filter((item) => item.hash === hash).length;
    if (matchCount >= maxIdentical - 1) {
      await this.logSecurityEvent({
        type: "REPETITIVE_MESSAGE_SPAM",
        severity: "MEDIUM",
        subjectType: "VISITOR",
        subjectKey,
        actionTaken: "THROTTLED",
        details: `Identical message submitted ${matchCount + 1} times within 10s.`,
      });
      return {
        allowed: false,
        reason: "REPETITIVE_MESSAGE",
        message: "You're sending repetitive messages too quickly. Please wait a moment before trying again.",
        retrySec: 8,
      };
    }

    list.push({ hash, time: now });
    return { allowed: true };
  },

  /**
   * 2. Progressive Cooldowns on Repeated Rate Limit Violations.
   * Escalates penalty duration if violations reoccur within 15 minutes.
   */
  async recordViolationAndGetCooldown(subjectKey, subjectType = "ip") {
    const now = nowMs();
    const violationWindowMs = 15 * 60 * 1000; // 15-minute escalation memory
    const redis = getRedisClient();

    let count = 1;

    if (redis && isRedisConnected()) {
      try {
        const key = `abuse:violations:${subjectType}:${subjectKey}`;
        count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, Math.ceil(violationWindowMs / 1000));
        }
      } catch {
        count = 1;
      }
    } else {
      let record = memoryViolations.get(subjectKey);
      if (!record || now - record.lastViolation > violationWindowMs) {
        record = { count: 1, lastViolation: now, cooldownUntil: 0 };
      } else {
        record.count++;
        record.lastViolation = now;
      }
      count = record.count;
      memoryViolations.set(subjectKey, record);
    }

    // Determine cooldown tier: 1st violation = Tier 0, 2nd = Tier 1, 3rd = Tier 2, etc.
    const tierIdx = Math.min(count - 1, COOLDOWN_TIERS.length - 1);
    const cooldownSec = COOLDOWN_TIERS[tierIdx];
    const cooldownUntil = now + cooldownSec * 1000;

    if (count >= 2) {
      // Escalate to active temporary block
      await this.blockSubject({
        type: subjectType,
        key: subjectKey,
        durationSec: cooldownSec,
        reason: `Progressive cooldown (Tier ${tierIdx + 1}): Repeated rate-limit violations (${count} times).`,
        blockedBy: "AUTOMATED_SYSTEM",
      });
    }

    return {
      violationCount: count,
      tier: tierIdx + 1,
      cooldownSec,
      cooldownUntil,
    };
  },

  /**
   * 3. Check if an IP or Visitor is currently blocked.
   */
  async isSubjectBlocked(type, key) {
    if (!type || !key) return { blocked: false };
    const cleanKey = String(key).trim();
    const cleanType = String(type).toLowerCase();
    const now = nowMs();

    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        const blockVal = await redis.get(`abuse:block:${cleanType}:${cleanKey}`);
        if (blockVal) {
          const parsed = JSON.parse(blockVal);
          if (!parsed.expiresAt || parsed.expiresAt > now) {
            const retrySec = parsed.expiresAt ? Math.max(1, Math.ceil((parsed.expiresAt - now) / 1000)) : 3600;
            return {
              blocked: true,
              reason: parsed.reason || "Temporarily restricted due to abusive activity.",
              expiresAt: parsed.expiresAt || null,
              retrySec,
              blockedBy: parsed.blockedBy || "SYSTEM",
            };
          }
        }
      } catch {
        // Fallback to memory below
      }
    }

    const memBlock = memoryBlocks.get(`${cleanType}:${cleanKey}`);
    if (memBlock) {
      if (!memBlock.expiresAt || memBlock.expiresAt > now) {
        const retrySec = memBlock.expiresAt ? Math.max(1, Math.ceil((memBlock.expiresAt - now) / 1000)) : 3600;
        return {
          blocked: true,
          reason: memBlock.reason || "Temporarily restricted due to abusive activity.",
          expiresAt: memBlock.expiresAt || null,
          retrySec,
          blockedBy: memBlock.blockedBy || "SYSTEM",
        };
      } else {
        memoryBlocks.delete(`${cleanType}:${cleanKey}`);
      }
    }

    return { blocked: false };
  },

  /**
   * 4. Temporarily or permanently block a subject (IP, visitor, or user).
   */
  async blockSubject({ type, key, durationSec = 3600, reason = "Excessive traffic / abuse", blockedBy = "ADMIN" }) {
    if (!type || !key) return false;
    const cleanKey = String(key).trim();
    const cleanType = String(type).toLowerCase();
    const now = nowMs();
    const expiresAt = durationSec > 0 ? now + durationSec * 1000 : null;

    const blockData = {
      type: cleanType,
      key: cleanKey,
      reason,
      blockedBy,
      blockedAt: now,
      expiresAt,
    };

    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        const redisKey = `abuse:block:${cleanType}:${cleanKey}`;
        if (durationSec > 0) {
          await redis.setex(redisKey, durationSec, JSON.stringify(blockData));
        } else {
          await redis.set(redisKey, JSON.stringify(blockData));
        }
      } catch {}
    }

    memoryBlocks.set(`${cleanType}:${cleanKey}`, blockData);

    await this.logSecurityEvent({
      type: "SUBJECT_BLOCKED",
      severity: "HIGH",
      subjectType: cleanType.toUpperCase(),
      subjectKey: cleanKey,
      actionTaken: "BLOCKED",
      details: `${reason} (Duration: ${durationSec > 0 ? `${durationSec}s` : "permanent"}, By: ${blockedBy})`,
    });

    return true;
  },

  /**
   * 5. Unblock a subject.
   */
  async unblockSubject({ type, key, unblockedBy = "ADMIN" }) {
    if (!type || !key) return false;
    const cleanKey = String(key).trim();
    const cleanType = String(type).toLowerCase();

    const redis = getRedisClient();
    if (redis && isRedisConnected()) {
      try {
        await redis.del(`abuse:block:${cleanType}:${cleanKey}`);
        await redis.del(`abuse:violations:${cleanType}:${cleanKey}`);
      } catch {}
    }

    memoryBlocks.delete(`${cleanType}:${cleanKey}`);
    memoryViolations.delete(cleanKey);

    await this.logSecurityEvent({
      type: "SUBJECT_UNBLOCKED",
      severity: "INFO",
      subjectType: cleanType.toUpperCase(),
      subjectKey: cleanKey,
      actionTaken: "UNBLOCKED",
      details: `Restriction lifted by ${unblockedBy}.`,
    });

    return true;
  },

  /**
   * 6. Analyze request for bot / flood risk score.
   */
  calculateRiskScore({ request, message, previousArrivalAt = 0 }) {
    let score = 0;
    const flags = [];
    const now = nowMs();

    // Check User-Agent
    const ua = request?.headers?.get?.("user-agent") || "";
    if (!ua) {
      score += 30;
      flags.push("MISSING_USER_AGENT");
    } else if (/(curl|wget|python|postman|insomnia|headless|bot|spider|crawl)/i.test(ua)) {
      score += 40;
      flags.push("AUTOMATED_CLIENT_UA");
    }

    // Rapid submission (< 400ms interval since prior turn)
    if (previousArrivalAt > 0 && now - previousArrivalAt < 400) {
      score += 35;
      flags.push("SUB_SECOND_BURST");
    }

    // Message characteristics
    if (typeof message === "string") {
      if (message.length > 3000) {
        score += 15;
        flags.push("LONG_MESSAGE_BURDEN");
      }
      // High repetition of single characters (e.g., "aaaaaaaaaaaaaaaa")
      if (/(.)\1{20,}/.test(message)) {
        score += 25;
        flags.push("CHARACTER_REPETITION");
      }
    }

    const clampedScore = Math.min(100, score);
    let riskLevel = "LOW";
    let action = "ALLOW";

    if (clampedScore >= 75) {
      riskLevel = "CRITICAL";
      action = "BLOCK";
    } else if (clampedScore >= 50) {
      riskLevel = "HIGH";
      action = "THROTTLE";
    } else if (clampedScore >= 25) {
      riskLevel = "MEDIUM";
      action = "MONITOR";
    }

    return {
      score: clampedScore,
      riskLevel,
      action,
      flags,
    };
  },

  /**
   * 7. Record an abuse / security event.
   */
  async logSecurityEvent(eventData) {
    const entry = {
      id: `evt_${nowMs()}_${crypto.randomBytes(3).toString("hex")}`,
      timestamp: new Date().toISOString(),
      type: eventData.type || "SECURITY_ALERT",
      severity: eventData.severity || "INFO",
      subjectType: eventData.subjectType || "UNKNOWN",
      subjectKey: eventData.subjectKey ? String(eventData.subjectKey).slice(0, 120) : "N/A",
      actionTaken: eventData.actionTaken || "LOGGED",
      details: eventData.details || "",
    };

    // Maintain in-memory ring buffer
    abuseEventsLog.unshift(entry);
    if (abuseEventsLog.length > MAX_EVENT_LOG_SIZE) {
      abuseEventsLog.pop();
    }

    // Asynchronously log to PostgreSQL AuditLog (non-blocking)
    try {
      queryDb(
        `INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "resourceType", "resourceId", "ipAddress", "metadata")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING;`,
        [
          entry.id,
          eventData.organizationId || "org_system",
          null,
          entry.type,
          entry.subjectType,
          entry.subjectKey,
          eventData.ipAddress || null,
          JSON.stringify({ severity: entry.severity, action: entry.actionTaken, details: entry.details }),
        ]
      ).catch(() => {});
    } catch {}

    return entry;
  },

  /**
   * 8. Query recent security events for the Admin dashboard.
   */
  getRecentAbuseEvents(limit = 50) {
    return abuseEventsLog.slice(0, Math.min(limit, MAX_EVENT_LOG_SIZE));
  },

  /**
   * 9. Query summary statistics for the Admin dashboard.
   */
  getAbuseSummary() {
    const totalEvents = abuseEventsLog.length;
    const throttled = abuseEventsLog.filter((e) => e.actionTaken === "THROTTLED").length;
    const blocked = abuseEventsLog.filter((e) => e.actionTaken === "BLOCKED").length;
    const highRisk = abuseEventsLog.filter((e) => e.severity === "HIGH" || e.severity === "CRITICAL").length;

    return {
      totalRecordedEvents: totalEvents,
      throttledCount: throttled,
      blockedCount: blocked,
      highRiskCount: highRisk,
      activeMemoryBlocks: memoryBlocks.size,
    };
  },

  /**
   * 10. Query currently blocked entities.
   */
  getBlockedList() {
    const now = nowMs();
    const list = [];
    for (const [key, data] of memoryBlocks.entries()) {
      if (!data.expiresAt || data.expiresAt > now) {
        list.push({
          ...data,
          remainingSec: data.expiresAt ? Math.max(1, Math.ceil((data.expiresAt - now) / 1000)) : null,
        });
      }
    }
    return list;
  },

  /**
   * Test helper: Reset memory.
   */
  _resetAbuseMemory() {
    abuseEventsLog.length = 0;
    memoryBlocks.clear();
    memoryMessageHashes.clear();
    memoryViolations.clear();
  },
};
