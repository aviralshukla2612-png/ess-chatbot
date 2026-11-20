/**
 * Reliable Asynchronous OTP Dispatch Queue
 *
 * Implements an enterprise-grade, durable asynchronous job queue backed by
 * Redis Streams with Consumer Groups (XREADGROUP / XACK / XAUTOCLAIM),
 * automatic crash recovery, bounded exponential backoff retries, dead-letter
 * handling (DLQ), sanitized logging, and strict production fail-closed semantics.
 *
 * Architecture:
 * - Distributed (Production): Redis Streams (stream:otp_dispatch) with consumer group (group:otp_workers).
 * - Consumer Acknowledgement: XACK called ONLY after message processing succeeds or is moved to DLQ.
 * - Crash Recovery: XAUTOCLAIM / XPENDING recovery for stale in-flight jobs (>10s idle).
 * - Failure Classification: Transient provider errors retried up to MAX_RETRIES (3); permanent errors dead-lettered immediately.
 * - Dead-Letter Queue (DLQ): stream:otp_dispatch:dlq for post-mortem analysis and operational alerting.
 * - Idempotency: Protects against duplicate SMS dispatch using phone cooldown checks and deduplication guards.
 * - Sanitized Logging: Never logs OTP codes, unmasked phone numbers, or credentials.
 * - Durability Guard: Local volatile memory queue is strictly forbidden in production.
 */

import crypto from "crypto";
import { getRedisClient, isRedisConnected, isRedisConfigured } from "../redis/redisClient.js";

const STREAM_KEY = "stream:otp_dispatch";
const GROUP_NAME = "group:otp_workers";
const DLQ_STREAM_KEY = "stream:otp_dispatch:dlq";
const CONSUMER_NAME = `worker_${process.pid}_${crypto.randomBytes(4).toString("hex")}`;

const MAX_RETRIES = 3;
const MIN_IDLE_TIME_MS = 10000; // 10s idle time before pending message auto-claim

// In-memory fallback structures for development/test mode ONLY
const memoryQueue = [];
const memoryDlq = [];
let isWorkerRunning = false;
let workerInterval = null;
let isGroupCreated = false;

// Queue Metrics
const metrics = {
  totalEnqueued: 0,
  totalDispatched: 0,
  totalRetried: 0,
  totalFailed: 0,
  totalDlq: 0,
};

/**
 * Mask mobile numbers for sanitized logging (e.g. +91****3210).
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return "unknown";
  const clean = phone.trim();
  if (clean.length <= 4) return "****";
  if (clean.length <= 8) return clean.slice(0, 2) + "****" + clean.slice(-2);
  return clean.slice(0, 3) + "****" + clean.slice(-4);
}

/**
 * Sanitized internal logging helper that strictly strips credentials, OTPs, and masks phone numbers.
 */
function logSanitized(level, message, meta = {}) {
  const cleanMeta = { ...meta };
  if (cleanMeta.phone) cleanMeta.phone = maskPhone(cleanMeta.phone);
  if (cleanMeta.otp) delete cleanMeta.otp;
  if (cleanMeta.token) delete cleanMeta.token;
  if (cleanMeta.password) delete cleanMeta.password;
  const metaStr = Object.keys(cleanMeta).length ? ` ${JSON.stringify(cleanMeta)}` : "";
  console[level](`[OTP_QUEUE] ${message}${metaStr}`);
}

/**
 * Classify errors as transient (eligible for retry) or permanent (immediate DLQ).
 */
export function classifyError(errorMessage = "") {
  const msg = String(errorMessage || "").toLowerCase();

  // Permanent failure indicators
  const permanentKeywords = [
    "invalid mobile",
    "invalid phone",
    "format",
    "10-digit",
    "unsubscribed",
    "blacklisted",
    "template mismatch",
    "dlt",
    "banned",
    "temporarily locked for 24 hours",
    "bad request",
    "400",
    "403",
  ];

  for (const kw of permanentKeywords) {
    if (msg.includes(kw)) {
      return { isPermanent: true, isTransient: false, category: "permanent_invalid" };
    }
  }

  // Transient failure indicators (gateway timeouts, 502/503/504, network reset)
  return { isPermanent: false, isTransient: true, category: "transient_network_or_gateway" };
}

