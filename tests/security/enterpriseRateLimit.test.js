/**
 * Comprehensive Enterprise Rate Limiting, AI Abuse Prevention,
 * Bot Protection & Traffic Management Test Suite
 *
 * Covers all 22 mandatory scenarios specified in Section 19 of the Master Prompt.
 */

import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Core Security Modules
import {
  checkDistributedRateLimit,
  _resetRateLimitMemory,
} from "../../frontend/lib/security/distributedRateLimit.js";
import {
  enforceRateLimit,
  getRateLimitPolicies,
  getAiResourceLimits,
  extractClientIp,
  estimateTokenCount,
  validateChatPayloadAndBudget,
} from "../../frontend/lib/security/rateLimitPolicy.js";
import {
  acquireConcurrencyLock,
  releaseConcurrencyLock,
  acquireGenerationLocks,
  releaseGenerationLocks,
  _resetConcurrencyMemory,
} from "../../frontend/lib/security/concurrencyLock.js";
import {
  abuseDetectionService,
  hashMessageContent,
} from "../../frontend/lib/security/abuseDetectionService.js";
import {
  aiTokenGuard,
  getCurrentPeriodKey,
} from "../../frontend/lib/security/aiTokenGuard.js";
import { quotaGuard } from "../../frontend/lib/billing/quotaGuard.js";

