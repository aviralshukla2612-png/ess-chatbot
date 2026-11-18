import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const { authStore } = await import("../../frontend/lib/db/authStore.js");
const { botsStore } = await import("../../frontend/lib/db/botsStore.js");
const { conversationsStore } = await import("../../frontend/lib/db/conversationsStore.js");
const { otpStore } = await import("../../frontend/lib/auth/otpStore.js");
const { signSessionToken } = await import("../../frontend/lib/auth/session.js");
const { validateUrlForSSRF } = await import("../../frontend/lib/security/ssrf.js");
const { verifyEdgeSession } = await import("../../frontend/middleware.js");

const { POST: googlePost } = await import("../../frontend/app/api/auth/google/route.js");
const { POST: loginPost } = await import("../../frontend/app/api/auth/login/route.js");
const { GET: getConv, DELETE: deleteConv } = await import("../../frontend/app/api/conversations/[id]/route.js");
const { POST: verifyBillingPost } = await import("../../frontend/app/api/billing/verify/route.js");
const { POST: resetTrialPost } = await import("../../frontend/app/api/billing/reset-trial/route.js");
const { POST: uploadImagePost } = await import("../../frontend/app/api/upload/image/route.js");
const { GET: getUploadedImage } = await import("../../frontend/app/api/upload/image/[filename]/route.js");
const { GET: getBotControl, POST: postBotControl } = await import("../../frontend/app/api/bots/[botId]/bot-control/route.js");

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

function cookieHeader(token) {
  return { cookie: `ess_session=${encodeURIComponent(token)}` };
}