// Dynamically resolve authStore & otpStore to prevent circular ESM dependencies
async function getStores() {
  const { authStore } = await import("../db/authStore.js");
  const { otpStore } = await import("./otpStore.js");
  return { authStore, otpStore };
}

/**
 * Ensure Redis Streams consumer group exists.
 */
async function ensureConsumerGroup(redis) {
  if (isGroupCreated) return true;
  try {
    await redis.xgroup("CREATE", STREAM_KEY, GROUP_NAME, "0", "MKSTREAM");
    isGroupCreated = true;
    return true;
  } catch (err) {
    if (err.message && (err.message.includes("BUSYGROUP") || err.message.includes("already exists"))) {
      isGroupCreated = true;
      return true;
    }
    logSanitized("warn", "Consumer group initialization warning", { error: err.message });
    return false;
  }
}

/**
 * Process a single OTP dispatch job payload.
 */
async function processJob(job) {
  if (!job || !job.phone) return { ok: false, error: "Invalid job payload" };

  try {
    const { authStore, otpStore } = await getStores();
    const { phone, purpose = "password_reset", name } = job;

    // For password reset: verify account exists before invoking external SMS gateway
    if (purpose === "password_reset" || purpose === "forgot_password") {
      const exists = await authStore.checkPhoneExists(phone);
      if (!exists) {
        logSanitized("log", "Omitting SMS dispatch: No registered account for masked phone", { phone });
        return { ok: true, status: "skipped_unregistered", phone: maskPhone(phone) };
      }
    }

    // Idempotency: if a fresh OTP was already successfully sent within 55s, skip duplicate dispatch
    const record = await otpStore.getRecord(phone);
    if (record && record.lastSentAt && (job.attempts || 0) > 0) {
      const elapsed = Date.now() - new Date(record.lastSentAt).getTime();
      if (elapsed < 55000) {
        logSanitized("log", "Skipping duplicate SMS dispatch for phone within cooldown window", { phone });
        return { ok: true, status: "duplicate_skipped", phone: maskPhone(phone) };
      }
    }

    // Account exists (or registration/login): dispatch OTP
    const res = await otpStore.sendOtp({ phone, purpose, name });
    if (!res.success) {
      logSanitized("warn", "Asynchronous dispatch failed", { phone, error: res.error });
      return { ok: false, status: "gateway_failed", phone: maskPhone(phone), error: res.error || "SMS dispatch failed" };
    }

    logSanitized("log", `Asynchronous OTP successfully dispatched (purpose: ${purpose})`, { phone });
    return { ok: true, status: "dispatched", phone: maskPhone(phone) };
  } catch (err) {
    logSanitized("error", "Unexpected error processing job", { phone: job.phone, error: err.message });
    return { ok: false, status: "exception", error: err.message };
  }
}

/**
 * Handle execution, acknowledgements, retries, and dead-letter queue routing for a single stream entry.
 */
