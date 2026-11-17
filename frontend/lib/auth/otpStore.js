import crypto from "crypto";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { getDbPool, isDbConnected } from "../db/dbPool.js";

const OTP_SECRET =
  process.env.OTP_SECRET || process.env.JWT_SECRET || "nexus_otp_secret_key_prod_2026";
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_MINUTES = 10;
const BAN_HOURS = 24;
const DB_OTP_TIMEOUT_MS = 600;

function resolveDataDir() {
  const direct = path.join(process.cwd(), "data");
  if (fs.existsSync(direct)) return direct;
  const nested = path.join(process.cwd(), "frontend", "data");
  if (fs.existsSync(nested)) return nested;
  return direct;
}

const DATA_DIR = resolveDataDir();
const OTP_FILE = path.join(DATA_DIR, "otp_store.json");

// Primary ultra-fast in-memory store hydrated from disk
const memoryOtp = new Map();
let diskHydrated = false;
let otpTableEnsured = false;

function hydrateFromDiskOnce() {
  if (diskHydrated || process.env.NODE_ENV === "test") return;
  diskHydrated = true;
  try {
    if (fs.existsSync(OTP_FILE)) {
      const raw = fs.readFileSync(OTP_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const [phone, rec] of Object.entries(parsed)) {
          if (rec && typeof rec === "object") {
            memoryOtp.set(phone, rec);
          }
        }
      }
    }
  } catch {}
}

async function flushDiskStoreAsync() {
  if (process.env.NODE_ENV === "test") return;
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
    const snapshot = Object.fromEntries(memoryOtp.entries());
    await fsp.writeFile(OTP_FILE, JSON.stringify(snapshot, null, 2), "utf8");
  } catch {}
}

/**
 * Bounded fast PostgreSQL query exclusively for OtpVerification.
 * Never blocks OTP sending on multi-second cold-start vector DDL or offline DB timeouts.
 */
