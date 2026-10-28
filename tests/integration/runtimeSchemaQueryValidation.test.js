/**
 * tests/integration/runtimeSchemaQueryValidation.test.js
 *
 * Runtime Schema & Application Query Compatibility Test Suite
 * Validates application queries against the staging PostgreSQL schema:
 * - Registration, Login, and Password Hashing
 * - Organization Membership and SUPER_ADMIN RBAC
 * - Bot retrieval and tenant boundary isolation
 * - Leads creation and querying
 * - API Key creation, hashing, and verification
 * - Billing and Usage record logging
 * - Ingestion and Website crawler records
 * - Dual Vector search (Next.js "KnowledgeChunk" and FastAPI knowledge_chunks)
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { queryDb, getDbPool } from "../../frontend/lib/db/dbPool.js";
import { authStore } from "../../frontend/lib/auth/authStore.js";
import { botsStore } from "../../frontend/lib/db/botsStore.js";
import { leadsStore } from "../../frontend/lib/db/leadsStore.js";

const TEST_DB_AVAILABLE = Boolean(process.env.DATABASE_URL);

test("Runtime Schema Validation Suite", async (t) => {
  if (!TEST_DB_AVAILABLE) {
    t.diagnostic("DATABASE_URL not set; skipping live PostgreSQL query tests.");
    return;
  }

  // Verify DB connectivity
  const pingRes = await queryDb("SELECT 1 AS alive;");
  if (!pingRes.ok) {
    t.diagnostic("Database unreachable; skipping runtime query tests.");
    return;
  }

  await t.test("1. Tables & Extensions Exist", async () => {
    const extRes = await queryDb("SELECT extname FROM pg_extension WHERE extname = 'vector';");
    assert.equal(extRes.ok, true);
    assert.equal(extRes.rows.length, 1, "vector extension must be installed");

    const tablesRes = await queryDb(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    assert.equal(tablesRes.ok, true);
    const tableNames = tablesRes.rows.map((r) => r.table_name);

    const requiredTables = [
      "Organization", "User", "OrganizationMembership", "Bot", "Visitor",
      "Conversation", "Message", "Lead", "KnowledgeDocument", "KnowledgeChunk",
      "knowledge_chunks", "WebsiteSource", "WebsitePage", "IngestionJob",
      "WidgetInstallation", "Subscription", "UsageRecord", "ApiKey",
      "BillingEvent", "WebhookConfig", "WebhookDelivery", "AuditLog", "WhatsAppMapping"
    ];

    for (const table of requiredTables) {
      assert.ok(tableNames.includes(table), `Table ${table} must exist in public schema`);
    }
  });

  await t.test("2. User Registration & Organization Membership Flow", async () => {
    const testEmail = `tenant_user_${Date.now()}@example.com`;
    const regResult = await authStore.register({
      email: testEmail,
      password: "StrongTenantPassword2026!",
      name: "Tenant Test User",
      organizationName: "Tenant Test Corp",
      role: "ORG_OWNER",
    });

    assert.ok(regResult.user.id.startsWith("usr_"));
    assert.equal(regResult.user.email, testEmail);
    assert.equal(regResult.orgRole, "ORG_OWNER");

    // Verify records exist in PostgreSQL
    const userInDb = await queryDb('SELECT "id", "email", "role", "status" FROM "User" WHERE "id" = $1;', [regResult.user.id]);
    assert.equal(userInDb.ok, true);
    assert.equal(userInDb.rows.length, 1);
    assert.equal(userInDb.rows[0].email, testEmail);

    const membershipInDb = await queryDb(
      'SELECT "id", "organizationId", "userId", "role" FROM "OrganizationMembership" WHERE "userId" = $1;',
      [regResult.user.id]
    );
    assert.equal(membershipInDb.ok, true);
    assert.equal(membershipInDb.rows.length, 1);
    assert.equal(membershipInDb.rows[0].role, "ORG_OWNER");
  });

  await t.test("3. User Login & Constant-Time Password Verification", async () => {
    const testEmail = `login_user_${Date.now()}@example.com`;
    const plainPassword = "LoginTestSecurePassword2026!";
    await authStore.register({
      email: testEmail,
      password: plainPassword,
      name: "Login Verifier",
      organizationName: "Login Verification Corp",
    });

    // Valid login
    const loginRes = await authStore.login({
      email: testEmail,
      password: plainPassword,
    });
    assert.ok(loginRes.user);
    assert.equal(loginRes.user.email, testEmail);

    // Invalid password must fail
    await assert.rejects(
      async () => {
        await authStore.login({
          email: testEmail,
          password: "WrongPassword999!",
        });
      },
      /Invalid email or password/
    );
  });

  await t.test("4. Bot Ownership & Tenant Scoping", async () => {
    // Check seeded bot_aa in org_default
    const botRes = await botsStore.getBotAsync("bot_aa", "org_default");
    assert.ok(botRes, "bot_aa must be retrievable in org_default");
    assert.equal(botRes.id, "bot_aa");
    assert.equal(botRes.organizationId, "org_default");

    // Check seeded bot_aa_primary in org_ess_default
    const primaryBot = await botsStore.getBotAsync("bot_aa_primary", "org_ess_default");
    assert.ok(primaryBot, "bot_aa_primary must be retrievable in org_ess_default");
    assert.equal(primaryBot.organizationId, "org_ess_default");

    // Cross-tenant lookup should fail / return null when scoped to another org
    const foreignLookup = await queryDb(
      'SELECT "id" FROM "Bot" WHERE "id" = $1 AND "organizationId" = $2;',
      ["bot_aa", "org_ess_default"]
    );
    assert.equal(foreignLookup.rows.length, 0, "bot_aa does not belong to org_ess_default");
  });

  await t.test("5. API Key Generation & Constant-Time Hash Lookup", async () => {
    const keyName = "Staging CI Test Key";
    const createdKey = await authStore.createApiKey("org_ess_default", keyName);
    assert.ok(createdKey.secretKey.startsWith("ess_live_"));
    assert.ok(createdKey.id.startsWith("key_"));

    // Verify key via verifyApiKey
    const verified = await authStore.verifyApiKey(createdKey.secretKey);
    assert.ok(verified, "Generated key must verify successfully against PostgreSQL");
    assert.equal(verified.organizationId, "org_ess_default");
    assert.equal(verified.name, keyName);

    // Tampered key must fail
    const tampered = `${createdKey.secretKey.slice(0, -4)}xxxx`;
    const failedVerify = await authStore.verifyApiKey(tampered);
    assert.equal(failedVerify, null, "Tampered key must return null");
  });

  await t.test("6. Leads Creation & Tenant Isolation", async () => {
    const leadId = `lead_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const insertLead = await queryDb(
      `INSERT INTO "Lead" ("id", "organizationId", "botId", "name", "email", "phone", "company", "score", "status", "inquiry", "budget", "source", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING "id";`,
      [leadId, "org_ess_default", "bot_aa_primary", "Rohan Patel", "rohan@example.com", "+919876543210", "Direct Inbound", "Hot", "New", "Need custom AI Chatbot", "₹50,000+", "Web Widget"]
    );
    assert.equal(insertLead.ok, true);
    assert.equal(insertLead.rows[0].id, leadId);

    // Retrieve via tenant query
    const tenantLeads = await queryDb(
      'SELECT "id", "name", "email" FROM "Lead" WHERE "organizationId" = $1 AND "botId" = $2;',
      ["org_ess_default", "bot_aa_primary"]
    );
    assert.equal(tenantLeads.ok, true);
    const found = tenantLeads.rows.some((r) => r.id === leadId);
    assert.ok(found, "Lead must be retrievable under its tenant scope");
  });

  await t.test("7. Billing Subscriptions & Usage Records", async () => {
    const subRes = await queryDb(
      'SELECT "id", "provider", "planId", "status" FROM "Subscription" WHERE "organizationId" = $1;',
      ["org_ess_default"]
    );
    assert.equal(subRes.ok, true);
    assert.ok(subRes.rows.length >= 1, "org_ess_default must have an active subscription");
    assert.equal(subRes.rows[0].status, "active");

    const usageId = `usg_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const usageRes = await queryDb(
      `INSERT INTO "UsageRecord" ("id", "organizationId", "metric", "quantity", "periodKey", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING "id";`,
      [usageId, "org_ess_default", "ai_messages", 1, "2026-10"]
    );
    assert.equal(usageRes.ok, true);
  });

  await t.test("8. Website Crawl Ingestion Records", async () => {
    const sourceId = `ws_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const sourceRes = await queryDb(
      `INSERT INTO "WebsiteSource" ("id", "organizationId", "botId", "name", "baseUrl", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING "id";`,
      [sourceId, "org_ess_default", "bot_aa_primary", "ESS Website", "https://emperorsmartsolutions.com", "Crawling"]
    );
    assert.equal(sourceRes.ok, true);

    const pageId = `wp_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const pageRes = await queryDb(
      `INSERT INTO "WebsitePage" ("id", "websiteSourceId", "organizationId", "botId", "url", "crawlStatus", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING "id";`,
      [pageId, sourceId, "org_ess_default", "bot_aa_primary", "https://emperorsmartsolutions.com/services", "Indexed"]
    );
    assert.equal(pageRes.ok, true);
  });

  await t.test("9. Vector Cosine Distance on Next.js 'KnowledgeChunk'", async () => {
    // Generate a test 768-dim vector
    const testVector = Array.from({ length: 768 }, (_, i) => (i === 0 ? 1.0 : 0.0));
    const vectorStr = `[${testVector.join(",")}]`;

    // Insert chunk with embedding
    const chunkId = `chk_test_${Date.now()}`;
    const insertRes = await queryDb(
      `INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "embedding", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW()) RETURNING "id";`,
      [chunkId, "doc_emperor_smart_solutions_01", "org_default", "bot_aa", 99, "Cosine vector test chunk", vectorStr]
    );
    assert.equal(insertRes.ok, true);

    try {
      // Search using <=> cosine distance operator
      const searchRes = await queryDb(
        `SELECT "id", "content", ("embedding" <=> $1::vector) AS distance
         FROM "KnowledgeChunk"
         WHERE "organizationId" = $2 AND "botId" = $3 AND "embedding" IS NOT NULL
         ORDER BY distance ASC
         LIMIT 1;`,
        [vectorStr, "org_default", "bot_aa"]
      );
      assert.equal(searchRes.ok, true);
      assert.equal(searchRes.rows.length, 1);
      assert.equal(searchRes.rows[0].id, chunkId);
      assert.ok(searchRes.rows[0].distance < 0.001, "Distance to self should be near 0");
    } finally {
      await queryDb('DELETE FROM "KnowledgeChunk" WHERE "id" = $1;', [chunkId]);
    }
  });

  await t.test("10. Vector Cosine Distance on FastAPI 'knowledge_chunks'", async () => {
    const testVector = Array.from({ length: 768 }, (_, i) => (i === 1 ? 1.0 : 0.0));
    const vectorStr = `[${testVector.join(",")}]`;

    // Insert into FastAPI table
    const insertRes = await queryDb(
      `INSERT INTO knowledge_chunks (title, category, content, embedding, created_at)
       VALUES ($1, $2, $3, $4::vector, NOW()) RETURNING id;`,
      ["FastAPI Vector Test", "Test", "FastAPI RAG Content", vectorStr]
    );
    assert.equal(insertRes.ok, true);
    const newId = insertRes.rows[0].id;

    try {
      // Search using <=> operator as in app/rag.py
      const searchRes = await queryDb(
        `SELECT id, title, content, (embedding <=> $1::vector) AS distance
         FROM knowledge_chunks
         WHERE embedding IS NOT NULL
         ORDER BY distance ASC
         LIMIT 1;`,
        [vectorStr]
      );
      assert.equal(searchRes.ok, true);
      assert.equal(searchRes.rows.length, 1);
      assert.equal(searchRes.rows[0].id, newId);
      assert.ok(searchRes.rows[0].distance < 0.001);
    } finally {
      await queryDb("DELETE FROM knowledge_chunks WHERE id = $1;", [newId]);
    }
  });

  t.after(async () => {
    const p = getDbPool();
    if (p) {
      await p.end();
    }
  });
});