async function handleStreamEntry(redis, msgId, rawJob) {
  let job;
  try {
    job = typeof rawJob === "string" ? JSON.parse(rawJob) : rawJob;
  } catch (parseErr) {
    logSanitized("error", "Corrupt job payload in stream, moving to DLQ", { error: parseErr.message });
    try {
      await redis.xadd(DLQ_STREAM_KEY, "*", "job", String(rawJob), "error", "JSON_PARSE_ERROR", "failedAt", String(Date.now()));
      await redis.xack(STREAM_KEY, GROUP_NAME, msgId);
      await redis.xdel(STREAM_KEY, msgId);
      metrics.totalDlq++;
      metrics.totalFailed++;
    } catch {}
    return;
  }

  // Check delayed retry timestamp
  if (job.retryAt && job.retryAt > Date.now()) {
    // Not ready for execution yet, let it remain or yield
    return;
  }

  const res = await processJob(job);

  if (res.ok) {
    // SUCCESS: Acknowledge and trim stream entry
    try {
      await redis.xack(STREAM_KEY, GROUP_NAME, msgId);
      await redis.xdel(STREAM_KEY, msgId);
      metrics.totalDispatched++;
    } catch (ackErr) {
      logSanitized("warn", "Failed acknowledging stream message", { error: ackErr.message });
    }
  } else {
    // FAILURE: Classify error and decide Retry vs DLQ
    const classification = classifyError(res.error);
    const currentAttempts = (job.attempts || 0) + 1;

    if (classification.isPermanent || currentAttempts >= MAX_RETRIES) {
      // EXHAUSTED OR PERMANENT: Route to Dead-Letter Queue (DLQ)
      logSanitized("warn", "Job permanently failed or exhausted retries. Routing to DLQ", {
        jobId: job.id,
        phone: job.phone,
        attempts: currentAttempts,
        reason: res.error,
      });
      try {
        await redis.xadd(
          DLQ_STREAM_KEY,
          "*",
          "job",
          JSON.stringify({
            ...job,
            attempts: currentAttempts,
            finalError: res.error,
            failedAt: Date.now(),
          })
        );
        await redis.xack(STREAM_KEY, GROUP_NAME, msgId);
        await redis.xdel(STREAM_KEY, msgId);
        metrics.totalDlq++;
        metrics.totalFailed++;
      } catch (dlqErr) {
        logSanitized("error", "Failed moving job to DLQ", { error: dlqErr.message });
      }
    } else {
      // TRANSIENT: Exponential backoff re-queue
      const delayMs = Math.pow(2, currentAttempts) * 1000;
      logSanitized("log", `Scheduling exponential retry (${currentAttempts}/${MAX_RETRIES}) in ${delayMs}ms`, {
        jobId: job.id,
        phone: job.phone,
      });
      try {
        await redis.xadd(
          STREAM_KEY,
          "*",
          "job",
          JSON.stringify({
            ...job,
            attempts: currentAttempts,
            lastError: res.error,
            retryAt: Date.now() + delayMs,
          })
        );
        await redis.xack(STREAM_KEY, GROUP_NAME, msgId);
        await redis.xdel(STREAM_KEY, msgId);
        metrics.totalRetried++;
      } catch (retryErr) {
        logSanitized("warn", "Failed re-queueing retry job to stream", { error: retryErr.message });
      }
    }
  }
}

/**
 * Worker tick: handles pending job recovery (crash resilience) and reads new jobs from Redis Streams or memory.
 */
