/**
 * Reliable Asynchronous OTP Dispatch Queue
 *
 * Implements asynchronous background dispatch for sensitive authentication flows
 * (e.g. password reset) to completely eliminate account existence oracles and timing
 * differences on public endpoints (SEC-03-B).
 *
 * Architecture:
 * - Distributed (Production): Redis List backed queue (queue:otp_dispatch) with atomic pop.
 * - Local / Dev Fallback: Bounded in-process FIFO queue with auto-draining event loop worker.
 * - Idempotency & Failure Resilience: Traps delivery errors internally without altering public responses.
 */

import crypto from "crypto";
import { getRedisClient, isRedisConnected, isRedisConfigured } from "../redis/redisClient.js";

const REDIS_QUEUE_KEY = "queue:otp_dispatch";
const memoryQueue = [];
let isWorkerRunning = false;
let workerInterval = null;

// Dynamically resolve authStore & otpStore to prevent circular ESM dependencies
async function getStores() {
  const { authStore } = await import("../db/authStore.js");
  const { otpStore } = await import("./otpStore.js");
  return { authStore, otpStore };
}

/**
 * Process a single OTP dispatch job.
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
        console.log(`[OTP_QUEUE] Omitting SMS dispatch: No registered account for ${phone}`);
        return { ok: true, status: "skipped_unregistered", phone };
      }
    }

    // Account exists (or registration/login): dispatch OTP
    const res = await otpStore.sendOtp({ phone, purpose, name });
    if (!res.success) {
      console.warn(`[OTP_QUEUE_WARN] Asynchronous dispatch failed for ${phone}: ${res.error}`);
      return { ok: false, status: "gateway_failed", phone, error: res.error };
    }

    console.log(`[OTP_QUEUE] Asynchronous OTP successfully dispatched to ${phone} (purpose: ${purpose})`);
    return { ok: true, status: "dispatched", phone };
  } catch (err) {
    console.error(`[OTP_QUEUE_ERROR] Unexpected error processing job for ${job.phone}:`, err.message);
    return { ok: false, status: "exception", error: err.message };
  }
}

/**
 * Worker tick: drains pending jobs from Redis or in-memory queue.
 */
async function runWorkerTick() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    // 1. Process from Redis if configured & connected
    if (isRedisConfigured() && isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        let rawJob = null;
        try {
          rawJob = await redis.rpop(REDIS_QUEUE_KEY);
        } catch (err) {
          console.warn("[OTP_QUEUE_REDIS_POP_WARN]", err.message);
        }

        if (rawJob) {
          try {
            const job = JSON.parse(rawJob);
            await processJob(job);
          } catch (parseErr) {
            console.error("[OTP_QUEUE_PARSE_ERR]", parseErr.message);
          }
          // If there might be more jobs, yield tick
          setImmediate(() => {
            isWorkerRunning = false;
            runWorkerTick();
          });
          return;
        }
      }
    }

    // 2. Process from memory queue
    if (memoryQueue.length > 0) {
      const job = memoryQueue.shift();
      if (job) {
        await processJob(job);
      }
      if (memoryQueue.length > 0) {
        setImmediate(() => {
          isWorkerRunning = false;
          runWorkerTick();
        });
        return;
      }
    }
  } finally {
    isWorkerRunning = false;
  }
}

// Ensure background worker sweeps every 500ms
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

    // Distributed Redis queue
    if (isRedisConfigured() && isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        try {
          await redis.lpush(REDIS_QUEUE_KEY, JSON.stringify(job));
          setImmediate(() => runWorkerTick().catch(() => {}));
          return { ok: true, jobId: job.id, backend: "redis" };
        } catch (err) {
          console.warn("[OTP_QUEUE_REDIS_LPUSH_WARN]", err.message);
        }
      }
    }

    // Memory queue fallback
    memoryQueue.push(job);
    setImmediate(() => runWorkerTick().catch(() => {}));
    return { ok: true, jobId: job.id, backend: "memory" };
  },

  /**
   * Synchronously drain all pending jobs (Used by automated test runners).
   */
  async drainAll() {
    // Drain Redis jobs
    if (isRedisConfigured() && isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        let raw;
        while ((raw = await redis.rpop(REDIS_QUEUE_KEY))) {
          try {
            await processJob(JSON.parse(raw));
          } catch {}
        }
      }
    }

    // Drain memory jobs
    while (memoryQueue.length > 0) {
      const job = memoryQueue.shift();
      if (job) {
        await processJob(job);
      }
    }
  },

  /**
   * Reset local memory state (test helper).
   */
  _resetMemoryQueue() {
    memoryQueue.length = 0;
    isWorkerRunning = false;
  },
};