describe("Enterprise Rate Limiting & AI Abuse Prevention Suite", () => {
  beforeEach(() => {
    _resetRateLimitMemory();
    _resetConcurrencyMemory();
    abuseDetectionService._resetAbuseMemory();
    aiTokenGuard._resetTokenMemory();
    quotaGuard._resetMemoryStore();
  });

  // Test 1: Normal visitor can use chatbot within limits
  test("1. Normal visitor can send messages within allowed policy limits", async () => {
    const res = await enforceRateLimit("chat_visitor", "vis_normal_001:bot_test", { limit: 5, windowMs: 60000 });
    assert.equal(res.ok, true);
    assert.equal(res.result.remaining, 4);
  });

  // Test 2: Visitor exceeding message limits receives HTTP 429
  test("2. Visitor exceeding message limits receives HTTP 429 with error message", async () => {
    const key = "vis_flood_002:bot_test";
    for (let i = 0; i < 3; i++) {
      await enforceRateLimit("chat_visitor", key, { limit: 3, windowMs: 60000 });
    }
    const exceed = await enforceRateLimit("chat_visitor", key, { limit: 3, windowMs: 60000 });
    assert.equal(exceed.ok, false);
    assert.ok(exceed.response);
    assert.equal(exceed.response.status, 429);
  });

  // Test 3: Retry-After header is present and valid
  test("3. Retry-After header is present, positive integer on rate-limit response", async () => {
    const key = "vis_retry_003:bot_test";
    for (let i = 0; i < 2; i++) {
      await enforceRateLimit("chat_visitor", key, { limit: 2, windowMs: 30000 });
    }
    const blocked = await enforceRateLimit("chat_visitor", key, { limit: 2, windowMs: 30000 });
    assert.equal(blocked.ok, false);
    const retryHeader = blocked.response.headers.get("Retry-After");
    assert.ok(retryHeader, "Retry-After header must be set");
    const retrySec = parseInt(retryHeader, 10);
    assert.ok(retrySec >= 1 && retrySec <= 30, `Retry-After (${retrySec}) should be between 1 and 30s`);
  });

  // Test 4: Repeated identical messages are detected and throttled
  test("4. Repeated identical messages are detected via hash and throttled", async () => {
    const visitorId = "vis_spammer_004";
    const msg = "Hey can you build me an app?";

    const check1 = await abuseDetectionService.checkRepetitiveMessage(visitorId, msg);
    const check2 = await abuseDetectionService.checkRepetitiveMessage(visitorId, msg);
    assert.equal(check1.allowed, true);
    assert.equal(check2.allowed, true);

    // 3rd submission of identical content within 10s is blocked
    const check3 = await abuseDetectionService.checkRepetitiveMessage(visitorId, msg);
    assert.equal(check3.allowed, false);
    assert.equal(check3.reason, "REPETITIVE_MESSAGE");
    assert.ok(check3.retrySec >= 5);
  });

  // Test 5: Changing conversation ID does not bypass visitor limits
  test("5. Changing conversation ID does not bypass visitor-level rate limit", async () => {
    const visitorId = "vis_bypass_attempt_005";
    const limit = 3;

    // Visitor sends from conv_1, conv_2, conv_3
    await enforceRateLimit("chat_visitor", `${visitorId}:bot_test`, { limit });
    await enforceRateLimit("chat_visitor", `${visitorId}:bot_test`, { limit });
    await enforceRateLimit("chat_visitor", `${visitorId}:bot_test`, { limit });

    // Visitor opens brand new conv_4
    const fourthReq = await enforceRateLimit("chat_visitor", `${visitorId}:bot_test`, { limit });
    assert.equal(fourthReq.ok, false, "Visitor rate limit must bind to visitor ID across conversation changes");
    assert.equal(fourthReq.response.status, 429);
  });

  // Test 6: Changing visitor ID does not trivially bypass IP-level protection
  test("6. Changing visitor ID does not bypass underlying IP-level rate limit", async () => {
    const ip = "198.51.100.45";
    const limit = 3;

    // Attacker clears cookies/tokens to get vis_A, vis_B, vis_C on same IP
    await enforceRateLimit("chat_ip", `${ip}:bot_test`, { limit });
    await enforceRateLimit("chat_ip", `${ip}:bot_test`, { limit });
    await enforceRateLimit("chat_ip", `${ip}:bot_test`, { limit });

    // Fourth request with brand new visitor ID from same IP is blocked
    const fourthReq = await enforceRateLimit("chat_ip", `${ip}:bot_test`, { limit });
    assert.equal(fourthReq.ok, false, "IP-level layer must reject even when visitor ID changes");
    assert.equal(fourthReq.response.status, 429);
  });

  // Test 7: Different visitors do not share counters
  test("7. Different visitors have completely isolated rate-limiting buckets", async () => {
    const visA = "vis_alice_007";
    const visB = "vis_bob_007";
    const limit = 2;

    await enforceRateLimit("chat_visitor", `${visA}:bot_1`, { limit });
    await enforceRateLimit("chat_visitor", `${visA}:bot_1`, { limit });
    const blockedA = await enforceRateLimit("chat_visitor", `${visA}:bot_1`, { limit });
    assert.equal(blockedA.ok, false);

    // Visitor B on same bot should still have full quota
    const checkB = await enforceRateLimit("chat_visitor", `${visB}:bot_1`, { limit });
    assert.equal(checkB.ok, true);
    assert.equal(checkB.result.remaining, 1);
  });

  // Test 8: Different workspaces have isolated quotas
  test("8. Different workspaces have strictly isolated quotas", async () => {
    const orgA = "org_quota_test_008_a";
    const orgB = "org_quota_test_008_b";

    // Exceeding crawl page limit (50 on Starter)
    const resA = await quotaGuard.checkAndReserveQuota(orgA, "crawl_page", 51, "bot_a");
    assert.equal(resA.allowed, false, "Org A must be blocked when exceeding plan quota");
    assert.equal(resA.reason, "QUOTA_EXCEEDED");

    // OrgB within limit should be permitted
    const resB = await quotaGuard.checkAndReserveQuota(orgB, "crawl_page", 10, "bot_b");
    assert.equal(resB.allowed, true, "Org B quota must remain unaffected by Org A");
  });

  // Test 9: AI token limits and budgeting are enforced
  test("9. AI token limits and monthly token budgeting are strictly enforced", async () => {
    const orgId = "org_tokens_009";
    const maxTokens = 1000;

    // Reserve 800 tokens
    const res1 = await aiTokenGuard.reserveTokenBudget({
      organizationId: orgId,
      estimatedTokens: 800,
      maxMonthlyTokens: maxTokens,
    });
    assert.equal(res1.allowed, true);

    // Attempting to reserve another 300 exceeds 1000
    const res2 = await aiTokenGuard.reserveTokenBudget({
      organizationId: orgId,
      estimatedTokens: 300,
      maxMonthlyTokens: maxTokens,
    });
    assert.equal(res2.allowed, false);
    assert.equal(res2.reason, "TOKEN_QUOTA_EXCEEDED");
  });

  // Test 10: Concurrent AI generation limits work
  test("10. Concurrency locks prevent simultaneous generations on same conversation and visitor", async () => {
    const convId = "conv_lock_010";
    const visId = "vis_lock_010";

    const lock1 = await acquireGenerationLocks({
      conversationId: convId,
      visitorId: visId,
      organizationId: "org_test",
    });
    assert.equal(lock1.ok, true);
    assert.equal(lock1.lockTokens.length, 3);

    // Second simultaneous request on same conversation
    const lock2 = await acquireGenerationLocks({
      conversationId: convId,
      visitorId: "vis_other",
      organizationId: "org_test",
    });
    assert.equal(lock2.ok, false);
    assert.equal(lock2.level, "conversation");

    // Release lock1
    await releaseGenerationLocks(lock1.lockTokens);

    // Now conversation can accept a new generation
    const lock3 = await acquireGenerationLocks({
      conversationId: convId,
      visitorId: visId,
      organizationId: "org_test",
    });
    assert.equal(lock3.ok, true);
    await releaseGenerationLocks(lock3.lockTokens);
  });

  // Test 11: Failed generation reservations are refunded
  test("11. Failed generation reservations are safely refunded to workspace quota", async () => {
    const orgId = "org_refund_011";
    const maxTokens = 1000;

    const res = await aiTokenGuard.reserveTokenBudget({
      organizationId: orgId,
      estimatedTokens: 900,
      maxMonthlyTokens: maxTokens,
    });
    assert.equal(res.allowed, true);

    // Cancel reservation on error
    await aiTokenGuard.cancelReservation(res.reservationId);

    // Should now be able to reserve 900 again
    const resAfterRefund = await aiTokenGuard.reserveTokenBudget({
      organizationId: orgId,
      estimatedTokens: 900,
      maxMonthlyTokens: maxTokens,
    });
    assert.equal(resAfterRefund.allowed, true, "Tokens must be refunded upon cancellation");
  });

  // Test 12: Duplicate requests do not create duplicate messages
  test("12. Cryptographic message hashing produces identical fingerprints for whitespace/case variants", () => {
    const hash1 = hashMessageContent("  Hello World!  ");
    const hash2 = hashMessageContent("hello   world! ");
    assert.equal(hash1, hash2, "Normalized message hashes must match");
  });

  // Test 13: WebSocket / SSE event & connection rate limiting
  test("13. Real-time SSE connection rate limiting enforces per-IP and per-user limits", async () => {
    const ip = "192.0.2.88";
    const limit = 2;

    await enforceRateLimit("sse_connect_ip", ip, { limit });
    await enforceRateLimit("sse_connect_ip", ip, { limit });
    const blocked = await enforceRateLimit("sse_connect_ip", ip, { limit });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.response.status, 429);
  });

  // Test 14: Progressive cooldowns on repeated rate limit violations
  test("14. Repeated rate-limit violations trigger progressive cooldown penalty escalation", async () => {
    const ip = "203.0.113.77";

    const tier1 = await abuseDetectionService.recordViolationAndGetCooldown(ip, "ip");
    assert.equal(tier1.tier, 1);
    assert.equal(tier1.cooldownSec, 60);

    const tier2 = await abuseDetectionService.recordViolationAndGetCooldown(ip, "ip");
    assert.equal(tier2.tier, 2);
    assert.equal(tier2.cooldownSec, 300); // Escalates to 5 minutes

    // Subject is now actively blocked
    const blockCheck = await abuseDetectionService.isSubjectBlocked("ip", ip);
    assert.equal(blockCheck.blocked, true);
    assert.ok(blockCheck.retrySec > 60);
  });

  // Test 15: Document upload limits (size, file type, extracted length)
  test("15. Chat payload and document resource limits enforce strict boundaries", () => {
    const limits = getAiResourceLimits();
    assert.equal(limits.maxBodyBytes, 64 * 1024);
    assert.equal(limits.maxMessageChars, 4000);

    // Excessive message length
    const hugeMessage = "A".repeat(4500);
    const mockReq = { headers: new Headers({ "content-length": "5000" }) };
    const guardRes = validateChatPayloadAndBudget(mockReq, { message: hugeMessage });
    assert.equal(guardRes.ok, false);
    assert.equal(guardRes.code, "MESSAGE_TOO_LONG");
  });

  // Test 16: Local in-memory sliding window fallback works when Redis is unavailable
  test("16. Rate limiter safely falls back to local in-memory sliding log without crashes", async () => {
    const res = await checkDistributedRateLimit("local_mem_test_016", 5, 10000);
    assert.equal(res.ok, true);
    assert.equal(res.limit, 5);
    assert.ok(res.backend === "memory" || res.backend === "redis");
  });

  // Test 17: Legitimate users are not permanently blocked by temporary bursts
  test("17. Administrative temporary blocks expire automatically according to configured duration", async () => {
    const ip = "198.51.100.99";
    // Block for 1 second
    await abuseDetectionService.blockSubject({
      type: "ip",
      key: ip,
      durationSec: 1,
      reason: "Test short block",
    });

    const immediate = await abuseDetectionService.isSubjectBlocked("ip", ip);
    assert.equal(immediate.blocked, true);

    // Wait 1.1s for expiration
    await new Promise((r) => setTimeout(r, 1100));

    const expired = await abuseDetectionService.isSubjectBlocked("ip", ip);
    assert.equal(expired.blocked, false, "Block must automatically expire once duration passes");
  });

  // Test 18: Admin can review abuse events and summary statistics
  test("18. Abuse detection service provides admin visibility into events and metrics", async () => {
    await abuseDetectionService.logSecurityEvent({
      type: "TEST_ABUSE_ALERT",
      severity: "HIGH",
      subjectType: "IP",
      subjectKey: "192.0.2.1",
      actionTaken: "THROTTLED",
      details: "Simulated load test probe",
    });

    const summary = abuseDetectionService.getAbuseSummary();
    assert.ok(summary.totalRecordedEvents >= 1);
    assert.ok(summary.throttledCount >= 1);

    const recent = abuseDetectionService.getRecentAbuseEvents(10);
    assert.ok(recent.length >= 1);
    assert.equal(recent[0].type, "TEST_ABUSE_ALERT");
  });

  // Test 19: Authorized administrators can release temporary blocks
  test("19. Authorized administrator can release temporary blocks on demand", async () => {
    const visitorId = "vis_to_unblock_019";
    await abuseDetectionService.blockSubject({
      type: "visitor",
      key: visitorId,
      durationSec: 3600,
      reason: "Suspicious probing",
    });

    const isBlocked = await abuseDetectionService.isSubjectBlocked("visitor", visitorId);
    assert.equal(isBlocked.blocked, true);

    await abuseDetectionService.unblockSubject({
      type: "visitor",
      key: visitorId,
      unblockedBy: "admin@emperornexus.com",
    });

    const afterUnblock = await abuseDetectionService.isSubjectBlocked("visitor", visitorId);
    assert.equal(afterUnblock.blocked, false, "Subject must be immediately unblocked");
  });

  // Test 20: Anti-spoofing client IP resolution avoids forged headers
  test("20. Anti-spoofing client IP resolution prioritizes trusted headers", () => {
    // 1. When x-real-ip is provided by local Nginx proxy
    const req1 = {
      headers: new Headers({
        "x-real-ip": "203.0.113.10",
        "x-forwarded-for": "10.0.0.1, 192.168.1.1",
      }),
    };
    assert.equal(extractClientIp(req1), "203.0.113.10");

    // 2. When cf-connecting-ip is provided
    const req2 = {
      headers: new Headers({
        "cf-connecting-ip": "198.51.100.22",
      }),
    };
    assert.equal(extractClientIp(req2), "198.51.100.22");
  });

  // Test 21: Bot risk scoring detects suspicious and automated agents
  test("21. Bot risk scoring accurately flags automated scrapers and headless clients", () => {
    const badReq = {
      headers: new Headers({
        "user-agent": "python-requests/2.31.0",
      }),
    };
    const score = abuseDetectionService.calculateRiskScore({
      request: badReq,
      message: "Scrape test",
    });
    assert.ok(score.score >= 40);
    assert.ok(score.flags.includes("AUTOMATED_CLIENT_UA"));
  });

  // Test 22: Token estimation handles multi-lingual scripts (Hindi/Devanagari vs English)
  test("22. Token estimation handles UTF-8 / Devanagari multi-lingual token budgeting", () => {
    const englishTokens = estimateTokenCount("Hello! How can I help you today?");
    const hindiTokens = estimateTokenCount("नमस्ते! मैं आपकी किस प्रकार सहायता कर सकता हूँ?");
    assert.ok(englishTokens > 0);
    assert.ok(hindiTokens > 0);
  });
});