async function runWorkerTick() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    // 1. Process from Redis Streams if configured & connected
    if (isRedisConfigured() && isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        await ensureConsumerGroup(redis);

        // A. PENDING ENTRIES RECOVERY (Crash / Container Restart Resilience)
        // Autoclaim messages stuck in PEL for > MIN_IDLE_TIME_MS (e.g. from crashed workers)
        try {
          if (typeof redis.xautoclaim === "function") {
            const claimRes = await redis.xautoclaim(STREAM_KEY, GROUP_NAME, CONSUMER_NAME, MIN_IDLE_TIME_MS, "0-0", "COUNT", 5);
            if (claimRes && Array.isArray(claimRes[1]) && claimRes[1].length > 0) {
              for (const [msgId, fields] of claimRes[1]) {
                const jobFieldIdx = fields.indexOf("job");
                const rawJob = jobFieldIdx !== -1 ? fields[jobFieldIdx + 1] : null;
                if (rawJob) {
                  await handleStreamEntry(redis, msgId, rawJob);
                }
              }
            }
          }
        } catch (claimErr) {
          // If XAUTOCLAIM is not available or fails, silently fall back to normal stream reads
        }

        // B. READ NEW MESSAGES VIA CONSUMER GROUP
        try {
          const raw = await redis.xreadgroup(
            "GROUP",
            GROUP_NAME,
            CONSUMER_NAME,
            "COUNT",
            5,
            "STREAMS",
            STREAM_KEY,
            ">"
          );

          if (raw && Array.isArray(raw) && raw.length > 0 && raw[0][1] && raw[0][1].length > 0) {
            const entries = raw[0][1];
            for (const [msgId, fields] of entries) {
              const jobFieldIdx = fields.indexOf("job");
              const rawJob = jobFieldIdx !== -1 ? fields[jobFieldIdx + 1] : null;
              if (rawJob) {
                await handleStreamEntry(redis, msgId, rawJob);
              }
            }

            // Yield to process next batch immediately if there were messages
            setImmediate(() => {
              isWorkerRunning = false;
              runWorkerTick().catch(() => {});
            });
            return;
          }
        } catch (readErr) {
          logSanitized("warn", "XREADGROUP tick warning", { error: readErr.message });
        }
      }
    }

    // 2. Process from memory queue (Dev / Test Mode ONLY)
    if (memoryQueue.length > 0) {
      const job = memoryQueue.shift();
      if (job) {
        if (job.retryAt && job.retryAt > Date.now()) {
          // Put back in queue if retry delay not reached
          memoryQueue.push(job);
        } else {
          const res = await processJob(job);
          if (res.ok) {
            metrics.totalDispatched++;
          } else {
            const classification = classifyError(res.error);
            const currentAttempts = (job.attempts || 0) + 1;
            if (classification.isPermanent || currentAttempts >= MAX_RETRIES) {
              memoryDlq.push({
                ...job,
                attempts: currentAttempts,
                finalError: res.error,
                failedAt: Date.now(),
              });
              metrics.totalDlq++;
              metrics.totalFailed++;
            } else {
              const delayMs = Math.pow(2, currentAttempts) * 1000;
              memoryQueue.push({
                ...job,
                attempts: currentAttempts,
                lastError: res.error,
                retryAt: Date.now() + delayMs,
              });
              metrics.totalRetried++;
            }
          }
        }
      }

      const hasReadyJob = memoryQueue.some((j) => !j.retryAt || j.retryAt <= Date.now());
      if (hasReadyJob) {
        setImmediate(() => {
          isWorkerRunning = false;
          runWorkerTick().catch(() => {});
        });
        return;
      }
    }
  } finally {
    isWorkerRunning = false;
  }
}

// Start background worker interval (sweeps every 500ms)
if (!workerInterval) {
  workerInterval = setInterval(() => {
    runWorkerTick().catch(() => {});
  }, 500);
  if (typeof workerInterval.unref === "function") {
    workerInterval.unref();
  }
}

