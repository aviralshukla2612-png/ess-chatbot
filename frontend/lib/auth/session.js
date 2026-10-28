/**
 * High-Entropy Signed Session Management
 * Generates and validates tamper-proof HMAC-SHA256 session tokens
 * and produces secure HttpOnly cookie headers.
 */

import crypto from "crypto";

const DEFAULT_TTL_SECONDS = 7 * 24 * 3600; // 7 days

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (
      !secret ||
      secret.trim().length < 32 ||
      secret.includes("ess_dev_secret") ||
      secret.includes("replace_") ||
      secret.includes("placeholder") ||
      secret.includes("changeme") ||
      secret.includes("secret_key_here")
    ) {
      return null;
    }
    return secret.trim();
  }
  return secret ? secret.trim() : "ess_dev_secret_replace_in_prod_minimum_32_chars_long_123456";
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf8");
}

/**
 * Sign a session payload with HMAC-SHA256.
 */
export function signSessionToken(payload, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("[AUTH_CONFIG_ERROR] Cannot sign session: SESSION_SECRET is missing or insecure in production mode.");
  }
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload = {
    ...payload,
    iat: now,
    exp: typeof payload.exp === "number" ? payload.exp : now + ttlSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${dataToSign}.${signature}`;
}

/**
 * Verify and unpack a session token in constant-time.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const secret = getSessionSecret();
  if (!secret) return null;

  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }

    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(dataToSign)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    // Require valid numeric expiry claim
    if (typeof payload.exp !== "number" || isNaN(payload.exp) || payload.exp < now) {
      return null;
    }

    if (!payload.userId) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Parse cookies from Cookie header string
 */
export function parseCookies(cookieHeader = "") {
  const list = {};
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts[0]?.trim();
    const value = parts.slice(1).join("=").trim();
    if (key) {
      list[key] = decodeURIComponent(value);
    }
  });

  return list;
}

/**
 * Build standard Set-Cookie string for session
 */
export function createSessionCookie(token, maxAgeSeconds = DEFAULT_TTL_SECONDS) {
  const isSecure = process.env.COOKIE_SECURE === "true";
  const secureFlag = isSecure ? "; Secure" : "";
  return `ess_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secureFlag}`;
}

/**
 * Build Set-Cookie string to clear session
 */
export function clearSessionCookie() {
  const isSecure = process.env.COOKIE_SECURE === "true";
  const secureFlag = isSecure ? "; Secure" : "";
  return `ess_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureFlag}`;
}