async function queryOtpDbBounded(sql, params = [], timeoutMs = DB_OTP_TIMEOUT_MS) {
  const pool = getDbPool();
  if (!pool) return null;

  let timer = null;
  try {
    const work = (async () => {
      if (!otpTableEnsured) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "OtpVerification" (
            "id" VARCHAR(128) PRIMARY KEY,
            "phone" VARCHAR(32) NOT NULL,
            "otpHash" VARCHAR(128) NOT NULL,
            "attempts" INT DEFAULT 0,
            "maxAttempts" INT DEFAULT 5,
            "bannedUntil" TIMESTAMP WITH TIME ZONE,
            "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
            "lastSentAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "verified" BOOLEAN DEFAULT FALSE,
            "purpose" VARCHAR(32) DEFAULT 'registration',
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS "idx_otp_phone" ON "OtpVerification"("phone");
        `);
        otpTableEnsured = true;
      }
      return await pool.query(sql, params);
    })();

    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("OTP DB timeout")), timeoutMs);
      timer.unref?.();
    });

    const res = await Promise.race([work, timeoutPromise]);
    return res;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function pickNewestRecord(...records) {
  let best = null;
  let bestTs = -1;
  for (const r of records) {
    if (!r) continue;
    const ts = new Date(r.updatedAt || r.lastSentAt || r.createdAt || 0).getTime() || 0;
    if (!best || ts >= bestTs) {
      best = r;
      bestTs = ts;
    }
  }
  return best;
}

export const otpStore = {
  _resetMemoryStore() {
    memoryOtp.clear();
  },

  /**
   * Normalizes phone numbers to standard E.164 format (defaults to India +91 if 10 digits)
   */
  normalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== "string") return null;
    let clean = rawPhone.replace(/[^\d+]/g, "").trim();
    if (clean.startsWith("00")) {
      clean = "+" + clean.slice(2);
    }
    // Strip leading 0 on 11-digit Indian mobile (e.g. 09876543210)
    if (/^0[6-9]\d{9}$/.test(clean)) {
      clean = "+91" + clean.slice(1);
    }
    // 10 digits Indian mobile without country code
    if (/^[6-9]\d{9}$/.test(clean)) {
      clean = "+91" + clean;
    }
    // 12 digits starting with 91 without '+'
    if (/^91[6-9]\d{9}$/.test(clean)) {
      clean = "+" + clean;
    }
    if (!clean.startsWith("+")) {
      clean = "+" + clean;
    }
    if (clean.length < 11 || clean.length > 16) {
      return null;
    }
    return clean;
  },

  hashOtp(phone, otp) {
    return crypto
      .createHmac("sha256", OTP_SECRET)
      .update(`${phone}:${otp}`)
      .digest("hex");
  },

  createVerificationToken(phone, purpose) {
    const payload = `${phone}:${purpose}:${Date.now()}`;
    const sig = crypto.createHmac("sha256", OTP_SECRET).update(payload).digest("hex");
    return Buffer.from(`${payload}:${sig}`).toString("base64");
  },

  verifyVerificationToken(phone, token, purpose) {
    if (!token || !phone) return false;
    try {
      const decoded = Buffer.from(token, "base64").toString("utf8");
      const [tPhone, tPurpose, tTime, tSig] = decoded.split(":");
      if (!tPhone || !tPurpose || !tTime || !tSig) return false;
      if (tPhone !== phone) return false;

      // Allow verified "login" OTP token to seamlessly complete new-account registration handoff
      const purposeMatches =
        tPurpose === purpose || (purpose === "registration" && tPurpose === "login");
      if (!purposeMatches) return false;

      // Token expires in 20 minutes
      const ageMs = Date.now() - parseInt(tTime, 10);
      if (isNaN(ageMs) || ageMs > 20 * 60 * 1000 || ageMs < 0) return false;

      const expectedSig = crypto
        .createHmac("sha256", OTP_SECRET)
        .update(`${tPhone}:${tPurpose}:${tTime}`)
        .digest("hex");
      const sigBuf = Buffer.from(tSig);
      const expBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  },

  /**
   * Retrieves the freshest OTP record for phone across memory, disk, and bounded PostgreSQL.
   */
  async getRecord(phone) {
    hydrateFromDiskOnce();
    const memRec = memoryOtp.get(phone) || null;

    // Only query PostgreSQL if already connected (avoids 5s offline connection stall)
    let dbRec = null;
    if (isDbConnected()) {
      const res = await queryOtpDbBounded(
        'SELECT * FROM "OtpVerification" WHERE "phone" = $1 ORDER BY "updatedAt" DESC LIMIT 1;',
        [phone]
      );
      if (res && res.rows && res.rows.length > 0) {
        dbRec = res.rows[0];
      }
    }

    const freshest = pickNewestRecord(memRec, dbRec);
    if (freshest) {
      memoryOtp.set(phone, freshest);
    }
    return freshest;
  },

  /**
   * Saves OTP record immediately in memory and asynchronously persists to disk & PostgreSQL.
   */
  async saveRecord(record) {
    hydrateFromDiskOnce();
    const now = new Date().toISOString();
    const updated = {
      ...record,
      updatedAt: now,
    };

    // 1. Synchronous in-memory commit (0ms — immediately available to verifyOtp)
    memoryOtp.set(record.phone, updated);

    // 2. Non-blocking background persistence to disk & PostgreSQL
    flushDiskStoreAsync();

    queryOtpDbBounded(
      `INSERT INTO "OtpVerification" (
        "id", "phone", "otpHash", "attempts", "maxAttempts", "bannedUntil", "expiresAt", "lastSentAt", "verified", "purpose", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT ("id") DO UPDATE SET
        "otpHash" = EXCLUDED."otpHash",
        "attempts" = EXCLUDED."attempts",
        "bannedUntil" = EXCLUDED."bannedUntil",
        "expiresAt" = EXCLUDED."expiresAt",
        "lastSentAt" = EXCLUDED."lastSentAt",
        "verified" = EXCLUDED."verified",
        "purpose" = EXCLUDED."purpose",
        "updatedAt" = EXCLUDED."updatedAt";`,
      [
        updated.id,
        updated.phone,
        updated.otpHash,
        updated.attempts || 0,
        updated.maxAttempts || MAX_ATTEMPTS,
        updated.bannedUntil || null,
        updated.expiresAt,
        updated.lastSentAt || now,
        Boolean(updated.verified),
        updated.purpose || "registration",
        updated.createdAt || now,
        now,
      ],
      1500
    ).catch(() => {});

    return updated;
  },

  /**
   * Generates and dispatches a 6-digit OTP to a mobile phone with rate limiting & 24h ban check.
   * Only commits the 60-second cooldown AFTER gateway dispatch succeeds.
   */
  async sendOtp({ phone: rawPhone, purpose = "registration", name }) {
    const phone = this.normalizePhone(rawPhone);
    if (!phone) {
      return {
        success: false,
        error: "Invalid phone number format. Please provide a valid 10-digit mobile number.",
      };
    }

    const existing = await this.getRecord(phone);
    const now = Date.now();

    // 1. Check if user is currently banned (24 Hours lock after 5 wrong attempts)
    if (existing && existing.bannedUntil) {
      const banTime = new Date(existing.bannedUntil).getTime();
      if (now < banTime) {
        const msLeft = banTime - now;
        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
        const minutesLeft = Math.ceil(msLeft / (1000 * 60));
        const timeText = hoursLeft > 1 ? `${hoursLeft} hours` : `${minutesLeft} minutes`;
        return {
          success: false,
          banned: true,
          bannedUntil: existing.bannedUntil,
          error: `This mobile number is temporarily locked for 24 hours due to 5 consecutive failed attempts. Please try again after ${timeText}.`,
        };
      }
    }

    // 2. Check 60-second resend cooldown
    if (existing && existing.lastSentAt) {
      const lastSent = new Date(existing.lastSentAt).getTime();
      const elapsedMs = now - lastSent;
      if (elapsedMs < COOLDOWN_SECONDS * 1000) {
        const remainingSec = Math.ceil((COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000);
        return {
          success: false,
          cooldown: true,
          cooldownSeconds: remainingSec,
          error: `Please wait ${remainingSec} seconds before requesting a new OTP.`,
        };
      }
    }

    // 3. Generate secure 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999));
    const otpHash = this.hashOtp(phone, otp);
    const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const id = existing?.id || `otp_${now}_${crypto.randomUUID().slice(0, 8)}`;

    console.log(
      `[EMPEROR_NEXUS_OTP] Dispatching to ${phone} | Purpose: ${purpose} | Valid: ${OTP_EXPIRY_MINUTES}m`
    );

    // 4. Dispatch via TRAI DLT SMS Gateway FIRST (3 Variables: "User", 6-digit OTP, "Team Nexus")
    let smsRes = { success: false, error: "SMS provider unavailable." };
    try {
      const { smsService } = await import("./smsService.js");
      smsRes = await smsService.sendSms({
        to: phone,
        otp,
        recipientName: "User",
      });
    } catch (smsErr) {
      console.warn("[SMS_PROVIDER_ERROR]", smsErr.message);
      smsRes = { success: false, error: smsErr.message };
    }

    // Do NOT fake success or lock cooldown if SMS dispatch failed!
    if (!smsRes || !smsRes.success) {
      return {
        success: false,
        gatewayFailed: true,
        error:
          smsRes?.error ||
          "Unable to dispatch SMS verification code right now. Please check the number and try again.",
      };
    }

    // 5. Commit OTP record & 60s cooldown ONLY after gateway accepted the message
    const newRecord = {
      id,
      phone,
      otpHash,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      bannedUntil: null,
      expiresAt,
      lastSentAt: new Date().toISOString(),
      verified: false,
      purpose,
      messageId: smsRes.messageId || null,
      provider: smsRes.provider || "dlt_allsmssolution",
      createdAt: existing?.createdAt || new Date(now).toISOString(),
    };

    await this.saveRecord(newRecord);

    return {
      success: true,
      phone,
      messageId: smsRes.messageId || null,
      provider: smsRes.provider || "dlt_allsmssolution",
      latencyMs: smsRes.latencyMs || null,
      cooldownSeconds: COOLDOWN_SECONDS,
      message: `OTP sent via SMS text message to ${phone}. Valid for 10 minutes.`,
    };
  },

  /**
   * Verifies the submitted OTP code.
   * Tracks wrong attempts (max 5) and applies 24-hour ban if threshold reached.
   */
  async verifyOtp({ phone: rawPhone, otp, purpose = "registration" }) {
    const phone = this.normalizePhone(rawPhone);
    if (!phone) {
      return { success: false, error: "Invalid phone number." };
    }

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return { success: false, error: "Please enter a valid 6-digit OTP code." };
    }

    const cleanOtp = otp.trim();
    const record = await this.getRecord(phone);
    const now = Date.now();

    if (!record) {
      return {
        success: false,
        error: "No OTP was requested for this mobile number. Please click 'Send OTP'.",
      };
    }

    // 1. Check if user is currently banned
    if (record.bannedUntil) {
      const banTime = new Date(record.bannedUntil).getTime();
      if (now < banTime) {
        const msLeft = banTime - now;
        const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
        return {
          success: false,
          banned: true,
          bannedUntil: record.bannedUntil,
          error: `This mobile number has been locked for 24 hours due to 5 consecutive failed attempts. Try again in ${hoursLeft} hours.`,
        };
      }
    }

    // 2. Check if OTP is expired
    const expiryTime = new Date(record.expiresAt).getTime();
    if (now > expiryTime) {
      return {
        success: false,
        expired: true,
        error: "This OTP has expired. Please request a new code.",
      };
    }

    // 3. Constant-time HMAC comparison
    const inputHash = this.hashOtp(phone, cleanOtp);
    const inputBuf = Buffer.from(inputHash);
    const recordBuf = Buffer.from(String(record.otpHash || ""));
    const isMatch =
      inputBuf.length === recordBuf.length && crypto.timingSafeEqual(inputBuf, recordBuf);

    if (isMatch) {
      record.verified = true;
      record.attempts = 0;
      record.bannedUntil = null;
      await this.saveRecord(record);

      const verificationToken = this.createVerificationToken(phone, purpose);

      return {
        success: true,
        verified: true,
        phone,
        verificationToken,
        message: "Mobile number successfully verified.",
      };
    }

    // Wrong OTP entered: increment attempts
    const newAttempts = (record.attempts || 0) + 1;
    record.attempts = newAttempts;

    if (newAttempts >= MAX_ATTEMPTS) {
      const bannedUntil = new Date(now + BAN_HOURS * 60 * 60 * 1000).toISOString();
      record.bannedUntil = bannedUntil;
      await this.saveRecord(record);

      console.warn(
        `🚨 [SECURITY ALERT] Phone ${phone} locked for 24 hours after ${MAX_ATTEMPTS} failed OTP attempts.`
      );

      return {
        success: false,
        banned: true,
        bannedUntil,
        attemptsLeft: 0,
        error: `You have entered the wrong OTP 5 times. For your security, this mobile number has been banned for 24 hours.`,
      };
    }

    await this.saveRecord(record);
    const attemptsLeft = MAX_ATTEMPTS - newAttempts;

    return {
      success: false,
      attemptsLeft,
      error: `Invalid OTP code. You have ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before a 24-hour lockout.`,
    };
  },
};
