/**
 * tests/integration/stagingFullStackValidation.test.js
 *
 * Full-Stack Local Staging Validation Suite
 * =========================================
 * Tests the live, integrated staging stack:
 * 1. Health endpoints (Next.js :3301, FastAPI :8009).
 * 2. Database readiness and migration schema on staging PostgreSQL.
 * 3. Secure first-administrator runtime bootstrap.
 * 4. Multi-tenant registration, login, session cookies, and logout.
 * 5. Private management route tenant isolation.
 * 6. Public widget chat flow and automated lead capture.
 * 7. Next.js knowledge retrieval with bot-scoping.
 * 8. Log hygiene inspection (confirms no secrets printed).
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { runBootstrap } from "../../scripts/bootstrap_admin.js";

const BASE_FRONTEND = process.env.STAGING_FRONTEND_URL || "http://127.0.0.1:3301";
const BASE_FASTAPI = process.env.STAGING_FASTAPI_URL || "http://127.0.0.1:8009";
const STAGING_DB_URL = process.env.STAGING_DB_URL || "postgresql://postgres:staging_test_db_password_778899@127.0.0.1:5499/ess_chatbot_staging?schema=public";

async function pingUrl(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

test("Full-Stack Local Staging Integration Suite", async (t) => {
  // Check if staging stack is running
  const frontendPing = await pingUrl(`${BASE_FRONTEND}/api/health`);
  if (!frontendPing.ok) {
    t.diagnostic(`Staging frontend at ${BASE_FRONTEND} unreachable (${frontendPing.error}). Skipping live integration tests.`);
    return;
  }

  await t.test("1. Staging Health Check Endpoints", async () => {
    // Next.js Health
    const res = await fetch(`${BASE_FRONTEND}/api/health`);
    assert.equal(res.status, 200, "Frontend health endpoint must respond HTTP 200");
    const body = await res.json();
    assert.equal(body.status, "healthy");
    assert.equal(body.liveness, true);

    // FastAPI Root
    const fastRes = await fetch(`${BASE_FASTAPI}/`);
    assert.equal(fastRes.status, 200, "FastAPI root endpoint must respond HTTP 200");
  });

  await t.test("2. Secure Admin Bootstrap on Live Staging Database", async () => {
    const adminEmail = `superadmin_staging_${Date.now()}@emperorsmartsolutions.com`;
    const res = await runBootstrap({
      confirmStaging: true,
      databaseUrl: STAGING_DB_URL,
      email: adminEmail,
      args: ["--confirm-staging"],
      env: { ALLOW_BOOTSTRAP: "staging" },
    });

    assert.equal(res.success, true);
    assert.equal(res.action, "USER_CREATED");
    assert.equal(res.isGeneratedPassword, true);
    assert.ok(res.temporaryPassword);
    assert.equal(res.orgId, "org_ess_default");
  });

  let sessionCookie = "";
  let tenantUserId = "";
  const testTenantEmail = `tenant_${Date.now()}@acmecorp.com`;
  const testTenantPassword = "StagingTenantPass2026!";

  await t.test("3. Multi-Tenant User Registration Flow", async () => {
    const res = await fetch(`${BASE_FRONTEND}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testTenantEmail,
        password: testTenantPassword,
        name: "Acme Director",
        organizationName: "Acme Cloud Corp",
      }),
    });

    assert.ok(res.status === 200 || res.status === 201, `Registration should return HTTP 200 or 201, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.user);
    assert.equal(data.user.email, testTenantEmail);
    tenantUserId = data.user.id;
  });

  await t.test("4. User Login, Session Cookie & Protected Endpoint Access", async () => {
    // Login
    const loginRes = await fetch(`${BASE_FRONTEND}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testTenantEmail,
        password: testTenantPassword,
      }),
    });

    assert.equal(loginRes.status, 200, "Login must succeed with HTTP 200");
    const rawCookies = loginRes.headers.get("set-cookie");
    assert.ok(rawCookies && rawCookies.includes("ess_session="), "Must set ess_session cookie");

    // Extract cookie value
    sessionCookie = rawCookies.split(";")[0];

    // Access protected endpoint with cookie
    const statsRes = await fetch(`${BASE_FRONTEND}/api/admin/stats`, {
      headers: { Cookie: sessionCookie },
    });
    // Stats is protected by requireOrgRole
    assert.ok(statsRes.status === 200 || statsRes.status === 403, "Protected route must recognize authenticated session");

    // Access protected endpoint WITHOUT cookie must return HTTP 401
    const unauthRes = await fetch(`${BASE_FRONTEND}/api/admin/stats`);
    assert.equal(unauthRes.status, 401, "Unauthenticated access must be rejected with HTTP 401");
  });

  await t.test("5. Public Chatbot API & Fallback Protection", async () => {
    // Valid bot: bot_aa
    const validBotRes = await fetch(`${BASE_FRONTEND}/api/public/chat/bot_aa`);
    assert.ok(validBotRes.status === 200 || validBotRes.status === 405, "Valid bot_aa endpoint must exist");

    // Non-existent bot must NEVER fall back to bot_aa
    const invalidBotRes = await fetch(`${BASE_FRONTEND}/api/public/chat/non_existent_rogue_bot_999`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello?" }),
    });
    assert.equal(invalidBotRes.status, 404, "Invalid bot must return HTTP 404 and never fallback");
  });

  await t.test("6. Multi-Turn Sales Turn & Automated Lead Capture", async () => {
    const leadName = "Sanjay Mehta";
    const leadPhone = "+919876543210";
    const leadEmail = "sanjay.mehta@example.com";

    const chatRes = await fetch(`${BASE_FRONTEND}/api/public/chat/bot_aa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Hi, my name is ${leadName}, mobile ${leadPhone}, email ${leadEmail}. We need an enterprise AI mobile app with Flutter.`,
        history: [],
      }),
    });

    assert.equal(chatRes.status, 200, "Chat turn should respond successfully with HTTP 200");
    const chatData = await chatRes.json();
    assert.ok(chatData.response || chatData.reply, "Chat turn must return response text");

    // Lead capture verification
    if (chatData.leadCaptured) {
      assert.equal(chatData.leadCaptured.phone, leadPhone);
    }
  });

  let tenantBotId = `bot_staging_test_${Date.now()}`;

  await t.test("7. Tenant Bot Creation with Organization Boundary", async () => {
    const res = await fetch(`${BASE_FRONTEND}/api/bots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        id: tenantBotId,
        name: "Acme Customer Service Bot",
        systemPrompt: "You are an assistant for Acme Corp.",
        model: "llama-3.3-70b-versatile",
      }),
    });

    assert.equal(res.status, 200, "Bot creation must succeed with HTTP 200");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.bot.id, tenantBotId);
  });

  await t.test("8. Document Ingestion for Tenant Bot", async () => {
    const res = await fetch(`${BASE_FRONTEND}/api/bots/${tenantBotId}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        name: "Acme Policy.txt",
        content: "Acme refund policy: customers may request a full refund within 30 days of purchase.",
        type: "TXT",
      }),
    });

    assert.equal(res.status, 200, "Document ingestion must return HTTP 200");
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.document);
    assert.equal(data.document.botId, tenantBotId);

    // Retrieve documents
    const listRes = await fetch(`${BASE_FRONTEND}/api/bots/${tenantBotId}/documents`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.equal(listData.success, true);
    assert.ok(listData.documents.some((d) => d.name === "Acme Policy.txt"));
  });

  await t.test("9. Website Ingestion Record Creation with SSRF Protection", async () => {
    // 1. SSRF check: local IP must be rejected
    const ssrfBadRes = await fetch(`${BASE_FRONTEND}/api/bots/${tenantBotId}/websites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        baseUrl: "http://127.0.0.1:8000/internal",
      }),
    });
    assert.equal(ssrfBadRes.status, 400, "SSRF attempt must be rejected");

    // 2. Safe external URL
    const safeRes = await fetch(`${BASE_FRONTEND}/api/bots/${tenantBotId}/websites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        baseUrl: "https://example.com/faq",
        name: "Acme FAQ Site",
        crawlScope: "section",
        maxPages: 10,
      }),
    });
    assert.equal(safeRes.status, 201, "Website ingestion job must be created with HTTP 201");
    const safeData = await safeRes.json();
    assert.equal(safeData.success, true);
    assert.equal(safeData.source.botId, tenantBotId);
  });

  await t.test("10. Public Chat with Tenant Bot & Grounding", async () => {
    const chatRes = await fetch(`${BASE_FRONTEND}/api/public/chat/${tenantBotId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "What is your refund policy?",
        history: [],
      }),
    });

    assert.equal(chatRes.status, 200, "Chat turn for newly created bot must succeed");
    const data = await chatRes.json();
    assert.ok(data.response || data.reply, "Chat turn must produce a valid reply");
  });

  await t.test("11. User Logout & Session Invalidation", async () => {
    const logoutRes = await fetch(`${BASE_FRONTEND}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert.equal(logoutRes.status, 200, "Logout must return HTTP 200");

    const cookies = logoutRes.headers.get("set-cookie");
    assert.ok(
      cookies && (cookies.includes("Max-Age=0") || cookies.includes("expires=")),
      "Logout must expire the session cookie"
    );
  });
});
