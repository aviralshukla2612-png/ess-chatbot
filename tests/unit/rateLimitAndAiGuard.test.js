import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkDistributedRateLimit,
  _resetRateLimitMemory,
} from "../../frontend/lib/security/distributedRateLimit.js";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
  validateChatPayloadAndBudget,
} from "../../frontend/lib/security/rateLimitPolicy.js";
import { NextResponse } from "next/server";

describe("Phase 5 — Multi-Layer Rate Limiting & AI Cost Protection Suite", () => {
  beforeEach(() => {
    _resetRateLimitMemory();
  });

  it("1. Allows requests within threshold and tracks accurate remaining quota", async () => {
    const r1 = await checkDistributedRateLimit("test_within_1", 3, 10000);
    const r2 = await checkDistributedRateLimit("test_within_1", 3, 10000);
    const r3 = await checkDistributedRateLimit("test_within_1", 3, 10000);

    assert.equal(r1.ok, true);
    assert.equal(r1.remaining, 2);
    assert.equal(r2.ok, true);
    assert.equal(r2.remaining, 1);
    assert.equal(r3.ok, true);
    assert.equal(r3.remaining, 0);
  });

  it("2. Blocks requests exceeding limit with HTTP 429 and standard RateLimit + Retry-After headers", async () => {
    const overrides = { limit: 2, windowMs: 30000 };

    const first = await enforceRateLimit("login_ip", "203.0.113.44", overrides);
    assert.equal(first.ok, true);

    const second = await enforceRateLimit("login_ip", "203.0.113.44", overrides);
    assert.equal(second.ok, true);

    const blocked = await enforceRateLimit("login_ip", "203.0.113.44", overrides);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.response.status, 429);
    assert.ok(Number(blocked.response.headers.get("retry-after")) >= 1);
    assert.equal(blocked.response.headers.get("ratelimit-limit"), "2");
    assert.equal(blocked.response.headers.get("ratelimit-remaining"), "0");
    assert.ok(blocked.response.headers.get("ratelimit-reset"));
    assert.equal(blocked.response.headers.get("x-ratelimit-limit"), "2");

    const payload = await blocked.response.json();
    assert.equal(payload.code, "RATE_LIMIT_EXCEEDED");
    assert.ok(payload.retryAfter >= 1);

    const okRes = applyRateLimitHeaders(NextResponse.json({ ok: true }), first.result);
    assert.equal(okRes.headers.get("ratelimit-limit"), "2");
  });

  it("3. Resets sliding-window allowance cleanly after window expiration", async () => {
    const key = "test_window_expiry";
    const first = await checkDistributedRateLimit(key, 1, 250);
    assert.equal(first.ok, true);

    const second = await checkDistributedRateLimit(key, 1, 250);
    assert.equal(second.ok, false);

    await new Promise((r) => setTimeout(r, 320));

    const afterReset = await checkDistributedRateLimit(key, 1, 250);
    assert.equal(afterReset.ok, true);
  });

  it("4. Isolates multi-user and multi-API-key rate buckets independently", async () => {
    const overrides = { limit: 1, windowMs: 60000 };

    const resA1 = await enforceRateLimit("user_api", "usr_alpha", overrides);
    const resA2 = await enforceRateLimit("user_api", "usr_alpha", overrides);
    const resB1 = await enforceRateLimit("user_api", "usr_beta", overrides);

    assert.equal(resA1.ok, true);
    assert.equal(resA2.ok, false, "User Alpha second request must be rate limited");
    assert.equal(resB1.ok, true, "User Beta must have an independent user bucket");

    const resKey1 = await enforceRateLimit("api_key", "ess_live_key_one", overrides);
    const resKey1Blocked = await enforceRateLimit("api_key", "ess_live_key_one", overrides);
    const resKey2 = await enforceRateLimit("api_key", "ess_live_key_two", overrides);

    assert.equal(resKey1.ok, true);
    assert.equal(resKey1Blocked.ok, false);
    assert.equal(resKey2.ok, true);
  });

  it("5. Enforces exact cap under concurrent burst traffic (25 parallel requests vs limit 10)", async () => {
    const burstResults = await Promise.all(
      Array.from({ length: 25 }, () => checkDistributedRateLimit("burst_key_25", 10, 60000))
    );
    const allowedCount = burstResults.filter((r) => r.ok).length;
    const blockedCount = burstResults.filter((r) => !r.ok).length;

    assert.equal(allowedCount, 10);
    assert.equal(blockedCount, 15);
  });

  it("6. Defends against spoofed X-Forwarded-For headers by reading rightmost trusted proxy hop", () => {
    const spoofedReq = new Request("http://localhost:3000/api/public/chat/bot_1", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 9.9.9.9, 198.51.100.77",
      },
    });

    const extractedIp = extractClientIp(spoofedReq);
    assert.equal(
      extractedIp,
      "198.51.100.77",
      "extractClientIp must ignore attacker-controlled leftmost X-Forwarded-For values"
    );
  });

  it("7. Enforces AI prompt length, conversation history turn caps, and output token ceiling", () => {
    const mockReq = new Request("http://localhost:3000/api/public/chat/bot_1", {
      method: "POST",
    });

    const emptyCheck = validateChatPayloadAndBudget(mockReq, { message: "   " });
    assert.equal(emptyCheck.ok, false);
    assert.equal(emptyCheck.status, 400);
    assert.equal(emptyCheck.code, "EMPTY_MESSAGE");

    const hugePrompt = "A".repeat(4500);
    const hugeCheck = validateChatPayloadAndBudget(mockReq, { message: hugePrompt });
    assert.equal(hugeCheck.ok, false);
    assert.equal(hugeCheck.code, "MESSAGE_TOO_LONG");

    const longHistory = Array.from({ length: 40 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Turn ${i}`,
    }));
    const validCheck = validateChatPayloadAndBudget(mockReq, {
      message: "What are your pricing plans?",
      history: longHistory,
    });
    assert.equal(validCheck.ok, true);
    assert.ok(validCheck.sanitizedHistory.length <= 10);
    assert.ok(validCheck.maxOutputTokens <= 1024);
  });
});
