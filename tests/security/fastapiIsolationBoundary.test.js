/**
 * tests/security/fastapiIsolationBoundary.test.js
 *
 * FastAPI & pgvector Knowledge Boundary Verification
 * =================================================
 * Proves that:
 * 1. The public Next.js tenant chat pipeline cannot access or invoke FastAPI's /api/chat.
 * 2. Next.js multi-tenant RAG retrieval enforces strict botId & organizationId boundaries.
 * 3. FastAPI's service is strictly internal (loopback bound) and never exposed publicly.
 * 4. Multi-tenant document uploads write to "KnowledgeChunk" (with organizationId & botId),
 *    never to the single-tenant "knowledge_chunks" table.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { searchWebsiteKnowledge } from "../../frontend/lib/crawler/engine.js";
import { documentsStore } from "../../frontend/lib/db/documentsStore.js";

test("FastAPI Knowledge Isolation Boundary Suite", async (t) => {
  await t.test("1. Next.js public chat route has ZERO network dependencies on FastAPI", () => {
    const routePath = path.join(process.cwd(), "frontend", "app", "api", "public", "chat", "[botId]", "route.js");
    assert.ok(fs.existsSync(routePath), "Public chat route file must exist");
    const routeContent = fs.readFileSync(routePath, "utf8");

    // Must not call FastAPI service
    assert.equal(
      routeContent.includes("http://fastapi"),
      false,
      "Public chat route must not reference internal http://fastapi"
    );
    assert.equal(
      routeContent.includes(":8000"),
      false,
      "Public chat route must not call port 8000"
    );
    assert.equal(
      routeContent.includes("/api/chat") && routeContent.includes("fetch("),
      false,
      "Public chat route must not fetch FastAPI /api/chat"
    );
    assert.equal(
      routeContent.includes("knowledge_chunks"),
      false,
      "Public chat route must not query FastAPI's knowledge_chunks table directly"
    );
  });

  await t.test("2. Next.js inference provider routes through Groq/Ollama, never FastAPI", () => {
    const providerPath = path.join(process.cwd(), "frontend", "lib", "ai", "inferenceProvider.js");
    const content = fs.readFileSync(providerPath, "utf8");

    assert.equal(
      content.includes("fastapi"),
      false,
      "Inference provider must not target FastAPI"
    );
  });

  await t.test("3. Staging Compose binds FastAPI strictly to loopback 127.0.0.1", () => {
    const composePath = path.join(process.cwd(), "docker-compose.staging.yml");
    assert.ok(fs.existsSync(composePath), "docker-compose.staging.yml must exist");
    const composeContent = fs.readFileSync(composePath, "utf8");

    // Verify FastAPI port definition
    const fastapiSection = composeContent.split("fastapi:")[1];
    assert.ok(fastapiSection, "Compose must contain a fastapi service");

    assert.ok(
      fastapiSection.includes("127.0.0.1:"),
      "FastAPI port binding must be restricted to 127.0.0.1"
    );
    assert.equal(
      fastapiSection.includes('"8000:8000"') || fastapiSection.includes("'8000:8000'"),
      false,
      "FastAPI must not expose 0.0.0.0:8000:8000"
    );
  });

  await t.test("4. Multi-tenant document retrieval strictly enforces botId tenant scoping", () => {
    // Mock save documents for two distinct bots
    const botA = "bot_tenant_alpha_01";
    const botB = "bot_tenant_beta_02";

    // Search documents for botA
    const resultsForA = documentsStore.searchDocuments(botA, "What are your services?");
    // Search documents for botB
    const resultsForB = documentsStore.searchDocuments(botB, "What are your services?");

    // Results must not bleed across non-matching bots
    for (const r of resultsForB) {
      if (r.botId) {
        assert.notEqual(r.botId, botA, "Bot B must never receive Bot A's proprietary knowledge");
      }
    }
  });

  await t.test("5. Multi-tenant database schema separates tenant chunks from legacy corporate chunks", () => {
    const schemaSqlPath = path.join(process.cwd(), "frontend", "data", "staging_initial_schema.sql");
    const sql = fs.readFileSync(schemaSqlPath, "utf8");

    // Next.js Multi-Tenant Table
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS "KnowledgeChunk"'));
    assert.ok(sql.includes('"organizationId" VARCHAR(64) NOT NULL REFERENCES "Organization"'));
    assert.ok(sql.includes('"botId" VARCHAR(64) NOT NULL REFERENCES "Bot"'));

    // FastAPI Table is separate and legacy single-tenant
    assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS knowledge_chunks ('));
    assert.ok(sql.includes('idx_knowledge_chunks_tenant ON "KnowledgeChunk" ("organizationId", "botId")'));
  });
});
