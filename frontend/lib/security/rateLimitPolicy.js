/**
 * Centralized Multi-Layer Rate Limiting, Anti-Spoofing IP Resolution,
 * CSRF Origin Verification, and AI Resource / Token Cost Guardrails.
 */

import crypto from "crypto";
import { checkDistributedRateLimit } from "./distributedRateLimit.js";
import { abuseDetectionService } from "./abuseDetectionService.js";

let NextResponse = globalThis.Response;
try {
  const nextServer = await import("next/server.js");
  if (nextServer?.NextResponse) {
    NextResponse = nextServer.NextResponse;
  }
} catch {
  // Standalone Node test runner fallback
}

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === "") return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Centralized Configurable Rate-Limit Policies (overrideable via environment variables).
 */
export function getRateLimitPolicies() {
  return {
    // Anonymous / Per-IP baseline
    ip_general: {
      limit: envInt("RL_IP_GENERAL_MAX", 120),
      windowMs: envInt("RL_IP_GENERAL_WINDOW_MS", 60 * 1000),
      message: "Too many requests from this IP address. Please slow down.",
    },
    // Authenticated User baseline
    user_api: {
      limit: envInt("RL_USER_API_MAX", 180),
      windowMs: envInt("RL_USER_API_WINDOW_MS", 60 * 1000),
      message: "Account request rate limit exceeded. Please wait briefly and try again.",
    },
    // Public API Key (ess_live_*) integrations
    api_key: {
      limit: envInt("RL_API_KEY_MAX", 120),
      windowMs: envInt("RL_API_KEY_WINDOW_MS", 60 * 1000),
      message: "API key rate limit exceeded. Respect the Retry-After header before retrying.",
    },
    // Organization / Tenant aggregate burst ceiling
    organization: {
      limit: envInt("RL_ORG_MAX", 600),
      windowMs: envInt("RL_ORG_WINDOW_MS", 60 * 1000),
      message: "Organization burst rate limit reached. Please retry shortly.",
    },
    // Authentication & Account Recovery layers
    login_ip: {
      limit: envInt("RL_LOGIN_IP_MAX", 15),
      windowMs: envInt("RL_LOGIN_IP_WINDOW_MS", 15 * 60 * 1000),
      message: "Too many login attempts from this network. Please wait before trying again.",
    },
    login_account: {
      limit: envInt("RL_LOGIN_ACCOUNT_MAX", 10),
      windowMs: envInt("RL_LOGIN_ACCOUNT_WINDOW_MS", 15 * 60 * 1000),
      message: "Too many failed login attempts for this account. Please wait before trying again.",
    },
    register_ip: {
      limit: envInt("RL_REGISTER_IP_MAX", 10),
      windowMs: envInt("RL_REGISTER_IP_WINDOW_MS", 15 * 60 * 1000),
      message: "Too many registration attempts from this IP address.",
    },
    password_reset: {
      limit: envInt("RL_PASSWORD_RESET_MAX", 5),
      windowMs: envInt("RL_PASSWORD_RESET_WINDOW_MS", 15 * 60 * 1000),
      message: "Too many password reset requests. Please check your inbox or wait before retrying.",
    },
    otp_send_ip: {
      limit: envInt("RL_OTP_SEND_IP_MAX", 8),
      windowMs: envInt("RL_OTP_SEND_IP_WINDOW_MS", 10 * 60 * 1000),
      message: "Too many OTP requests from this network. Please wait a few minutes.",
    },
    otp_verify_ip: {
      limit: envInt("RL_OTP_VERIFY_IP_MAX", 15),
      windowMs: envInt("RL_OTP_VERIFY_IP_WINDOW_MS", 10 * 60 * 1000),
      message: "Too many OTP verification attempts from this network. Please wait before retrying.",
    },
    // Expensive AI Chat & Session layers
    chat_ip: {
      limit: envInt("RL_CHAT_IP_MAX", 40),
      windowMs: envInt("RL_CHAT_IP_WINDOW_MS", 60 * 1000),
      message: "Too many chat messages sent in a short period. Please wait a moment.",
    },
    chat_visitor: {
      limit: envInt("RL_CHAT_VISITOR_MAX", 20),
      windowMs: envInt("RL_CHAT_VISITOR_WINDOW_MS", 60 * 1000),
      message: "You're sending messages too quickly. Please wait a moment before trying again.",
    },
    chat_conversation: {
      limit: envInt("RL_CHAT_CONV_MAX", 15),
      windowMs: envInt("RL_CHAT_CONV_WINDOW_MS", 60 * 1000),
      message: "Too many messages in this conversation. Please wait a moment.",
    },
    chat_org: {
      limit: envInt("RL_CHAT_ORG_MAX", 300),
      windowMs: envInt("RL_CHAT_ORG_WINDOW_MS", 60 * 1000),
      message: "This assistant is handling high traffic right now. Please retry in a few seconds.",
    },
    public_session_ip: {
      limit: envInt("RL_PUBLIC_SESSION_IP_MAX", 30),
      windowMs: envInt("RL_PUBLIC_SESSION_IP_WINDOW_MS", 60 * 1000),
      message: "Too many session initialization requests. Please wait briefly.",
    },
    conversation_create_ip: {
      limit: envInt("RL_CONV_CREATE_IP_MAX", 10),
      windowMs: envInt("RL_CONV_CREATE_IP_WINDOW_MS", 5 * 60 * 1000),
      message: "Too many conversations created from this IP address. Please continue in your active chat.",
    },
    conversation_create_visitor: {
      limit: envInt("RL_CONV_CREATE_VISITOR_MAX", 5),
      windowMs: envInt("RL_CONV_CREATE_VISITOR_WINDOW_MS", 5 * 60 * 1000),
      message: "Too many new conversations created. Please continue in your active chat.",
    },
    // Realtime & Streaming
    sse_connect_ip: {
      limit: envInt("RL_SSE_CONNECT_IP_MAX", 15),
      windowMs: envInt("RL_SSE_CONNECT_IP_WINDOW_MS", 60 * 1000),
      message: "Too many real-time stream connections from this IP address.",
    },
    sse_connect_user: {
      limit: envInt("RL_SSE_CONNECT_USER_MAX", 8),
      windowMs: envInt("RL_SSE_CONNECT_USER_WINDOW_MS", 60 * 1000),
      message: "Too many active real-time connections for this account.",
    },
    // Admin, Search & Export
    admin_api: {
      limit: envInt("RL_ADMIN_API_MAX", 100),
      windowMs: envInt("RL_ADMIN_API_WINDOW_MS", 60 * 1000),
      message: "Admin request rate limit reached. Please wait a moment.",
    },
    search_query: {
      limit: envInt("RL_SEARCH_QUERY_MAX", 60),
      windowMs: envInt("RL_SEARCH_QUERY_WINDOW_MS", 60 * 1000),
      message: "Too many search requests. Please slow down.",
    },
    export_data: {
      limit: envInt("RL_EXPORT_DATA_MAX", 5),
      windowMs: envInt("RL_EXPORT_DATA_WINDOW_MS", 15 * 60 * 1000),
      message: "Data export rate limit reached. Please wait before exporting again.",
    },
    // Storage, Ingestion & Crawling layers
    file_upload: {
      limit: envInt("RL_FILE_UPLOAD_MAX", 15),
      windowMs: envInt("RL_FILE_UPLOAD_WINDOW_MS", 5 * 60 * 1000),
      message: "File upload rate limit reached. Please wait before uploading additional files.",
    },
    website_crawl: {
      limit: envInt("RL_WEBSITE_CRAWL_MAX", 10),
      windowMs: envInt("RL_WEBSITE_CRAWL_WINDOW_MS", 10 * 60 * 1000),
      message: "Website crawl rate limit reached. Please allow active indexing jobs to finish.",
    },
    billing_checkout: {
      limit: envInt("RL_BILLING_CHECKOUT_MAX", 12),
      windowMs: envInt("RL_BILLING_CHECKOUT_WINDOW_MS", 10 * 60 * 1000),
      message: "Too many checkout initialization attempts. Please wait a moment.",
    },
  };
}

