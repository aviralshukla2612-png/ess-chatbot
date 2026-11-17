import crypto from "crypto";
import fs from "fs";
import path from "path";
import { queryDb } from "../db/dbPool.js";

const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || "nexus_otp_secret_key_prod_2026";
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_MINUTES = 10;
const BAN_HOURS = 24;

const DATA_DIR = path.join(process.cwd(), "data");
const OTP_FILE = path.join(DATA_DIR, "otp_store.json");

// In-memory fallback
const memoryOtp = new Map();

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {}
}

function loadDiskStore() {
  try {
    ensureDataDir();
    if (fs.existsSync(OTP_FILE)) {
      const data = fs.readFileSync(OTP_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {}
  return {};
}

function saveDiskStore(store) {
  try {
    ensureDataDir();
    fs.writeFileSync(OTP_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (e) {}
}

export const otpStore = {
  /**
   * Normalizes phone numbers to standard E.164 format (defaults to India +91 if 10 digits)
   */
  normalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== "string") return null;
    let clean = rawPhone.replace(/[^\d+]/g, "").trim();
    if (clean.startsWith("00")) {
      clean = "+" + clean.slice(2);
    }
    // 10 digits Indian mobile without country code
    if (/^[6-9]\d{9}$/.test(clean)) {
      clean = "+91" + clean;
    }
    if (!clean.startsWith("+")) {
      clean = "+" + clean;
    }
    // Validate length: E.164 typically 11-15 characters including '+'
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
      if (tPhone !== phone || tPurpose !== purpose) return false;

      // Token expires in 20 minutes
      const ageMs = Date.now() - parseInt(tTime, 10);
      if (isNaN(ageMs) || ageMs > 20 * 60 * 1000 || ageMs < 0) return false;

      const expectedSig = crypto
        .createHmac("sha256", OTP_SECRET)
        .update(`${tPhone}:${tPurpose}:${tTime}`)
        .digest("hex");
      return crypto.timingSafeEqual(Buffer.from(tSig), Buffer.from(expectedSig));
    } catch (e) {
      return false;
    }
  },

  /**
   * Retrieves active OTP record for phone from DB or fallback
   */
  async getRecord(phone) {
    // 1. Try PostgreSQL
    try {
      const res = await queryDb(
        'SELECT * FROM "OtpVerification" WHERE "phone" = $1 ORDER BY "createdAt" DESC LIMIT 1;',
        [phone]
      );
      if (res.ok && res.rows && res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (e) {}

    // 2. Try Disk
    const disk = loadDiskStore();
    if (disk[phone]) return disk[phone];

    // 3. Try In-memory
    return memoryOtp.get(phone) || null;
  },

  /**
   * Saves or updates OTP record in DB, disk, and memory
   */
  async saveRecord(record) {
    const now = new Date().toISOString();
    const updated = {
      ...record,
      updatedAt: now,
    };

    // 1. Memory
    memoryOtp.set(record.phone, updated);

    // 2. Disk
    try {
      const disk = loadDiskStore();
      disk[record.phone] = updated;
      saveDiskStore(disk);
    } catch (e) {}

    // 3. PostgreSQL
    try {
      await queryDb(
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
        ]
      );
    } catch (e) {}

    return updated;
  },

  /**
   * Generates and dispatches a 6-digit OTP to a mobile phone with rate limiting & 24h ban check.
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
    const id = existing?.id || `otp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    const newRecord = {
      id,
      phone,
      otpHash,
      // If ban expired, reset attempts to 0; otherwise keep attempts = 0 for fresh OTP
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      bannedUntil: null,
      expiresAt,
      lastSentAt: new Date(now).toISOString(),
      verified: false,
      purpose,
      createdAt: existing?.createdAt || new Date(now).toISOString(),
    };

    await this.saveRecord(newRecord);

    // 4. Log OTP in console for operational verification & testing
    console.log(`\n========================================`);
    console.log(`📱 [EMPEROR NEXUS OTP DISPATCH]`);
    console.log(`Recipient: ${phone}`);
    console.log(`OTP Code : ${otp}`);
    console.log(`Purpose  : ${purpose}`);
    console.log(`Expires  : ${OTP_EXPIRY_MINUTES} minutes`);
    console.log(`========================================\n`);

    // 5. Send via TRAI DLT SMS Provider (TXXTOO / 1607100000000313742)
    try {
      const { smsService } = await import("./smsService.js");
      await smsService.sendSms({
        to: phone,
        otp,
        recipientName: "User",
        message: `Dear User Your OTP for verification is ${otp}. Please enter this code to complete the process.\nRegards Team Nexus\nTEXT2`,
      });
    } catch (smsErr) {
      console.warn("[SMS_PROVIDER_WARNING]", smsErr.message);
    }

    return {
      success: true,
      phone,
      cooldownSeconds: COOLDOWN_SECONDS,
      message: `OTP sent via SMS text message to ${phone}. Valid for 10 minutes.`,
      debugOtp: process.env.NODE_ENV === "development" && process.env.SHOW_DEBUG_OTP === "true" ? otp : undefined,
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

    // 3. Compare hash
    const inputHash = this.hashOtp(phone, cleanOtp);
    const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(record.otpHash));

    if (isMatch) {
      // Successful verification
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
      // 5 Failed attempts reached: Apply 24-hour lockout!
      const bannedUntil = new Date(now + BAN_HOURS * 60 * 60 * 1000).toISOString();
      record.bannedUntil = bannedUntil;
      await this.saveRecord(record);

      console.warn(`🚨 [SECURITY ALERT] Phone ${phone} locked for 24 hours after ${MAX_ATTEMPTS} failed OTP attempts.`);

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