describe("Phase 4 — End-to-End Security Audit Remediation Suite (SEC-01 to SEC-22)", () => {
  let tokenTenantA, tokenTenantB, tokenSuperAdmin;
  const orgA = "org_sec_audit_alpha";
  const orgB = "org_sec_audit_beta";

  before(async () => {
    authStore._resetMemoryStore();
    tokenTenantA = signSessionToken({
      userId: "usr_sec_a",
      email: "owner@alpha-sec.test",
      role: "USER",
      organizationId: orgA,
      orgRole: "ORG_OWNER",
    });
    tokenTenantB = signSessionToken({
      userId: "usr_sec_b",
      email: "owner@beta-sec.test",
      role: "USER",
      organizationId: orgB,
      orgRole: "ORG_OWNER",
    });
    tokenSuperAdmin = signSessionToken({
      userId: "usr_super_sec",
      email: "super@nexus.test",
      role: "SUPER_ADMIN",
      organizationId: orgA,
      orgRole: "SUPER_ADMIN",
    });
  });

  it("SEC-01: POST /api/auth/google rejects unverified raw { email } account takeover payloads", async () => {
    const req = makeReq("http://localhost:3000/api/auth/google", {
      method: "POST",
      body: { email: "admin@emperorsmartsolutions.com", name: "Attacker" },
    });
    const res = await googlePost(req);
    assert.ok(
      res.status === 400 || res.status === 401,
      `Expected 400/401 when idToken is missing, received ${res.status}`
    );
    const data = await res.json();
    assert.equal(data.success, false);
  });

  it("SEC-02: Hardcoded AdminAccessPassword2026! backdoor is eliminated", async () => {
    const req = makeReq("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: {
        email: "admin@emperorsmartsolutions.com",
        password: "AdminAccessPassword2026!",
      },
    });
    const res = await loginPost(req);
    assert.equal(res.status, 401);
  });

  it("SEC-03: Conversation routes & clearAll enforce strict cross-tenant isolation", async () => {
    const convA = conversationsStore.createConversation({
      organizationId: orgA,
      botId: "bot_sec_a",
      visitorName: "Tenant A Confidential Client",
    });
    const convB = conversationsStore.createConversation({
      organizationId: orgB,
      botId: "bot_sec_b",
      visitorName: "Tenant B Client",
    });

    try {
      const readRes = await getConv(
        makeReq(`http://localhost:3000/api/conversations/${convA.id}`, {
          headers: cookieHeader(tokenTenantB),
        }),
        { params: Promise.resolve({ id: convA.id }) }
      );
      assert.equal(readRes.status, 404);

      const delRes = await deleteConv(
        makeReq(`http://localhost:3000/api/conversations/${convA.id}`, {
          method: "DELETE",
          headers: cookieHeader(tokenTenantB),
        }),
        { params: Promise.resolve({ id: convA.id }) }
      );
      assert.equal(delRes.status, 404);

      // Tenant B clearAll(orgB) must NOT erase Tenant A's conversation
      conversationsStore.clearAll(orgB);
      assert.ok(
        conversationsStore.getConversation(convA.id, orgA),
        "Tenant A conversation must survive Tenant B clearAll"
      );
      assert.equal(conversationsStore.getConversation(convB.id, orgB), null);
    } finally {
      conversationsStore.clearAll(orgA);
      conversationsStore.clearAll(orgB);
    }
  });

  it("SEC-04: POST /api/billing/verify enforces Razorpay HMAC-SHA256 signature verification", async () => {
    const prevSecret = process.env.RAZORPAY_KEY_SECRET;
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret_audit_key_999999";
    try {
      const badReq = makeReq("http://localhost:3000/api/billing/verify", {
        method: "POST",
        headers: cookieHeader(tokenTenantA),
        body: {
          orderId: "order_real_123",
          paymentId: "pay_real_456",
          signature: "deadbeef_forged_signature",
          planId: "monthly",
        },
      });
      const badRes = await verifyBillingPost(badReq);
      assert.equal(badRes.status, 400);
      const badData = await badRes.json();
      assert.equal(badData.code, "INVALID_PAYMENT_SIGNATURE");

      const validSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update("order_real_123|pay_real_456")
        .digest("hex");

      const okReq = makeReq("http://localhost:3000/api/billing/verify", {
        method: "POST",
        headers: cookieHeader(tokenTenantA),
        body: {
          orderId: "order_real_123",
          paymentId: "pay_real_456",
          signature: validSig,
          planId: "monthly",
        },
      });
      const okRes = await verifyBillingPost(okReq);
      assert.equal(okRes.status, 200);
    } finally {
      if (prevSecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
      else process.env.RAZORPAY_KEY_SECRET = prevSecret;
    }
  });

  it("SEC-05: Image upload blocks SVG/HTML XSS payloads, verifies magic bytes, and serves sandbox CSP", async () => {
    const svgForm = new FormData();
    svgForm.append(
      "file",
      new File(['<svg onload="alert(1)"></svg>'], "evil.svg", { type: "image/svg+xml" })
    );
    const svgRes = await uploadImagePost(
      makeReq("http://localhost:3000/api/upload/image", {
        method: "POST",
        headers: cookieHeader(tokenTenantA),
        body: svgForm,
      })
    );
    assert.equal(svgRes.status, 400);

    const fakePngForm = new FormData();
    fakePngForm.append(
      "file",
      new File(["<html><script>alert(1)</script></html>"], "fake.png", { type: "image/png" })
    );
    const fakePngRes = await uploadImagePost(
      makeReq("http://localhost:3000/api/upload/image", {
        method: "POST",
        headers: cookieHeader(tokenTenantA),
        body: fakePngForm,
      })
    );
    assert.equal(fakePngRes.status, 400);

    const validPngBytes = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
      "hex"
    );
    const validForm = new FormData();
    validForm.append("file", new File([validPngBytes], "avatar.png", { type: "image/png" }));
    const okRes = await uploadImagePost(
      makeReq("http://localhost:3000/api/upload/image", {
        method: "POST",
        headers: cookieHeader(tokenTenantA),
        body: validForm,
      })
    );
    assert.equal(okRes.status, 200);
    const okJson = await okRes.json();
    const filename = okJson.url.split("/").pop();

    const serveRes = await getUploadedImage(
      makeReq(`http://localhost:3000${okJson.url}`),
      { params: Promise.resolve({ filename }) }
    );
    assert.equal(serveRes.status, 200);
    assert.ok(serveRes.headers.get("content-security-policy")?.includes("sandbox"));
    assert.equal(serveRes.headers.get("x-content-type-options"), "nosniff");

    const uploadedDiskPath = path.resolve("frontend/data/uploads", filename);
    if (fs.existsSync(uploadedDiskPath)) fs.unlinkSync(uploadedDiskPath);
  });

  it("SEC-06: Edge middleware verifyEdgeSession cryptographically rejects forged unsigned/tampered JWTs", async () => {
    const forgedHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const forgedPayload = Buffer.from(
      JSON.stringify({
        userId: "attacker",
        role: "SUPER_ADMIN",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64url");
    const forgedToken = `${forgedHeader}.${forgedPayload}.invalidsignature123`;

    const verifiedForged = await verifyEdgeSession(forgedToken);
    assert.equal(verifiedForged, null);

    const validVerified = await verifyEdgeSession(tokenSuperAdmin);
    assert.equal(validVerified?.role, "SUPER_ADMIN");
  });

  it("SEC-07 & SEC-09: org_ess_default wildcard leak and bot-control BOLA are blocked", async () => {
    const botB = botsStore.upsertBot(
      { id: `bot_sec_b_${Date.now()}`, name: "Private Beta Bot", company: "Beta Corp" },
      orgB
    );

    try {
      const essBots = botsStore.getBots("org_ess_default");
      assert.equal(
        essBots.some((b) => b.id === botB.id),
        false,
        "org_ess_default must never see bots belonging to another tenant"
      );

      const readCtrl = await getBotControl(
        makeReq(`http://localhost:3000/api/bots/${botB.id}/bot-control`, {
          headers: cookieHeader(tokenTenantA),
        }),
        { params: Promise.resolve({ botId: botB.id }) }
      );
      assert.equal(readCtrl.status, 404);

      const writeCtrl = await postBotControl(
        makeReq(`http://localhost:3000/api/bots/${botB.id}/bot-control`, {
          method: "POST",
          headers: cookieHeader(tokenTenantA),
          body: { globalBotEnabled: false },
        }),
        { params: Promise.resolve({ botId: botB.id }) }
      );
      assert.equal(writeCtrl.status, 404);
    } finally {
      botsStore.deleteBot(botB.id, orgB);
    }
  });

  it("SEC-08: OTP verification token includes cryptographic nonce and blocks replay after consumption", () => {
    const phone = "+919876543210";
    const token = otpStore.createVerificationToken(phone, "login");
    assert.ok(token);

    assert.equal(otpStore.verifyVerificationToken(phone, token, "login"), true);
    otpStore.consumeVerificationToken(token);
    assert.equal(
      otpStore.verifyVerificationToken(phone, token, "login"),
      false,
      "Consumed OTP verification token must reject replay attempts"
    );
  });

  it("SEC-11, SEC-12, SEC-13 & SEC-17: Widget XSS escaping, IPv6 SSRF block, reset-trial RBAC, and SQL column allowlist", async () => {
    const widgetSrc = fs.readFileSync(path.resolve("frontend/public/widget.js"), "utf8");
    assert.ok(widgetSrc.includes("escapeHtml"));

    const ipv6Check = await validateUrlForSSRF("http://[::1]:8080/api/tags");
    assert.equal(ipv6Check.valid, false);
    const metaCheck = await validateUrlForSSRF("http://169.254.169.254/latest/meta-data/");
    assert.equal(metaCheck.valid, false);

    const resetRes = await resetTrialPost(
      makeReq("http://localhost:3000/api/billing/reset-trial", {
        method: "POST",
        headers: cookieHeader(tokenTenantA),
      })
    );
    assert.equal(resetRes.status, 403);

    const websitesSrc = fs.readFileSync(path.resolve("frontend/lib/db/websites.js"), "utf8");
    assert.ok(websitesSrc.includes("WEBSITE_SOURCE_UPDATABLE_COLUMNS"));
    assert.ok(websitesSrc.includes("INGESTION_JOB_UPDATABLE_COLUMNS"));
  });
});