/**
 * Centralized AI Resource & Cost Protection Limits.
 */
export function getAiResourceLimits() {
  return {
    maxBodyBytes: envInt("AI_MAX_BODY_BYTES", 64 * 1024), // 64 KB max JSON payload on chat
    maxMessageChars: envInt("AI_MAX_MESSAGE_CHARS", 4000), // ~1,000 tokens max per single user turn
    maxHistoryTurns: envInt("AI_MAX_HISTORY_TURNS", 10), // Max prior turns accepted from client
    maxHistoryItemChars: envInt("AI_MAX_HISTORY_ITEM_CHARS", 2000), // Max chars per history turn
    maxSystemPromptChars: envInt("AI_MAX_SYSTEM_PROMPT_CHARS", 12000), // Max custom instructions
    maxInputTokensEst: envInt("AI_MAX_INPUT_TOKENS", 6000), // Hard input token budget per request
    maxOutputTokens: envInt("AI_MAX_OUTPUT_TOKENS", 512), // Completion cap
    maxDocumentBytes: envInt("AI_MAX_DOCUMENT_BYTES", 5 * 1024 * 1024), // 5 MB max text document
    maxImageBytes: envInt("AI_MAX_IMAGE_BYTES", 5 * 1024 * 1024), // 5 MB max image upload
  };
}