export const otpQueue = {
  /**
   * Enqueue an OTP dispatch job asynchronously.
   * In production mode, durable Redis Streams are mandatory (fail-closed if unavailable).
   */
  async enqueue({ phone, purpose = "password_reset", name = null }) {
    if (!phone) return { ok: false, error: "Phone number required" };

    const job = {
      id: `job_otp_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      phone,
      purpose,
      name,
      enqueuedAt: Date.now(),
      attempts: 0,
    };

    // Distributed Redis Stream
    if (isRedisConfigured()) {
      if (!isRedisConnected()) {
        logSanitized("warn", "Cannot enqueue job: Redis configured but disconnected (fail-closed)");
        return {
          ok: false,
          error: "Authentication service temporarily unavailable.",
          backend: "redis_disconnected",
        };
      }

      const redis = getRedisClient();
      if (!redis) {
        return { ok: false, error: "Redis client unavailable.", backend: "none" };
      }

      try {
        await ensureConsumerGroup(redis);
        await redis.xadd(STREAM_KEY, "*", "job", JSON.stringify(job));
        metrics.totalEnqueued++;
        setImmediate(() => runWorkerTick().catch(() => {}));
        return { ok: true, jobId: job.id, backend: "redis_stream" };
      } catch (err) {
        logSanitized("warn", "Redis XADD failed", { error: err.message });
        return { ok: false, error: "Queue dispatch failed.", backend: "none" };
      }
    }

    // Single-instance development mode ONLY: local in-memory fallback
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[OTP_QUEUE_SECURITY_ERR] Local volatile memory queue strictly forbidden in production without durable Redis Streams."
      );
      return {
        ok: false,
        error: "Durable queue required in production.",
        backend: "forbidden",
      };
    }

    memoryQueue.push(job);
    metrics.totalEnqueued++;
    setImmediate(() => runWorkerTick().catch(() => {}));
    return { ok: true, jobId: job.id, backend: "memory" };
  },

  /**
   * Synchronously drain all pending jobs (Used by automated test runners and graceful shutdown).
   */
  async drainAll() {
    // Drain Redis Stream jobs if connected
    if (isRedisConfigured() && isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        await ensureConsumerGroup(redis);
        try {
          const raw = await redis.xreadgroup(
            "GROUP",
            GROUP_NAME,
            CONSUMER_NAME,
            "COUNT",
            50,
            "STREAMS",
            STREAM_KEY,
            ">"
          );
          if (raw && Array.isArray(raw) && raw.length > 0 && raw[0][1]) {
            for (const [msgId, fields] of raw[0][1]) {
              const jobFieldIdx = fields.indexOf("job");
              const rawJob = jobFieldIdx !== -1 ? fields[jobFieldIdx + 1] : null;
              if (rawJob) {
                await handleStreamEntry(redis, msgId, rawJob);
              }
            }
          }
        } catch {}
      }
    }

    // Drain memory jobs
    while (memoryQueue.length > 0) {
      const job = memoryQueue.shift();
      if (job) {
        const res = await processJob(job);
        if (res.ok) {
          metrics.totalDispatched++;
        } else {
          const classification = classifyError(res.error);
          const currentAttempts = (job.attempts || 0) + 1;
          if (classification.isPermanent || currentAttempts >= MAX_RETRIES) {
            memoryDlq.push({
              ...job,
              attempts: currentAttempts,
              finalError: res.error,
              failedAt: Date.now(),
            });
            metrics.totalDlq++;
            metrics.totalFailed++;
          } else {
            memoryQueue.push({
              ...job,
              attempts: currentAttempts,
              lastError: res.error,
            });
            metrics.totalRetried++;
          }
        }
      }
    }
  },

  /**
   * Retrieve Dead-Letter Queue entries.
   */
  async getDlqJobs() {
    if (isRedisConfigured() && isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          const raw = await redis.xrange(DLQ_STREAM_KEY, "-", "+");
          return raw.map(([id, fields]) => {
            const jobIdx = fields.indexOf("job");
            return {
              id,
              job: jobIdx !== -1 ? JSON.parse(fields[jobIdx + 1]) : null,
            };
          });
        } catch {
          return [];
        }
      }
    }
    return [...memoryDlq];
  },

  /**
   * Retrieve operational metrics for queue monitoring.
   */
  getMetrics() {
    return {
      backend: isRedisConfigured() && isRedisConnected() ? "redis_stream" : "memory",
      consumerName: CONSUMER_NAME,
      memoryPendingCount: memoryQueue.length,
      memoryDlqCount: memoryDlq.length,
      ...metrics,
    };
  },

  /**
   * Reset local memory state (test isolation helper).
   */
  _resetMemoryQueue() {
    memoryQueue.length = 0;
    memoryDlq.length = 0;
    metrics.totalEnqueued = 0;
    metrics.totalDispatched = 0;
    metrics.totalRetried = 0;
    metrics.totalFailed = 0;
    metrics.totalDlq = 0;
    isWorkerRunning = false;
  },

  /**
   * Stop background interval (clean test runner shutdown helper).
   */
  stopWorker() {
    if (workerInterval) {
      clearInterval(workerInterval);
      workerInterval = null;
    }
  },

  /**
   * Start worker interval.
   */
  startWorker() {
    if (!workerInterval) {
      workerInterval = setInterval(() => {
        runWorkerTick().catch(() => {});
      }, 500);
      if (typeof workerInterval.unref === "function") {
        workerInterval.unref();
      }
    }
  },
};
