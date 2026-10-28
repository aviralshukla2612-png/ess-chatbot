/**
 * tests/security/edgeMiddlewareAuth.test.js
 *
 * Security Regression Test Suite for Edge Middleware Authentication
 * Validates that frontend/middleware.js cryptographically verifies HMAC-SHA256
 * signatures, rejecting forged, tampered, expired, and unsigned JWT tokens.
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { middleware, verifyEdgeSession } from "../../frontend/middleware.js";
import { signSessionToken, verifySessionToken } from "../../frontend/lib/auth/session.js";

function createMockRequest(pathname, sessionCookie = null) {
  const url = `http://localhost:3000${pathname}`;
  return {
    url,
    nextUrl: {
      pathname,
      searchParams: new URLSearchParams(),
    },
    cookies: {
      get(name) {
        if (name === "ess_session" && sessionCookie) {
          return { value: sessionCookie };
        }
        return undefined;
      },
    },
  };
}

test("Edge Middleware Security Suite — Cryptographic Session Verification", async (t) => {
  const secret = process.env.SESSION_SECRET || "ess_dev_secret_replace_in_prod_minimum_32_chars_long_123456";

  await t.test("1. Accepts a legitimately signed active session token for dashboard route", async () => {
    const validToken = signSessionToken({
      userId: "usr_legit_tenant_1",
      email: "tenant@example.com",
      role: "USER",
      organizationId: "org_alpha",
      orgRole: "MEMBER",
    });

    const verified = await verifyEdgeSession(validToken);
    assert.ok(verified, "verifyEdgeSession should successfully verify authentic token");
    assert.equal(verified.userId, "usr_legit_tenant_1");
    assert.equal(verified.role, "USER");

    const req = createMockRequest("/dashboard", validToken);
    const res = await middleware(req);
    // When allowed, NextResponse.next() returns response without redirecting to /login
    assert.ok(!res || !res.headers?.get("location")?.includes("/login"), "Legitimate session must not be redirected to login");
  });

  await t.test("2. Rejects forged SUPER_ADMIN token with invalid signature and redirects to /login", async () => {
    // Attacker crafts a base64 JWT payload claiming SUPER_ADMIN
    const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payloadB64 = Buffer.from(JSON.stringify({
      userId: "usr_attacker",
      email: "attacker@evil.com",
      role: "SUPER_ADMIN",
      orgRole: "SUPER_ADMIN",
      exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString("base64url");
    const fakeSignature = "dummysignaturenotrealhmac256xyz123";
    const forgedToken = `${headerB64}.${payloadB64}.${fakeSignature}`;

    const verified = await verifyEdgeSession(forgedToken);
    assert.equal(verified, null, "verifyEdgeSession must reject forged token signature");

    // Test actual middleware execution
    const req = createMockRequest("/admin", forgedToken);
    const res = await middleware(req);
    assert.ok(res, "Middleware must return a response");
    const location = res.headers?.get("location");
    assert.ok(location?.includes("/login"), "Forged SUPER_ADMIN must be redirected to /login");
  });

  await t.test("3. Rejects tampered payload on a previously valid token", async () => {
    const validToken = signSessionToken({
      userId: "usr_normal",
      role: "USER",
      organizationId: "org_beta",
    });

    const [header, payload, sig] = validToken.split(".");
    // Tamper payload to elevate role to SUPER_ADMIN without changing signature
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    decodedPayload.role = "SUPER_ADMIN";
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decodedPayload)).toString("base64url");
    const tamperedToken = `${header}.${tamperedPayloadB64}.${sig}`;

    const verified = await verifyEdgeSession(tamperedToken);
    assert.equal(verified, null, "Tampered payload must fail cryptographic signature verification");

    const req = createMockRequest("/admin", tamperedToken);
    const res = await middleware(req);
    const location = res.headers?.get("location");
    assert.ok(location?.includes("/login"), "Tampered token must be redirected to /login");
  });

  await t.test("4. Rejects tampered signature characters on a valid payload", async () => {
    const validToken = signSessionToken({
      userId: "usr_normal",
      role: "USER",
    });

    const [header, payload, sig] = validToken.split(".");
    const tamperedSig = sig.slice(0, -4) + "AAAA";
    const tamperedToken = `${header}.${payload}.${tamperedSig}`;

    const verified = await verifyEdgeSession(tamperedToken);
    assert.equal(verified, null, "Tampered signature characters must be rejected");
  });

  await t.test("5. Rejects expired session token even with a valid signature", async () => {
    // Generate token expired 10 minutes ago
    const expiredToken = signSessionToken(
      { userId: "usr_expired", role: "USER" },
      -600
    );

    const verified = await verifyEdgeSession(expiredToken);
    assert.equal(verified, null, "Expired token must be rejected");

    const req = createMockRequest("/dashboard", expiredToken);
    const res = await middleware(req);
    const location = res.headers?.get("location");
    assert.ok(location?.includes("/login"), "Expired token must redirect to /login");
  });

  await t.test("6. Rejects malformed tokens (wrong parts, non-base64, empty)", async () => {
    const malformedCases = [
      "",
      "not.enough",
      "way.too.many.parts.here",
      "!!!.@@@.###",
      null,
      undefined,
    ];

    for (const badToken of malformedCases) {
      const verified = await verifyEdgeSession(badToken);
      assert.equal(verified, null, `Malformed token '${badToken}' must return null`);

      const req = createMockRequest("/dashboard", badToken);
      const res = await middleware(req);
      const location = res.headers?.get("location");
      assert.ok(location?.includes("/login"), `Malformed token '${badToken}' must redirect to /login`);
    }
  });

  await t.test("7. Valid non-super-admin user attempting /admin is redirected to /dashboard", async () => {
    const regularUserToken = signSessionToken({
      userId: "usr_regular",
      role: "USER",
      organizationId: "org_sample",
      orgRole: "MEMBER",
    });

    const req = createMockRequest("/admin", regularUserToken);
    const res = await middleware(req);
    assert.ok(res, "Middleware must return response for unauthorized admin access");
    const location = res.headers?.get("location");
    assert.ok(location?.includes("/dashboard"), "Regular user must be redirected to /dashboard");
    assert.ok(location?.includes("unauthorized_admin"), "Redirect must carry unauthorized_admin query");
  });

  await t.test("8. Valid SUPER_ADMIN user accessing /admin is allowed through", async () => {
    const superAdminToken = signSessionToken({
      userId: "usr_super",
      role: "SUPER_ADMIN",
      email: "admin@platform.com",
    });

    const req = createMockRequest("/admin", superAdminToken);
    const res = await middleware(req);
    assert.ok(!res || !res.headers?.get("location")?.includes("/login"), "SUPER_ADMIN must not be redirected to login");
    assert.ok(!res || !res.headers?.get("location")?.includes("/dashboard"), "SUPER_ADMIN must not be redirected to dashboard");
  });

  await t.test("9. Missing or weak SESSION_SECRET in production fails safely for both sign and verify", async () => {
    const origEnv = process.env.NODE_ENV;
    const origSecret = process.env.SESSION_SECRET;

    try {
      process.env.NODE_ENV = "production";
      process.env.SESSION_SECRET = ""; // missing

      // Signing in production with missing secret must throw
      assert.throws(
        () => signSessionToken({ userId: "u1", role: "USER" }),
        /SESSION_SECRET/
      );

      // Verifying in production with missing secret must fail closed
      const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1MSIsImV4cCI6OTk5OTk5OTk5OX0.sig";
      const verifiedEdge = await verifyEdgeSession(fakeToken);
      assert.equal(verifiedEdge, null, "Edge verification with missing secret must return null");
      const verifiedSession = verifySessionToken(fakeToken);
      assert.equal(verifiedSession, null, "Session verification with missing secret must return null");

      // Weak secret in production must also fail
      process.env.SESSION_SECRET = "short_insecure";
      assert.throws(
        () => signSessionToken({ userId: "u1", role: "USER" }),
        /SESSION_SECRET/
      );
      assert.equal(await verifyEdgeSession(fakeToken), null);
      assert.equal(verifySessionToken(fakeToken), null);

      // Placeholder secret in production must fail
      process.env.SESSION_SECRET = "replace_me_with_a_real_secret_key_long_enough_123";
      assert.throws(
        () => signSessionToken({ userId: "u1", role: "USER" }),
        /SESSION_SECRET/
      );
      assert.equal(await verifyEdgeSession(fakeToken), null);
      assert.equal(verifySessionToken(fakeToken), null);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.SESSION_SECRET = origSecret;
    }
  });

  await t.test("10. Missing or non-numeric expiry claim is strictly rejected", async () => {
    const currentSecret = process.env.SESSION_SECRET || "ess_dev_secret_replace_in_prod_minimum_32_chars_long_123456";

    function craftTokenWithPayload(customPayload) {
      const headerB64 = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
      const payloadB64 = Buffer.from(JSON.stringify(customPayload)).toString("base64url");
      const data = `${headerB64}.${payloadB64}`;
      const sig = crypto.createHmac("sha256", currentSecret).update(data).digest("base64url");
      return `${data}.${sig}`;
    }

    // Token without exp claim
    const tokenNoExp = craftTokenWithPayload({
      userId: "usr_no_exp",
      role: "USER",
      organizationId: "org_alpha",
    });
    assert.equal(await verifyEdgeSession(tokenNoExp), null, "Edge middleware must reject token without exp claim");
    assert.equal(verifySessionToken(tokenNoExp), null, "Session guard must reject token without exp claim");

    // Token with string exp claim
    const tokenStringExp = craftTokenWithPayload({
      userId: "usr_str_exp",
      exp: "never_expires_2099",
      role: "USER",
    });
    assert.equal(await verifyEdgeSession(tokenStringExp), null, "Edge middleware must reject non-numeric string exp");
    assert.equal(verifySessionToken(tokenStringExp), null, "Session guard must reject non-numeric string exp");

    // Token with null exp claim
    const tokenNullExp = craftTokenWithPayload({
      userId: "usr_null_exp",
      exp: null,
      role: "USER",
    });
    assert.equal(await verifyEdgeSession(tokenNullExp), null, "Must reject null exp claim");
    assert.equal(verifySessionToken(tokenNullExp), null, "Must reject null exp claim");
  });

  await t.test("11. Valid signed and unexpired session accepted by both edge and session guards", async () => {
    const validToken = signSessionToken({
      userId: "usr_valid_both",
      role: "USER",
      organizationId: "org_beta",
      orgRole: "MEMBER",
    });

    const edgeVerified = await verifyEdgeSession(validToken);
    assert.ok(edgeVerified, "Edge verification must accept valid token");
    assert.equal(edgeVerified.userId, "usr_valid_both");

    const sessionVerified = verifySessionToken(validToken);
    assert.ok(sessionVerified, "Session verification must accept valid token");
    assert.equal(sessionVerified.userId, "usr_valid_both");
  });
});