function isValidIpToken(candidate) {
  if (!candidate || typeof candidate !== "string") return false;
  const clean = candidate.trim();
  if (!clean || clean.length > 64) return false;
  // IPv4 or IPv6 characters only
  return /^[0-9a-fA-F:.]+$/.test(clean);
}

/**
 * Anti-Spoofing Client IP Extraction.
 *
 * Security Rationale:
 * Behind Nginx (`real_ip_header CF-Connecting-IP` + `proxy_set_header X-Real-IP $remote_addr` +
 * `proxy_add_x_forwarded_for`), reading `x-forwarded-for.split(",")[0]` is trivially spoofable
 * because Nginx appends `$remote_addr` to the RIGHT of any client-forged `X-Forwarded-For` header!
 *
 * Priority order:
 * 1. `x-real-ip` (set directly by local Nginx from verified `$remote_addr` / Cloudflare real_ip)
 * 2. `cf-connecting-ip` (when behind Cloudflare directly)
 * 3. Rightmost trusted hop of `x-forwarded-for` (the hop appended by our reverse proxy)
 * 4. Deterministic fingerprint fallback (never collapses all anonymous callers into one bucket)
 */
export function extractClientIp(request) {
  if (!request?.headers) return "127.0.0.1";

  const xRealIp = request.headers.get("x-real-ip")?.trim();
  if (isValidIpToken(xRealIp)) {
    return xRealIp;
  }

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (isValidIpToken(cfIp)) {
    return cfIp;
  }

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff
      .split(",")
      .map((s) => s.trim())
      .filter(isValidIpToken);

    if (hops.length > 0) {
      const trustedHops = envInt("TRUSTED_PROXY_HOPS", 1);
      const idx = Math.max(0, hops.length - trustedHops);
      return hops[idx];
    }
  }

  // Direct local / test invocation: isolate by user-agent + host hash so distinct clients don't collide
  const ua = request.headers.get("user-agent") || "";
  if (!ua) return "127.0.0.1";
  const digest = crypto.createHash("sha256").update(ua).digest("hex").slice(0, 12);
  return `local_${digest}`;
}

/**
 * Attach standardized IETF + X-RateLimit headers to any Response / NextResponse.
 */
export function applyRateLimitHeaders(response, rateResult) {
  if (!response?.headers || !rateResult) return response;

  const limit = String(rateResult.limit ?? 0);
  const remaining = String(Math.max(0, rateResult.remaining ?? 0));
  const reset = String(rateResult.resetAt ?? Math.ceil(Date.now() / 1000) + 60);

  // IETF draft-ietf-httpapi-ratelimit-headers
  response.headers.set("RateLimit-Limit", limit);
  response.headers.set("RateLimit-Remaining", remaining);
  response.headers.set("RateLimit-Reset", reset);

  // Widely adopted X-RateLimit-* headers
  response.headers.set("X-RateLimit-Limit", limit);
  response.headers.set("X-RateLimit-Remaining", remaining);
  response.headers.set("X-RateLimit-Reset", reset);

  if (!rateResult.ok && rateResult.retrySec > 0) {
    response.headers.set("Retry-After", String(rateResult.retrySec));
  }

  return response;
}

/**
 * Build a standardized HTTP 429 Too Many Requests JSON response.
 */
