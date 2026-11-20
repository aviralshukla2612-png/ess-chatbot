/**
 * Stage 2: Security Remediation & Regression Test Suite
 *
 * Automated verification of remediations for:
 * - SEC-02: Public SSE Visitor Authentication Bypass (events route)
 * - SEC-01: Password Reset Verification Token Replay & Race Conditions (otpStore & forgot-password route)
 * - SEC-04: Cross-Tenant Conversation Assignment (assign route)
 * - SEC-03: Phone Number Enumeration & Rate Limiting (check-phone route)
 * - SEC-05: Duplicate Method Declaration in authStore
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
const { signSessionToken } = await import("../../frontend/lib/auth/session.js");
const { _resetRateLimitMemory } = await import("../../frontend/lib/security/distributedRateLimit.js");

const { GET: eventsGet } = await import("../../frontend/app/api/public/chat/[botId]/events/route.js");
const { POST: forgotPasswordPost } = await import("../../frontend/app/api/auth/forgot-password/route.js");
const { POST: assignPost } = await import("../../frontend/app/api/conversations/[id]/assign/route.js");
const { POST: checkPhonePost, GET: checkPhoneGet } = await import("../../frontend/app/api/auth/check-phone/route.js");

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

describe("Stage 2 Security Remediation Test Suite", () => {
  let orgAId, orgBId;
  const testBotId = "bot_sec2_test_01";
  let tokenAdminOrgA, tokenMemberOrgA, tokenAdminOrgB;
  let testUserOrgA1, testUserOrgA2, testUserOrgB;

  before(async () => {
    authStore._resetMemoryStore();
    _resetRateLimitMemory();

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
  });

  beforeEach(() => {
    _resetRateLimitMemory();
  });

  // =========================================================================
  // 1. SEC-02: PUBLIC SSE VISITOR AUTHENTICATION BYPASS VERIFICATION
  // =========================================================================
  describe("SEC-02: Public SSE Visitor Authentication Enforcement", () => {
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

    test("1.1 Rejects SSE connection with HTTP 403 when visitor token is missing entirely", async () => {
      const req = makeReq(`http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}`);
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 403, "Must return HTTP 403 Forbidden when visitor token is absent");
      const data = await res.json();
      assert.ok(data.error.includes("Visitor token is required"), "Must report missing visitor token");
    });

    test("1.2 Rejects SSE connection with HTTP 403 when visitor token is invalid or unauthenticated", async () => {
      const req = makeReq(`http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}&visitorToken=invalid_fake_token_1234567890abcdef`);
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 403, "Must return HTTP 403 Forbidden for forged visitor token");
      const data = await res.json();
      assert.ok(data.error.includes("Invalid or expired visitor token"), "Must report invalid token");
    });

    test("1.3 Rejects SSE connection with HTTP 403 when visitor token belongs to a different visitor (eavesdropping prevention)", async () => {
      // Visitor 2 attempts to listen into Visitor 1's conversation
      const req = makeReq(
        `http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}&visitorToken=${token2}`
      );
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 403, "Must return HTTP 403 Forbidden when token does not match conversation's visitorId");
      const data = await res.json();
      assert.ok(data.error.includes("Unauthorized visitor token"), "Must reject mismatched visitor");
    });

    test("1.4 Rejects SSE connection with HTTP 404 if conversation does not exist or belongs to another bot", async () => {
      const req = makeReq(
        `http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=non_existent_conv_999&visitorToken=${token1}`
      );
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 404, "Must return HTTP 404 for non-existent conversation");
    });

    test("1.5 Permits SSE connection when legitimate visitor token matches conversation owner", async () => {
      const req = makeReq(
        `http://localhost:3000/api/public/chat/${testBotId}/events?conversationId=${conversation1.id}&visitorToken=${token1}`
      );
      const res = await eventsGet(req, { params: Promise.resolve({ botId: testBotId }) });
      assert.equal(res.status, 200, "Must return HTTP 200 OK for verified visitor token");
      assert.equal(res.headers.get("content-type"), "text/event-stream; charset=utf-8");
    });
  });

  // =========================================================================
  // 2. SEC-01: PASSWORD RESET TOKEN REPLAY & ATOMIC CLAIM VERIFICATION
  // =========================================================================
  describe("SEC-01: Password Reset Token Replay & Race Condition Prevention", () => {
    const testPhone = "+919876543210";

    before(async () => {
      // Ensure test user exists for reset
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

      // Immediate second claim with the same token must be rejected
      const claim2 = await otpStore.claimVerificationToken(testPhone, token, "password_reset");
      assert.equal(claim2.ok, false, "Second claim with same token must fail");
      assert.ok(claim2.error.includes("already been used"), "Must specify token already used");
    });

    test("2.2 Concurrent claims on the same token resolve with exactly ONE winner", async () => {
      const token = otpStore.createVerificationToken(testPhone, "password_reset");

      // Simultaneous claim attempts
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

      // 1. First reset request
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
      const data1 = await res1.json();
      assert.equal(data1.success, true);

      // 2. Replayed reset request with the identical token must be rejected with 403
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
      const data2 = await res2.json();
      assert.equal(data2.success, false);
      assert.ok(data2.error.includes("already been used") || data2.error.includes("invalid"), "Must reject reused token");
    });

    test("2.4 Rejects claim if purpose does not match", async () => {
      const token = otpStore.createVerificationToken(testPhone, "login");
      const claim = await otpStore.claimVerificationToken(testPhone, token, "password_reset");
      assert.equal(claim.ok, false, "Must reject token created for 'login' when claiming for 'password_reset'");
    });
  });

  // =========================================================================
  // 3. SEC-04: CROSS-TENANT CONVERSATION ASSIGNMENT VERIFICATION
  // =========================================================================
  describe("SEC-04: Cross-Tenant Conversation Assignment Boundary Enforcement", () => {
    let orgAConv;

    before(() => {
      // Create conversation in Org A
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
          targetUserId: testUserOrgB.id, // User from Org B!
          targetUserName: "Admin Charlie",
        },
      });

      const res = await assignPost(req, { params: Promise.resolve({ id: orgAConv.id }) });
      assert.equal(res.status, 400, "Must reject cross-tenant assignment with HTTP 400 Bad Request");
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.error.includes("not an active member of this organization"), "Must report not an active member");
    });

    test("3.2 Rejects assigning conversation to an unknown / fabricated userId", async () => {
      const req = makeReq(`http://localhost:3000/api/conversations/${orgAConv.id}/assign`, {
        method: "POST",
        headers: { ...sessionCookieHeader(tokenAdminOrgA) },
        body: {
          targetUserId: "usr_fabricated_ghost_id_999",
          targetUserName: "Ghost User",
        },
      });

      const res = await assignPost(req, { params: Promise.resolve({ id: orgAConv.id }) });
      assert.equal(res.status, 400, "Must reject non-member assignment with HTTP 400 Bad Request");
      const data = await res.json();
      assert.equal(data.success, false);
    });

    test("3.3 Rejects non-admin attempting to assign conversation to another user", async () => {
      const req = makeReq(`http://localhost:3000/api/conversations/${orgAConv.id}/assign`, {
        method: "POST",
        headers: { ...sessionCookieHeader(tokenMemberOrgA) }, // Non-admin member
        body: {
          targetUserId: testUserOrgA1.id,
          targetUserName: "Admin Alice",
        },
      });

      const res = await assignPost(req, { params: Promise.resolve({ id: orgAConv.id }) });
      assert.equal(res.status, 403, "Must return HTTP 403 Forbidden when non-admin attempts assignment");
      const data = await res.json();
      assert.equal(data.success, false);
      assert.ok(data.error.includes("Only administrators can assign"), "Must enforce admin role");
    });

    test("3.4 Allows assigning conversation to an active member within the SAME organization", async () => {
      const req = makeReq(`http://localhost:3000/api/conversations/${orgAConv.id}/assign`, {
        method: "POST",
        headers: { ...sessionCookieHeader(tokenAdminOrgA) },
        body: {
          targetUserId: testUserOrgA2.id, // Active member of Org A
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
  // 4. SEC-03: PHONE NUMBER ENUMERATION & RATE LIMITING VERIFICATION
  // =========================================================================
  describe("SEC-03: Phone Number Rate Limiting & Privacy Preservation", () => {
    test("4.1 check-phone returns privacy-preserving boolean exists without exposing metadata", async () => {
      const req = makeReq("http://localhost:3000/api/auth/check-phone", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.1" },
        body: { phone: "9876500001" }, // Alice's phone
      });

      const res = await checkPhonePost(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.exists, true);
      // Verify no PII, user records, or org info are leaked
      assert.equal(data.email, undefined);
      assert.equal(data.name, undefined);
      assert.equal(data.organizationId, undefined);
      assert.equal(data.role, undefined);
    });

    test("4.2 Rejects malformed or incomplete phone numbers (<10 digits)", async () => {
      const req = makeReq("http://localhost:3000/api/auth/check-phone", {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.2" },
        body: { phone: "123" },
      });

      const res = await checkPhonePost(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.exists, false);
    });

    test("4.3 Enforces rate limiting on repeated check-phone requests (HTTP 429)", async () => {
      const clientIp = "203.0.113.88";
      let blockedResponse = null;

      // Burst 25 requests (limit is 20 per minute)
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
      const blockedData = await blockedResponse.json();
      assert.ok(blockedData.error.includes("Too many"), "Must return rate-limit error message");
    });
  });

  // =========================================================================
  // 5. SEC-05: DUPLICATE METHOD DECLARATION IN authStore VERIFICATION
  // =========================================================================
  describe("SEC-05: Single Clean Definition of checkPhoneExists in authStore", () => {
    test("5.1 authStore defines checkPhoneExists exactly once in source code", () => {
      const authStorePath = path.resolve(process.cwd(), "frontend/lib/auth/authStore.js");
      const fileContent = fs.readFileSync(authStorePath, "utf8");
      const matches = fileContent.match(/async\s+checkPhoneExists\s*\(/g) || [];
      assert.equal(matches.length, 1, `Expected exactly 1 definition of checkPhoneExists, found ${matches.length}`);
    });

    test("5.2 checkPhoneExists operates properly across varying phone formats", async () => {
      // Existing phone
      const exists1 = await authStore.checkPhoneExists("+919876500001");
      assert.equal(exists1, true, "Must match +91 international format");

      const exists2 = await authStore.checkPhoneExists("9876500001");
      assert.equal(exists2, true, "Must match 10-digit national format");

      // Non-existent phone
      const notExists = await authStore.checkPhoneExists("9999999999");
      assert.equal(notExists, false, "Must return false for unregistered phone");
    });
  });
});
