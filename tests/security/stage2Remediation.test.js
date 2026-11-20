/**
 * Stage 2.5: Security Hardening & Regression Test Suite
 *
 * Automated verification of:
 * - SEC-02: SSE Visitor Credential Protection & Ephemeral Exchange Tickets
 * - SEC-01: Password Reset Atomic Claims & Redis Fail-Closed Behavior
 * - SEC-04: Strict Tenant Isolation & Corrupt Conversation Rejection
 * - SEC-03: Complete Elimination of Phone Enumeration Oracles
 * - SEC-05: Clean authStore Definition and Exports
 */

import test, { describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const { authStore } = await import("../../frontend/lib/db/authStore.js");
const { botsStore } = await import("../../frontend/lib/db/botsStore.js");
const { conversationsStore } = await import("../../frontend/lib/db/conversationsStore.js");
const { visitorsStore } = await import("../../frontend/lib/db/visitorsStore.js");
const { otpStore } = await import("../../frontend/lib/auth/otpStore.js");
const { sseTicketStore } = await import("../../frontend/lib/security/sseTicketStore.js");
const { signSessionToken } = await import("../../frontend/lib/auth/session.js");
const { _resetRateLimitMemory } = await import("../../frontend/lib/security/distributedRateLimit.js");

const { GET: eventsGet } = await import("../../frontend/app/api/public/chat/[botId]/events/route.js");
const { POST: ticketPost } = await import("../../frontend/app/api/public/chat/[botId]/ticket/route.js");
const { POST: forgotPasswordPost } = await import("../../frontend/app/api/auth/forgot-password/route.js");
const { POST: assignPost } = await import("../../frontend/app/api/conversations/[id]/assign/route.js");
const { POST: checkPhonePost, GET: checkPhoneGet } = await import("../../frontend/app/api/auth/check-phone/route.js");
const { POST: sendOtpPost } = await import("../../frontend/app/api/auth/otp/send/route.js");

function makeReq(url, { method = "GET", headers = {}, body = null } = {}) {
  const h = new Headers(headers);
  if (body && !(body instanceof FormData) && !h.has("content-type")) {
    h.set("content-type", "application/json");
  }
  return new Request(url, {
    method,
    headers: h,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
  });
}

function sessionCookieHeader(token) {
  return { cookie: `ess_session=${encodeURIComponent(token)}` };
}

describe("Stage 2.5 Security Hardening Master Test Suite", () => {
  let orgAId, orgBId;
  const testBotId = "bot_sec2_test_01";
  let tokenAdminOrgA, tokenMemberOrgA, tokenAdminOrgB, tokenNoOrg;
  let testUserOrgA1, testUserOrgA2, testUserOrgB;

  before(async () => {
    authStore._resetMemoryStore();
    _resetRateLimitMemory();
    sseTicketStore._resetMemoryStore();

    // Register User A1 (Admin Org A)
    const regA1 = await authStore.register({
      name: "Admin Alice",
      email: "alice@test-orga.com",
      phone: "+919876500001",
      password: "Password123!",
      organizationName: "Org Alpha Security",
      role: "ORG_ADMIN",
      phoneVerified: true,
    });
    testUserOrgA1 = regA1.user;
    orgAId = regA1.organization.id;

    // Add Member Bob to Org A
    const memberBob = await authStore.inviteOrgMember({
      organizationId: orgAId,
      email: "bob@test-orga.com",
      name: "Member Bob",
      role: "MEMBER",
    });
    testUserOrgA2 = memberBob;

    // Register User B (Admin Org B)
    const regB = await authStore.register({
      name: "Admin Charlie",
      email: "charlie@test-orgb.com",
      phone: "+919876500003",
      password: "Password123!",
      organizationName: "Org Beta Security",
      role: "ORG_ADMIN",
      phoneVerified: true,
    });
    testUserOrgB = regB.user;
    orgBId = regB.organization.id;

    // Setup Bot for Org A
    botsStore.upsertBot({
      id: testBotId,
      name: "Security Test Bot",
      organizationId: orgAId,
      allowedDomains: ["*"],
      status: "Active",
    }, orgAId);

    tokenAdminOrgA = signSessionToken({
      userId: testUserOrgA1.id,
      name: testUserOrgA1.name,
      email: testUserOrgA1.email,
      role: "USER",
      organizationId: orgAId,
      orgRole: "ORG_ADMIN",
    });

    tokenMemberOrgA = signSessionToken({
      userId: testUserOrgA2.id,
      name: testUserOrgA2.name,
      email: testUserOrgA2.email,
      role: "USER",
      organizationId: orgAId,
      orgRole: "MEMBER",
    });

    tokenAdminOrgB = signSessionToken({
      userId: testUserOrgB.id,
      name: testUserOrgB.name,
      email: testUserOrgB.email,
      role: "USER",
      organizationId: orgBId,
      orgRole: "ORG_ADMIN",
    });

    tokenNoOrg = signSessionToken({
      userId: "usr_no_org_test",
      name: "Rogue User",
      email: "rogue@no-org.test",
      role: "USER",
      organizationId: null, // No organization
      orgRole: "MEMBER",
    });
  });

  beforeEach(() => {
    _resetRateLimitMemory();
  });

  // =========================================================================
  // 1. SEC-02: SSE VISITOR CREDENTIAL PROTECTION & EXCHANGE TICKETS
  // =========================================================================
  describe("SEC-02: SSE Visitor Credential Protection & Single-Use Exchange Tickets", () => {
    let visitor1, token1, visitor2, token2, conversation1;

    before(async () => {
      // Create Visitor 1
      const v1Res = visitorsStore.createVisitor({
        organizationId: orgAId,
        botId: testBotId,
        name: "Legitimate Visitor 1",
      });
      visitor1 = v1Res.visitor;
      token1 = v1Res.rawToken;

      // Create Visitor 2
      const v2Res = visitorsStore.createVisitor({
        organizationId: orgAId,
        botId: testBotId,
        name: "Different Visitor 2",
      });
      visitor2 = v2Res.visitor;
      token2 = v2Res.rawToken;

      // Create Conversation bound to Visitor 1
      conversation1 = conversationsStore.createConversation({
        id: `conv_sec02_test_${Date.now()}`,
        organizationId: orgAId,
        botId: testBotId,
        visitorId: visitor1.id,
        status: "AI_ACTIVE",
      });
    });

    test("1.1 Rejects SSE connection with HTTP 403 when visitor authentication is absent", async () => {
      const req = makeReq(`http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}`);
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 403, "Must return HTTP 403 Forbidden when visitor token/ticket is absent");
      const data = await res.json();
      assert.ok(data.error.includes("Visitor token is required"), "Must report missing visitor authentication");
    });

    test("1.2 Unauthenticated probe on nonexistent conversationId returns 403 before conversation lookup (anti-probing)", async () => {
      const req = makeReq(`http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=conv_does_not_exist_999`);
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 403, "Must return 403 before checking conversation existence to eliminate enumeration oracle");
    });

    test("1.3 Issues ephemeral single-use 60s exchange ticket via POST", async () => {
      const req = makeReq(`http://localhost:3000/api/public/chat/${testBotId}/ticket`, {
        method: "POST",
        body: { visitorToken: token1 },
      });
      const res = await ticketPost(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 200, "Must successfully issue ticket for valid visitor token");
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(data.ticket.startsWith("tkt_"), "Ticket must have tkt_ prefix");
      assert.equal(data.expiresIn, 60, "Ticket TTL must be 60 seconds");
    });

    test("1.4 Rejects ticket issuance with HTTP 403 for forged or invalid visitorToken", async () => {
      const req = makeReq(`http://localhost:3000/api/public/chat/${testBotId}/ticket`, {
        method: "POST",
        body: { visitorToken: "invalid_token_1234567890abcdef" },
      });
      const res = await ticketPost(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 403, "Must reject invalid credentials with HTTP 403");
    });

    test("1.5 Connects to SSE stream using exchange ticket (?ticket=tkt_...)", async () => {
      // 1. Issue ticket
      const ticket = await sseTicketStore.createTicket(testBotId, visitor1.id, 60);

      // 2. Connect to SSE
      const req = makeReq(
        `http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}&ticket=${ticket}`
      );
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 200, "Must establish SSE connection with valid ticket");
      assert.equal(res.headers.get("content-type"), "text/event-stream; charset=utf-8");
    });

    test("1.6 Single-use ticket consumption: replaying the identical ticket is rejected with HTTP 403", async () => {
      // 1. Issue ticket
      const ticket = await sseTicketStore.createTicket(testBotId, visitor1.id, 60);

      // 2. First connection consumes ticket
      const req1 = makeReq(
        `http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}&ticket=${ticket}`
      );
      const res1 = await eventsGet(req1, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res1.status, 200, "First connection must succeed");

      // 3. Second connection with same ticket must be rejected
      const req2 = makeReq(
        `http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}&ticket=${ticket}`
      );
      const res2 = await eventsGet(req2, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res2.status, 403, "Replayed exchange ticket must return HTTP 403");
      const data2 = await res2.json();
      assert.ok(data2.error.includes("Invalid or expired exchange ticket"));
    });

    test("1.7 Rejects SSE connection when ticket belongs to a different visitor", async () => {
      // Issue ticket for Visitor 2, but attempt to connect to Visitor 1's conversation
      const ticketV2 = await sseTicketStore.createTicket(testBotId, visitor2.id, 60);
      const req = makeReq(
        `http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}&ticket=${ticketV2}`
      );
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 403, "Must reject mismatched visitor token/ticket with HTTP 403");
    });
  });

  // =========================================================================
  // 2. SEC-01: PASSWORD RESET ATOMIC CLAIMS & REDIS FAIL-CLOSED CHECKS
  // =========================================================================
  describe("SEC-01: Password Reset Atomic Claims & Fail-Closed Behavior", () => {
    const testPhone = "+919876543210";

    before(async () => {
      await authStore.register({
        name: "Reset Target User",
        email: "target@reset-test.com",
        phone: testPhone,
        password: "OldPassword123!",
        organizationName: "Reset Test Org",
        role: "MEMBER",
        phoneVerified: true,
      });
    });

    test("2.1 claimVerificationToken validates and claims token single-use", async () => {
      const token = otpStore.createVerificationToken(testPhone, "password_reset");
      const claim1 = await otpStore.claimVerificationToken(testPhone, token, "password_reset");
      assert.equal(claim1.ok, true, "First claim must succeed");

      const claim2 = await otpStore.claimVerificationToken(testPhone, token, "password_reset");
      assert.equal(claim2.ok, false, "Second claim with same token must fail");
      assert.ok(claim2.error.includes("already been used"), "Must specify token already used");
    });

    test("2.2 Concurrent claims on the same token resolve with exactly ONE winner", async () => {
      const token = otpStore.createVerificationToken(testPhone, "password_reset");

      const [res1, res2] = await Promise.all([
        otpStore.claimVerificationToken(testPhone, token, "password_reset"),
        otpStore.claimVerificationToken(testPhone, token, "password_reset"),
      ]);

      const successCount = [res1, res2].filter((r) => r.ok).length;
      const failCount = [res1, res2].filter((r) => !r.ok).length;

      assert.equal(successCount, 1, "Exactly one concurrent claim must succeed");
      assert.equal(failCount, 1, "Exactly one concurrent claim must fail");
    });

    test("2.3 Password reset route consumes verification token and prevents token replay", async () => {
      const token = otpStore.createVerificationToken(testPhone, "password_reset");

      const req1 = makeReq("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        body: {
          phone: testPhone,
          verificationToken: token,
          password: "BrandNewPassword123!",
        },
      });
      const res1 = await forgotPasswordPost(req1);
      assert.equal(res1.status, 200, "First password reset must succeed");

      const req2 = makeReq("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        body: {
          phone: testPhone,
          verificationToken: token,
          password: "AttackerReplayPassword123!",
        },
      });
      const res2 = await forgotPasswordPost(req2);
      assert.equal(res2.status, 403, "Replayed token must return HTTP 403 Forbidden");
    });

    test("2.4 Token claim fails closed when Redis is configured but disconnected", async () => {
      process.env.REDIS_HOST = "127.0.0.99"; // Non-existent Redis
      process.env.REDIS_PORT = "6399";

      const token = otpStore.createVerificationToken(testPhone, "password_reset");
      const claim = await otpStore.claimVerificationToken(testPhone, token, "password_reset");
      assert.equal(claim.ok, false, "Must fail closed when Redis is configured but disconnected");
      assert.ok(claim.error.includes("temporarily unavailable"), "Must return temporary unavailability message");

      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
    });
  });

  // =========================================================================
  // 3. SEC-04: STRICT TENANT ISOLATION & CORRUPT RECORD REJECTION
  // =========================================================================
  describe("SEC-04: Strict Tenant Isolation & Corrupt Conversation Rejection", () => {
    let orgAConv;

    before(() => {
      orgAConv = conversationsStore.createConversation({
        id: `conv_assign_test_${Date.now()}`,
        organizationId: orgAId,
        botId: testBotId,
        visitorName: "Support Visitor",
        status: "WAITING_FOR_HUMAN",
      });
    });

    test("3.1 Rejects assigning conversation to a user belonging to another organization (Org B)", async () => {
      const req = makeReq(`http://localhost:3000/api/conversations/${orgAConv.id}/assign`, {
        method: "POST",
        headers: { ...sessionCookieHeader(tokenAdminOrgA) },
        body: {
          targetUserId: testUserOrgB.id,
          targetUserName: "Admin Charlie",
        },
      });

      const res = await assignPost(req, { params: Promise.resolve({ id: orgAConv.id }) });
      assert.equal(res.status, 400, "Must reject cross-tenant assignment with HTTP 400 Bad Request");
      const data = await res.json();
      assert.ok(data.error.includes("not an active member of this organization"));
    });

    test("3.2 Rejects assignment when caller session has no organizationId context", async () => {
      const req = makeReq(`http://localhost:3000/api/conversations/${orgAConv.id}/assign`, {
        method: "POST",
        headers: { ...sessionCookieHeader(tokenNoOrg) },
        body: {
          targetUserId: testUserOrgA1.id,
          targetUserName: "Admin Alice",
        },
      });

      const res = await assignPost(req, { params: Promise.resolve({ id: orgAConv.id }) });
      assert.equal(res.status, 403, "Caller without organizationId context must receive HTTP 403");
      const data = await res.json();
      assert.ok(data.error.includes("Missing organization context"));
    });

    test("3.3 Rejects assignment when conversation record has missing/corrupted organizationId", async () => {
      const corruptConv = conversationsStore.createConversation({
        id: `conv_corrupt_${Date.now()}`,
        organizationId: null, // Corrupt tenant ID
        botId: testBotId,
        status: "WAITING_FOR_HUMAN",
      });

      const req = makeReq(`http://localhost:3000/api/conversations/${corruptConv.id}/assign`, {
        method: "POST",
        headers: { ...sessionCookieHeader(tokenAdminOrgA) },
        body: {
          targetUserId: testUserOrgA1.id,
          targetUserName: "Admin Alice",
        },
      });

      const res = await assignPost(req, { params: Promise.resolve({ id: corruptConv.id }) });
      assert.ok(
        res.status === 404 || res.status === 422,
        `Expected HTTP 404/422 for corrupt conversation, received ${res.status}`
      );
    });

    test("3.4 Allows assigning conversation to an active member within the SAME organization", async () => {
      const req = makeReq(`http://localhost:3000/api/conversations/${orgAConv.id}/assign`, {
        method: "POST",
        headers: { ...sessionCookieHeader(tokenAdminOrgA) },
        body: {
          targetUserId: testUserOrgA2.id,
          targetUserName: testUserOrgA2.name,
        },
      });

      const res = await assignPost(req, { params: Promise.resolve({ id: orgAConv.id }) });
      assert.equal(res.status, 200, "Must succeed with HTTP 200 for valid same-organization member");
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.conversation.assignedToId, testUserOrgA2.id);
    });
  });

  // =========================================================================
  // 4. SEC-03: COMPLETE ELIMINATION OF PHONE ENUMERATION ORACLES
  // =========================================================================
  describe("SEC-03: Complete Elimination of Phone Enumeration Oracles", () => {
    test("4.1 check-phone returns generic success for valid numbers without revealing account existence", async () => {
      // Test registered phone
      const req1 = makeReq("http://localhost:3000/api/auth/check-phone", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.1" },
        body: { phone: "9876500001" },
      });
      const res1 = await checkPhonePost(req1);
      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.success, true);
      assert.equal(data1.valid, true);
      assert.equal(data1.exists, undefined, "exists boolean MUST NOT be present in response");

      // Test unregistered phone: returns IDENTICAL response
      const req2 = makeReq("http://localhost:3000/api/auth/check-phone", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.2" },
        body: { phone: "9111111111" },
      });
      const res2 = await checkPhonePost(req2);
      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.success, true);
      assert.equal(data2.valid, true);
      assert.equal(data2.exists, undefined, "exists boolean MUST NOT be present in response");
    });

    test("4.2 Rejects malformed or incomplete phone numbers (<10 digits)", async () => {
      const req = makeReq("http://localhost:3000/api/auth/check-phone", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.3" },
        body: { phone: "123" },
      });
      const res = await checkPhonePost(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.valid, false);
    });

    test("4.3 otp/send returns generic success without leaking 404 for unregistered login/reset numbers", async () => {
      const req = makeReq("http://localhost:3000/api/auth/otp/send", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.4" },
        body: { phone: "+919111111111", purpose: "password_reset" },
      });
      const res = await sendOtpPost(req);
      assert.equal(res.status, 200, "Must return HTTP 200 generic message without 404 leak");
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.notFound, undefined, "Must not return notFound boolean");
    });

    test("4.4 Enforces rate limiting on repeated check-phone requests (HTTP 429)", async () => {
      const clientIp = "203.0.113.88";
      let blockedResponse = null;

      for (let i = 0; i < 25; i++) {
        const req = makeReq("http://localhost:3000/api/auth/check-phone", {
          method: "POST",
          headers: { "x-forwarded-for": clientIp },
          body: { phone: `98765${String(i).padStart(5, "0")}` },
        });
        const res = await checkPhonePost(req);
        if (res.status === 429) {
          blockedResponse = res;
          break;
        }
      }

      assert.ok(blockedResponse !== null, "Must throttle enumeration attempts with HTTP 429");
      assert.equal(blockedResponse.status, 429);
      assert.ok(blockedResponse.headers.get("retry-after"), "Must include Retry-After header");
    });
  });

  // =========================================================================
  // 5. SEC-05: SINGLE DEFINITION OF checkPhoneExists IN authStore
  // =========================================================================
  describe("SEC-05: Single Clean Definition of checkPhoneExists in authStore", () => {
    test("5.1 authStore defines checkPhoneExists exactly once in source code", () => {
      const authStorePath = path.resolve(process.cwd(), "frontend/lib/auth/authStore.js");
      const fileContent = fs.readFileSync(authStorePath, "utf8");
      const matches = fileContent.match(/async\s+checkPhoneExists\s*\(/g) || [];
      assert.equal(matches.length, 1, `Expected exactly 1 definition of checkPhoneExists, found ${matches.length}`);
    });

    test("5.2 checkPhoneExists operates properly across varying phone formats", async () => {
      const exists1 = await authStore.checkPhoneExists("+919876500001");
      assert.equal(exists1, true, "Must match +91 international format");

      const exists2 = await authStore.checkPhoneExists("9876500001");
      assert.equal(exists2, true, "Must match 10-digit national format");

      const notExists = await authStore.checkPhoneExists("9999999999");
      assert.equal(notExists, false, "Must return false for unregistered phone");
    });
  });
});