export function buildRateLimitResponse(rateResult, customMessage = null) {
  const retryAfter = Math.max(1, Number(rateResult?.retrySec) || 1);
  const baseMsg = customMessage || "Too many requests. Please wait before trying again.";
  const payload = {
    success: false,
    error: `${baseMsg} Retry in ${retryAfter}s.`,
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter,
  };

  let res;
  if (typeof NextResponse?.json === "function") {
    res = NextResponse.json(payload, { status: 429 });
  } else {
    res = new Response(JSON.stringify(payload), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  return applyRateLimitHeaders(res, rateResult);
}

/**
 * Evaluate a named policy layer (or custom limit/window) and return either `{ ok: true, result }`
 * or `{ ok: false, result, response }` (pre-built HTTP 429 with Retry-After + RateLimit headers).
 */
export async function enforceRateLimit(policyName, subjectKey, overrides = {}) {
  const policies = getRateLimitPolicies();
  const base = policies[policyName] || policies.ip_general;
  const limit = overrides.limit ?? base.limit;
  const windowMs = overrides.windowMs ?? base.windowMs;
  const message = overrides.message ?? base.message;

  // 1. Check if subject is actively blocked or under progressive cooldown
  const subjectType = policyName.includes("ip") ? "ip" : policyName.includes("visitor") ? "visitor" : "user";
  const blockCheck = await abuseDetectionService.isSubjectBlocked(subjectType, subjectKey);
  if (blockCheck.blocked) {
    const fakeRateResult = {
      ok: false,
      limit,
      remaining: 0,
      retrySec: blockCheck.retrySec || 60,
      resetAt: Math.ceil(Date.now() / 1000) + (blockCheck.retrySec || 60),
    };
    return {
      ok: false,
      result: fakeRateResult,
      response: buildRateLimitResponse(fakeRateResult, blockCheck.reason),
    };
  }

  const compositeKey = `${policyName}:${subjectKey}`;
  const result = await checkDistributedRateLimit(compositeKey, limit, windowMs);

  if (!result.ok) {
    // Record violation for progressive cooldown escalation
    abuseDetectionService.recordViolationAndGetCooldown(subjectKey, subjectType).catch(() => {});
    return {
      ok: false,
      result,
      response: buildRateLimitResponse(result, message),
    };
  }

  return { ok: true, result };
}

/**
 * Estimate token count conservatively (~3.8 chars per English token, ~2.2 for Devanagari/UTF-8).
 */
export function estimateTokenCount(text = "") {
  if (!text || typeof text !== "string") return 0;
  const hasNonAscii = /[^\x00-\x7F]/.test(text);
  const divisor = hasNonAscii ? 2.4 : 3.8;
  return Math.ceil(text.length / divisor);
}

/**
 * Validate incoming AI chat payload bounds (body size, message length, history sanitation, token budget).
 * Protects against ReDoS regex stalls, memory exhaustion, and LLM token-cost amplification.
 */
export function validateChatPayloadAndBudget(request, body = {}) {
  const limits = getAiResourceLimits();

  // 1. Check declared Content-Length header if present
  const declaredLen = parseInt(request?.headers?.get?.("content-length") || "0", 10);
  if (declaredLen > limits.maxBodyBytes) {
    return {
      ok: false,
      status: 413,
      code: "PAYLOAD_TOO_LARGE",
      error: `Request payload exceeds maximum allowed size of ${Math.round(limits.maxBodyBytes / 1024)} KB.`,
    };
  }

  const rawMessage = body?.message;
  if (!rawMessage || typeof rawMessage !== "string" || !rawMessage.trim()) {
    return {
      ok: false,
      status: 400,
      code: "EMPTY_MESSAGE",
      error: "Message content is required",
    };
  }

  if (rawMessage.length > limits.maxMessageChars) {
    return {
      ok: false,
      status: 400,
      code: "MESSAGE_TOO_LONG",
      error: `Message exceeds maximum length of ${limits.maxMessageChars.toLocaleString()} characters.`,
    };
  }

  // 2. Sanitize & bound client-supplied history
  const rawHistory = Array.isArray(body?.history) ? body.history : [];
  const sanitizedHistory = rawHistory
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
    )
    .slice(-limits.maxHistoryTurns)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, limits.maxHistoryItemChars),
    }));

  // 3. Check aggregate input token estimate
  const historyChars = sanitizedHistory.reduce((acc, m) => acc + m.content.length, 0);
  const estimatedInputTokens = estimateTokenCount(rawMessage) + Math.ceil(historyChars / 3.8);

  if (estimatedInputTokens > limits.maxInputTokensEst) {
    return {
      ok: false,
      status: 400,
      code: "TOKEN_BUDGET_EXCEEDED",
      error: `Input context exceeds maximum per-request token budget (${limits.maxInputTokensEst} tokens). Please shorten your message.`,
    };
  }

  return {
    ok: true,
    message: rawMessage.trim(),
    sanitizedHistory,
    estimatedInputTokens,
    maxOutputTokens: limits.maxOutputTokens,
  };
}

/**
 * Verify Same-Origin / Trusted-Origin on cookie-authenticated state-changing requests (CSRF defense).
 * Requests authenticated via explicit `Authorization: Bearer ...` or `X-API-Key` are exempt from cookie CSRF,
 * and requests without an `Origin` header (server-to-server / Node test harness) are permitted.
 */
export function verifyCsrfOrigin(request) {
  if (!request?.headers) return { ok: true };
  const method = (request.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { ok: true };
  }

  // API-key or Bearer header callers are not ambient browser cookie requests
  if (request.headers.get("authorization") || request.headers.get("x-api-key")) {
    return { ok: true };
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return { ok: true };
  }

  try {
    const originHost = new URL(origin).host.toLowerCase();
    const reqHost = (
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      new URL(request.url).host
    )
      .split(",")[0]
      .trim()
      .toLowerCase();

    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const allowedHosts = new Set([reqHost]);
    if (configuredAppUrl) {
      try {
        allowedHosts.add(new URL(configuredAppUrl).host.toLowerCase());
      } catch {}
    }

    if (!allowedHosts.has(originHost)) {
      return {
        ok: false,
        error: "Cross-origin state-changing request blocked by CSRF protection.",
      };
    }
  } catch {
    return {
      ok: false,
      error: "Malformed Origin header rejected by CSRF protection.",
    };
  }

  return { ok: true };
}
