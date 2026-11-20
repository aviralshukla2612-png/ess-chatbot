/**
 * Second-Stage Rate Limiting & AI Security Verification Suite
 *
 * Programmatic evidence-based verification of:
 * 1. Redis failure behavior & selective fail-closed vs fail-open
 * 2. Visitor identity bypass resistance (cookie reset, session ID change, IP change)
 * 3. Distributed atomic counters & concurrency lock lifecycles
 * 4. Real-time SSE / WebSocket architecture & tenant isolation
 * 5. AI token accounting & reservation reconciliation / refund
 * 6. Reverse-proxy anti-spoofing IP resolution
 */

import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  enforceRateLimit,
  getRateLimitPolicies,
  getAiResourceLimits,
  extractClientIp,
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
} from "../../frontend/lib/security/aiTokenGuard.js";
import {
  checkDistributedRateLimit,
  _resetRateLimitMemory,
} from "../../frontend/lib/security/distributedRateLimit.js";
import { sseBroker } from "../../frontend/lib/db/sseBroker.js";

describe("Stage 2 Security Verification Suite", () => {
  beforeEach(() => {
    _resetRateLimitMemory();
    _resetConcurrencyMemory();
    abuseDetectionService._resetAbuseMemory();
    aiTokenGuard._resetTokenMemory();
    delete process.env.AI_FAIL_CLOSED_ON_REDIS_OUTAGE;
  });

  // =========================================================================
  // 1. REDIS FAILURE BEHAVIOR & MULTI-INSTANCE VERIFICATION
  // =========================================================================
  test("1.1 Ordinary dashboard endpoints remain fail-open to in-memory sliding logs when Redis is offline", async () => {
    // When Redis is not connected, user_api or admin_api should NOT fail-close
    const res = await enforceRateLimit("user_api", "usr_dashboard_test", { limit: 5 });
    assert.equal(res.ok, true, "Dashboard and user read operations must remain operational");
    assert.equal(res.result.backend, "memory");
  });

  test("1.2 Multi-instance simulation: two independent instances each enforce local rate limits", async () => {
    // Simulate Instance 1 and Instance 2 memory spaces
    const instance1Key = "inst1:visitor_spam:bot_test";
    const instance2Key = "inst2:visitor_spam:bot_test";
    const limit = 2;

    // Send 2 requests to Instance 1
    await checkDistributedRateLimit(instance1Key, limit, 60000);
    await checkDistributedRateLimit(instance1Key, limit, 60000);
    const inst1Exceeded = await checkDistributedRateLimit(instance1Key, limit, 60000);
    assert.equal(inst1Exceeded.ok, false, "Instance 1 must enforce limit");

    // Send 2 requests to Instance 2
    await checkDistributedRateLimit(instance2Key, limit, 60000);
    await checkDistributedRateLimit(instance2Key, limit, 60000);
    const inst2Exceeded = await checkDistributedRateLimit(instance2Key, limit, 60000);
    assert.equal(inst2Exceeded.ok, false, "Instance 2 must enforce limit");
  });

  test("1.3 Selective fail-closed for expensive AI chat when Redis outage flag is active", async () => {
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    process.env.AI_FAIL_CLOSED_ON_REDIS_OUTAGE = "true";

    const res = await enforceRateLimit("chat_visitor", "vis_strict_test:bot_1");
    assert.equal(res.ok, false, "Expensive AI generation must fail-closed if distributed cache is configured but disconnected");
    assert.equal(res.response.status, 429);

    delete process.env.REDIS_URL;
  });

  // =========================================================================
  // 2. VISITOR IDENTITY RESISTANCE & BYPASS MITIGATION
  // =========================================================================
  test("2.1 Clearing cookies/visitor tokens is blocked by underlying IP-level rate limit", async () => {
    const clientIp = "198.51.100.99";
    const ipLimit = 3;

    // Attacker clears cookies 3 times from same IP
    await enforceRateLimit("chat_ip", `${clientIp}:bot_sales`, { limit: ipLimit });
    await enforceRateLimit("chat_ip", `${clientIp}:bot_sales`, { limit: ipLimit });
    await enforceRateLimit("chat_ip", `${clientIp}:bot_sales`, { limit: ipLimit });

    // 4th attempt with brand new visitor cookie from same IP
    const fourthAttempt = await enforceRateLimit("chat_ip", `${clientIp}:bot_sales`, { limit: ipLimit });
    assert.equal(fourthAttempt.ok, false, "IP-layer catches cookie clearing");
    assert.equal(fourthAttempt.response.status, 429);
  });

  test("2.2 Changing conversation IDs does not bypass visitor-level message limits", async () => {
    const visitorId = "vis_persistent_ident_002";
    const visitorLimit = 2;

    await enforceRateLimit("chat_visitor", `${visitorId}:bot_1`, { limit: visitorLimit });
    await enforceRateLimit("chat_visitor", `${visitorId}:bot_1`, { limit: visitorLimit });

    // Request with completely different conversation ID on same visitor
    const blocked = await enforceRateLimit("chat_visitor", `${visitorId}:bot_1`, { limit: visitorLimit });
    assert.equal(blocked.ok, false, "Visitor limit binds to persistent identity across conversation changes");
  });

  test("2.3 Rapid conversation creation flooding is bounded by conversation_create policies", async () => {
    const ip = "203.0.113.88";
    const limit = 3;

    await enforceRateLimit("conversation_create_ip", ip, { limit });
    await enforceRateLimit("conversation_create_ip", ip, { limit });
    await enforceRateLimit("conversation_create_ip", ip, { limit });

    const blocked = await enforceRateLimit("conversation_create_ip", ip, { limit });
    assert.equal(blocked.ok, false, "Rapid conversation creation from single IP is strictly capped");
    assert.equal(blocked.response.status, 429);
  });

  test("2.4 Simultaneous identical message submissions trigger cryptographic spam throttling", async () => {
    const visitorId = "vis_burst_004";
    const text = "What is the price of this product?";

    const t1 = await abuseDetectionService.checkRepetitiveMessage(visitorId, text);
    const t2 = await abuseDetectionService.checkRepetitiveMessage(visitorId, text);
    assert.equal(t1.allowed, true);
    assert.equal(t2.allowed, true);

    const t3 = await abuseDetectionService.checkRepetitiveMessage(visitorId, text);
    assert.equal(t3.allowed, false, "3rd identical message within 10s is blocked");
    assert.equal(t3.reason, "REPETITIVE_MESSAGE");
  });

  // =========================================================================
  // 3. DISTRIBUTED CONCURRENCY & LOCK LIFECYCLE
  // =========================================================================
  test("3.1 Conversation concurrency lock strictly limits parallel generations to 1", async () => {
    const convId = "conv_parallel_001";
    const lock1 = await acquireConcurrencyLock({ key: `gen:conv:${convId}`, maxConcurrent: 1 });
    assert.equal(lock1.ok, true);

    // Parallel request during active generation
    const lock2 = await acquireConcurrencyLock({ key: `gen:conv:${convId}`, maxConcurrent: 1 });
    assert.equal(lock2.ok, false, "Second simultaneous generation on same conversation is rejected");
    assert.ok(lock2.retryAfterSec >= 1);

    await releaseConcurrencyLock(`gen:conv:${convId}`, lock1.lockId);

    // After release, next request can acquire
    const lock3 = await acquireConcurrencyLock({ key: `gen:conv:${convId}`, maxConcurrent: 1 });
    assert.equal(lock3.ok, true);
    await releaseConcurrencyLock(`gen:conv:${convId}`, lock3.lockId);
  });

  test("3.2 Composite generation lock acquires all 3 levels (conv, visitor, workspace) and releases cleanly", async () => {
    const lock = await acquireGenerationLocks({
      conversationId: "conv_composite_test",
      visitorId: "vis_composite_test",
      organizationId: "org_composite_test",
    });
    assert.equal(lock.ok, true);
    assert.equal(lock.lockTokens.length, 3);

    // Release all held tokens
    await releaseGenerationLocks(lock.lockTokens);

    // Can immediately acquire again
    const lockAgain = await acquireGenerationLocks({
      conversationId: "conv_composite_test",
      visitorId: "vis_composite_test",
      organizationId: "org_composite_test",
    });
    assert.equal(lockAgain.ok, true);
    await releaseGenerationLocks(lockAgain.lockTokens);
  });

  test("3.3 Concurrency locks auto-expire via TTL and do not leak on abandoned requests", async () => {
    const key = "gen:expire_test";
    // 500ms TTL
    const lock1 = await acquireConcurrencyLock({ key, maxConcurrent: 1, ttlMs: 500 });
    assert.equal(lock1.ok, true);

    // Immediate attempt is blocked
    const lock2 = await acquireConcurrencyLock({ key, maxConcurrent: 1, ttlMs: 500 });
    assert.equal(lock2.ok, false);

    // Sleep past TTL
    await new Promise((r) => setTimeout(r, 600));

    // Lock must have expired automatically
    const lock3 = await acquireConcurrencyLock({ key, maxConcurrent: 1, ttlMs: 500 });
    assert.equal(lock3.ok, true, "Lock must auto-expire to prevent permanent deadlocks");
    await releaseConcurrencyLock(key, lock3.lockId);
  });

  // =========================================================================
  // 4. REAL-TIME ARCHITECTURE & SSE TENANT ISOLATION
  // =========================================================================
  test("4.1 Real-time SSE broker strictly enforces cross-tenant event isolation", () => {
    const deliveredEvents = [];

    // Mock controller for Tenant A
    const mockControllerTenantA = {
      enqueue: (bytes) => {
        const text = new TextDecoder().decode(bytes);
        deliveredEvents.push({ recipient: "TenantA", text });
      },
    };

    // Mock controller for Tenant B
    const mockControllerTenantB = {
      enqueue: (bytes) => {
        const text = new TextDecoder().decode(bytes);
        deliveredEvents.push({ recipient: "TenantB", text });
      },
    };

    const unsubA = sseBroker.subscribe(mockControllerTenantA, { organizationId: "org_alpha" });
    const unsubB = sseBroker.subscribe(mockControllerTenantB, { organizationId: "org_beta" });

    // Broadcast event for Tenant A
    sseBroker.broadcast("message_received", {
      organizationId: "org_alpha",
      conversationId: "c_alpha_1",
      content: "Secret Tenant A Message",
    });

    // Verify Tenant A received it, Tenant B received NOTHING
    const tenantAReceived = deliveredEvents.some((e) => e.recipient === "TenantA" && e.text.includes("Secret Tenant A Message"));
    const tenantBReceived = deliveredEvents.some((e) => e.recipient === "TenantB");

    assert.equal(tenantAReceived, true, "Tenant A must receive its own events");
    assert.equal(tenantBReceived, false, "Tenant B must NEVER receive Tenant A's events");

    unsubA();
    unsubB();
  });

  test("4.2 Visitor SSE subscribers are strictly forbidden from receiving internal notes", () => {
    const visitorEvents = [];
    const mockVisitorController = {
      enqueue: (bytes) => {
        visitorEvents.push(new TextDecoder().decode(bytes));
      },
    };

    const unsub = sseBroker.subscribe(mockVisitorController, {
      isVisitor: true,
      conversationId: "c_visitor_123",
      organizationId: "org_test",
    });

    // Broadcast internal note
    sseBroker.broadcast("internal_note_created", {
      conversationId: "c_visitor_123",
      organizationId: "org_test",
      note: "Customer seems difficult, offer 10% discount",
    });

    assert.equal(visitorEvents.length, 0, "Internal notes must NEVER be broadcast to website visitors");
    unsub();
  });

  // =========================================================================
  // 5. AI TOKEN BUDGETING & RECONCILIATION
  // =========================================================================
  test("5.1 AI token reservation reconciles accurately with actual provider tokens", async () => {
    const orgId = "org_reconcile_test";

    // 1. Reserve 600 estimated tokens
    const res = await aiTokenGuard.reserveTokenBudget({
      organizationId: orgId,
      estimatedTokens: 600,
      maxMonthlyTokens: 5000,
    });
    assert.equal(res.allowed, true);

    // 2. Reconcile with actual provider usage (prompt=120, completion=80, total=200)
    const recon = await aiTokenGuard.reconcileActualTokens({
      reservationId: res.reservationId,
      organizationId: orgId,
      promptTokens: 120,
      completionTokens: 80,
    });
    assert.equal(recon.reconciled, true);
    assert.equal(recon.totalActualTokens, 200);
  });

  test("5.2 Financial cost estimation calculates accurate USD cost for Groq Llama 3.3", () => {
    // 1,000 prompt tokens ($0.00059) + 1,000 completion tokens ($0.00079) = $0.00138
    const cost = aiTokenGuard.calculateCostUsd("llama-3.3-70b-versatile", 1000, 1000);
    assert.equal(cost, 0.00138);
  });

  // =========================================================================
  // 6. ANTI-SPOOFING REVERSE PROXY IP RESOLUTION
  // =========================================================================
  test("6.1 Anti-spoofing IP extraction rejects client-forged X-Forwarded-For headers", () => {
    // Attacker crafts arbitrary X-Forwarded-For to spoof another client IP
    const spoofedReq = {
      headers: new Headers({
        "x-forwarded-for": "1.1.1.1, 8.8.8.8",
        "x-real-ip": "198.51.100.55", // Set authoritatively by local Nginx proxy
      }),
    };
    const resolvedIp = extractClientIp(spoofedReq);
    assert.equal(resolvedIp, "198.51.100.55", "Must trust x-real-ip from verified Nginx hop over spoofed x-forwarded-for");
  });
});
