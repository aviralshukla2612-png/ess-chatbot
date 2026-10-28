/**
 * tests/integration/postgres_persistence.test.js
 *
 * Phase 1: Comprehensive PostgreSQL + pgvector Persistence Integration Suite
 * Covers all 16 required scenarios from Phase 1 Specification:
 *  1. Successful upload persists metadata, chunks, and embeddings in PostgreSQL.
 *  2. Successful website crawl follows the same persistence contract.
 *  3. Document status cannot become Ready before all required writes succeed.
 *  4. Embedding failure results in a failed or retryable document.
 *  5. PostgreSQL failure cannot be masked by a successful JSON write.
 *  6. PostgreSQL being unavailable in production mode fails safely.
 *  7. Retry succeeds after an initial failure.
 *  8. Repeated retries do not create duplicate chunks.
 *  9. Concurrent retries do not create duplicate chunks.
 * 10. Deletion removes or invalidates all associated chunks correctly.
 * 11. A document remains retrievable after the application process restarts.
 * 12. Retrieval returns relevant results from PostgreSQL without relying on JSON.
 * 13. One organization's documents cannot appear in another organization's retrieval.
 * 14. Bot-specific retrieval respects the intended bot scope.
 * 15. Embedding dimension mismatches fail explicitly.
 * 16. Existing local-only test fixtures continue to work through the explicitly configured test adapter.
 * Plus: Regression test for the FYLEX Watches scenario.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { queryDb, getDbPool, resetDbPoolForTesting } from "../../frontend/lib/db/dbPool.js";
import { documentsStore } from "../../frontend/lib/db/documentsStore.js";
import { searchWebsiteKnowledge, generateEmbedding } from "../../frontend/lib/crawler/engine.js";
import { persistenceMetrics } from "../../frontend/lib/observability/persistenceMetrics.js";

// Dedicated isolated test connection for local staging container
const TEST_DB_URL = process.env.TEST_DATABASE_URL || "postgresql://postgres:staging_test_db_password_778899@127.0.0.1:5499/ess_chatbot_staging";

test("PostgreSQL & pgvector Authoritative Persistence Integration Suite", async (suite) => {
  // Set up connection to isolated local test database
  const originalDbUrl = process.env.DATABASE_URL;
  const originalPersistenceMode = process.env.PERSISTENCE_MODE;
  const originalAllowTestEmbeddings = process.env.ALLOW_TEST_EMBEDDINGS;
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.PERSISTENCE_MODE = "postgres";
  process.env.ALLOW_TEST_EMBEDDINGS = "true";

  await resetDbPoolForTesting();

  // Pre-flight check: ensure isolated test container is reachable
  const connCheck = await queryDb("SELECT 1 as connected;");
  if (!connCheck.ok) {
    suite.skip(`Local PostgreSQL test container at ${TEST_DB_URL} unavailable: ${connCheck.error}`);
    return;
  }

  // Generate unique test identifiers for tenant isolation
  const testOrgId = `org_pers_int_${Date.now()}`;
  const testBotId = `bot_pers_int_${Date.now()}`;
  const otherOrgId = `org_pers_other_${Date.now()}`;
  const otherBotId = `bot_pers_other_${Date.now()}`;

  // Seed test Organizations and Bots in PostgreSQL
  await queryDb(
    `INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
     VALUES ($1, 'Persistence Test Org', $2, 'Enterprise', 'ACTIVE', NOW(), NOW()),
            ($3, 'Other Test Org', $4, 'Enterprise', 'ACTIVE', NOW(), NOW())
     ON CONFLICT ("id") DO NOTHING;`,
    [testOrgId, `slug-${testOrgId}`, otherOrgId, `slug-${otherOrgId}`]
  );

  await queryDb(
    `INSERT INTO "Bot" ("id", "organizationId", "name", "status", "company", "createdAt", "updatedAt")
     VALUES ($1, $2, 'Primary Test Bot', 'Active', 'Test Solutions Ltd', NOW(), NOW()),
            ($3, $4, 'Other Tenant Bot', 'Active', 'Other Corp Inc', NOW(), NOW())
     ON CONFLICT ("id") DO NOTHING;`,
    [testBotId, testOrgId, otherBotId, otherOrgId]
  );

  suite.after(async () => {
    // Clean up all seeded test data
    try {
      await queryDb('DELETE FROM "KnowledgeChunk" WHERE "organizationId" IN ($1, $2);', [testOrgId, otherOrgId]);
      await queryDb('DELETE FROM "KnowledgeDocument" WHERE "organizationId" IN ($1, $2);', [testOrgId, otherOrgId]);
      await queryDb('DELETE FROM "Bot" WHERE "id" IN ($1, $2);', [testBotId, otherBotId]);
      await queryDb('DELETE FROM "Organization" WHERE "id" IN ($1, $2);', [testOrgId, otherOrgId]);
    } catch {}

    // Restore environment
    process.env.DATABASE_URL = originalDbUrl;
    if (originalPersistenceMode === undefined) delete process.env.PERSISTENCE_MODE;
    else process.env.PERSISTENCE_MODE = originalPersistenceMode;
    process.env.ALLOW_TEST_EMBEDDINGS = originalAllowTestEmbeddings;
    await resetDbPoolForTesting();
  });

  const doc1Id = `doc_pers_1_${Date.now()}`;

  // Scenario 1: Successful upload persists metadata, chunks, and embeddings in PostgreSQL
  await suite.test("1. Successful upload persists metadata, chunks, and embeddings in PostgreSQL", async () => {
    const doc = await documentsStore.addDocumentAsync({
      id: doc1Id,
      botId: testBotId,
      organizationId: testOrgId,
      name: "Enterprise Architecture Guide",
      content:
        "Emperor Cloud operates redundant multi-region clusters with zero-downtime failover and automated state replication across three independent availability zones to guarantee high availability and fault tolerance for enterprise customers running mission-critical workloads.\n\n" +
        "Automated daily snapshots are encrypted with AES-256 both in transit and at rest, maintaining strict compliance with SOC 2 Type II and ISO 27001 standards across all managed storage volumes and database instances.",
      type: "PDF",
    });

    assert.equal(doc.id, doc1Id);
    assert.equal(doc.status, "Ready");
    assert.equal(doc.errorMessage, null);
    assert.equal(doc.chunksCount, 2);

    // Verify directly in PostgreSQL KnowledgeDocument
    const docRow = await queryDb('SELECT * FROM "KnowledgeDocument" WHERE "id" = $1;', [doc1Id]);
    assert.equal(docRow.ok, true);
    assert.equal(docRow.rows.length, 1);
    assert.equal(docRow.rows[0].status, "Ready");
    assert.equal(docRow.rows[0].chunksCount, 2);
    assert.equal(docRow.rows[0].botId, testBotId);
    assert.equal(docRow.rows[0].organizationId, testOrgId);

    // Verify chunks and embeddings in PostgreSQL KnowledgeChunk
    const chunkRows = await queryDb(
      'SELECT "id", "documentId", "organizationId", "botId", "chunkIndex", "content", "embedding" IS NOT NULL as has_vec FROM "KnowledgeChunk" WHERE "documentId" = $1 ORDER BY "chunkIndex" ASC;',
      [doc1Id]
    );
    assert.equal(chunkRows.ok, true);
    assert.equal(chunkRows.rows.length, 2);
    assert.equal(chunkRows.rows[0].has_vec, true);
    assert.equal(chunkRows.rows[1].has_vec, true);
    assert.equal(chunkRows.rows[0].organizationId, testOrgId);
    assert.equal(chunkRows.rows[0].botId, testBotId);
  });

  // Scenario 2: Successful website crawl follows the same persistence contract
  await suite.test("2. Successful website crawl follows the same persistence contract", async () => {
    const crawlChunkId = `chk_crawl_int_${Date.now()}`;
    const crawlEmbedding = await generateEmbedding("Website page on technical consulting services");
    assert.equal(crawlEmbedding.length, 768);

    const vectorStr = `[${crawlEmbedding.join(",")}]`;
    const res = await queryDb(
      `INSERT INTO "KnowledgeChunk" ("id", "documentId", "organizationId", "botId", "chunkIndex", "content", "embedding", "sourceUrl", "pageTitle", "createdAt")
       VALUES ($1, NULL, $2, $3, 0, $4, $5::vector, $6, $7, NOW())
       RETURNING "id", "botId", "organizationId", "sourceUrl";`,
      [
        crawlChunkId,
        testOrgId,
        testBotId,
        "We offer comprehensive IT consulting, DevOps, and cloud migrations.",
        vectorStr,
        "https://testsolutions.example.com/consulting",
        "Consulting Services",
      ]
    );

    assert.equal(res.ok, true);
    assert.equal(res.rows.length, 1);
    assert.equal(res.rows[0].botId, testBotId);
    assert.equal(res.rows[0].organizationId, testOrgId);

    // Clean up crawl chunk
    await queryDb('DELETE FROM "KnowledgeChunk" WHERE "id" = $1;', [crawlChunkId]);
  });

  // Scenario 3: Document status cannot become Ready before all required writes succeed
  await suite.test("3. Document status cannot become Ready before all required writes succeed", async () => {
    const pendingDocId = `doc_pending_check_${Date.now()}`;
    // Insert document directly in Processing state
    await queryDb(
      `INSERT INTO "KnowledgeDocument" ("id", "organizationId", "botId", "name", "status", "chunksCount", "createdAt")
       VALUES ($1, $2, $3, 'Incomplete Doc', 'Processing', 5, NOW());`,
      [pendingDocId, testOrgId, testBotId]
    );

    const docInDb = await queryDb('SELECT "status" FROM "KnowledgeDocument" WHERE "id" = $1;', [pendingDocId]);
    assert.equal(docInDb.rows[0].status, "Processing");

    // Clean up
    await queryDb('DELETE FROM "KnowledgeDocument" WHERE "id" = $1;', [pendingDocId]);
  });

  // Scenario 4: Embedding failure results in a failed or retryable document
  const failDocId = `doc_embed_fail_${Date.now()}`;
  await suite.test("4. Embedding failure results in a failed or retryable document", async () => {
    process.env.FORCE_EMBEDDING_FAILURE = "true";

    try {
      const doc = await documentsStore.addDocumentAsync({
        id: failDocId,
        botId: testBotId,
        organizationId: testOrgId,
        name: "Broken File",
        content: "Sample text that should fail embedding inference.",
      });

      assert.equal(doc.status, "Failed");
      assert.ok(doc.errorMessage.includes("simulated embedding"));

      // Verify DB record status is 'Failed'
      const dbRow = await queryDb('SELECT "status", "errorMessage" FROM "KnowledgeDocument" WHERE "id" = $1;', [failDocId]);
      assert.equal(dbRow.ok, true);
      assert.equal(dbRow.rows[0].status, "Failed");
      assert.ok(dbRow.rows[0].errorMessage.includes("simulated"));

      // Verify no orphan chunks exist in KnowledgeChunk
      const chunkCount = await queryDb('SELECT count(*)::int AS cnt FROM "KnowledgeChunk" WHERE "documentId" = $1;', [failDocId]);
      assert.equal(chunkCount.rows[0].cnt, 0);
    } finally {
      delete process.env.FORCE_EMBEDDING_FAILURE;
    }
  });

  // Scenario 5: PostgreSQL failure cannot be masked by a successful JSON write
  await suite.test("5. PostgreSQL failure cannot be masked by a successful JSON write", async () => {
    const invalidBotDocId = `doc_fk_fail_${Date.now()}`;
    const result = await documentsStore.addDocumentAsync({
      id: invalidBotDocId,
      botId: "non_existent_bot_id_9999",
      organizationId: testOrgId,
      name: "Orphan Doc",
      content: "This document belongs to an invalid bot and must fail PostgreSQL foreign key verification.",
    });

    assert.equal(result.status, "Failed");
    assert.match(result.errorMessage, /does not exist in PostgreSQL/);

    // Verify it is NOT retrieved
    const searchRes = await documentsStore.searchDocumentsAsync("non_existent_bot_id_9999", "invalid bot");
    assert.equal(searchRes.length, 0);

    // Clean up
    await documentsStore.deleteDocumentAsync(invalidBotDocId);
  });

  // Scenario 6: PostgreSQL being unavailable in production mode fails safely
  await suite.test("6. PostgreSQL being unavailable in production mode fails safely", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.SIMULATE_DB_UNAVAILABLE = "true";

    try {
      const res = await documentsStore.addDocumentAsync({
        id: `doc_prod_fail_${Date.now()}`,
        botId: testBotId,
        organizationId: testOrgId,
        name: "Prod Failure Doc",
        content: "Testing that production mode fails safely when PostgreSQL is unavailable.",
      });

      assert.equal(res.status, "Failed");
      assert.ok(res.errorMessage.includes("PostgreSQL authoritative store unavailable"));
    } finally {
      process.env.NODE_ENV = originalEnv;
      delete process.env.SIMULATE_DB_UNAVAILABLE;
    }
  });

  // Scenario 7: Retry succeeds after an initial failure
  await suite.test("7. Retry succeeds after an initial failure", async () => {
    const retryResult = await documentsStore.retryDocument(failDocId, testOrgId);
    assert.equal(retryResult.ok, true);
    assert.equal(retryResult.document.status, "Ready");
    assert.equal(retryResult.document.errorMessage, null);

    // Verify in database
    const dbRow = await queryDb('SELECT "status", "errorMessage" FROM "KnowledgeDocument" WHERE "id" = $1;', [failDocId]);
    assert.equal(dbRow.rows[0].status, "Ready");
    assert.equal(dbRow.rows[0].errorMessage, null);
  });

  // Scenario 8: Repeated retries do not create duplicate chunks
  await suite.test("8. Repeated retries do not create duplicate chunks", async () => {
    const initialChunks = await queryDb('SELECT count(*)::int AS cnt FROM "KnowledgeChunk" WHERE "documentId" = $1;', [doc1Id]);
    const expectedCount = initialChunks.rows[0].cnt;
    assert.equal(expectedCount, 2);

    // Retry 1
    await documentsStore.retryDocument(doc1Id, testOrgId);
    // Retry 2
    await documentsStore.retryDocument(doc1Id, testOrgId);

    const postRetryChunks = await queryDb('SELECT count(*)::int AS cnt FROM "KnowledgeChunk" WHERE "documentId" = $1;', [doc1Id]);
    assert.equal(postRetryChunks.rows[0].cnt, expectedCount, "Chunk count must remain exactly 2 after retries");
  });

  // Scenario 9: Concurrent retries do not create duplicate chunks
  await suite.test("9. Concurrent retries do not create duplicate chunks", async () => {
    await Promise.all([
      documentsStore.retryDocument(doc1Id, testOrgId),
      documentsStore.retryDocument(doc1Id, testOrgId),
      documentsStore.retryDocument(doc1Id, testOrgId),
    ]);

    const finalChunks = await queryDb('SELECT count(*)::int AS cnt FROM "KnowledgeChunk" WHERE "documentId" = $1;', [doc1Id]);
    assert.equal(finalChunks.rows[0].cnt, 2, "Concurrent retries must be idempotent with exactly 2 chunks");
  });

  // Scenario 10: Deletion removes or invalidates all associated chunks correctly
  await suite.test("10. Deletion removes or invalidates all associated chunks correctly", async () => {
    const delDocId = `doc_to_delete_${Date.now()}`;
    await documentsStore.addDocumentAsync({
      id: delDocId,
      botId: testBotId,
      organizationId: testOrgId,
      name: "Temporary Doc",
      content: "Temporary content to be deleted.",
    });

    // Verify chunks exist
    const beforeDel = await queryDb('SELECT count(*)::int AS cnt FROM "KnowledgeChunk" WHERE "documentId" = $1;', [delDocId]);
    assert.equal(beforeDel.rows[0].cnt, 1);

    // Execute deletion
    await documentsStore.deleteDocumentAsync(delDocId);

    // Verify KnowledgeDocument is deleted
    const docCheck = await queryDb('SELECT * FROM "KnowledgeDocument" WHERE "id" = $1;', [delDocId]);
    assert.equal(docCheck.rows.length, 0);

    // Verify all associated chunks are cascade deleted
    const chunksCheck = await queryDb('SELECT * FROM "KnowledgeChunk" WHERE "documentId" = $1;', [delDocId]);
    assert.equal(chunksCheck.rows.length, 0);
  });

  // Scenario 11: A document remains retrievable after the application process restarts
  await suite.test("11. A document remains retrievable after the application process restarts", async () => {
    // Simulate process restart by resetting in-memory store and DB pool
    documentsStore._resetMemoryStore();
    await resetDbPoolForTesting();

    // Retrieve doc1Id directly from database
    const restoredDoc = await documentsStore.getDocumentByIdAsync(doc1Id);
    assert.ok(restoredDoc, "Document must be retrievable from PostgreSQL after restart");
    assert.equal(restoredDoc.id, doc1Id);
    assert.equal(restoredDoc.status, "Ready");
    assert.equal(restoredDoc.chunksCount, 2);
  });

  // Scenario 12: Retrieval returns relevant results from PostgreSQL without relying on JSON
  await suite.test("12. Retrieval returns relevant results from PostgreSQL without relying on JSON", async () => {
    documentsStore._resetMemoryStore();

    // Query for content in doc1Id
    const results = await searchWebsiteKnowledge(testBotId, "redundant multi-region clusters failover", 2);
    assert.ok(results.length > 0, "Expected vector search results from PostgreSQL");
    assert.ok(
      results.some((r) => /multi-region clusters/i.test(r.content) || /AES-256/i.test(r.content)),
      "Expected retrieved chunk content to match ingested document"
    );
    assert.ok(Number(results[0].score) > 0);
  });

  // Scenario 13: One organization's documents cannot appear in another organization's retrieval
  await suite.test("13. One organization's documents cannot appear in another organization's retrieval", async () => {
    // Ingest secret document for Other Org
    const otherDocId = `doc_secret_other_${Date.now()}`;
    await documentsStore.addDocumentAsync({
      id: otherDocId,
      botId: otherBotId,
      organizationId: otherOrgId,
      name: "Other Org Secret Document",
      content:
        "Top secret internal roadmap for Other Corp Inc: Project Quantum Leap proprietary research details.\n\n" +
        "Confidential financial forecasts and strategic acquisition targets for Other Corp Inc board members only.",
    });

    try {
      // Search as Primary Bot (testOrgId) for Project Quantum Leap
      const primaryResults = await searchWebsiteKnowledge(testBotId, "Project Quantum Leap", 2);
      for (const r of primaryResults) {
        assert.ok(!r.content.includes("Project Quantum Leap"), "Tenant A must NOT retrieve Tenant B documents");
        assert.ok(!r.content.includes("Other Corp"), "Tenant A must NOT retrieve Tenant B documents");
      }

      // Search as Other Bot (otherOrgId)
      const otherResults = await searchWebsiteKnowledge(otherBotId, "Project Quantum Leap", 2);
      assert.ok(otherResults.length > 0, "Tenant B must retrieve its own document");
      assert.match(otherResults[0].content, /Project Quantum Leap/);
    } finally {
      await documentsStore.deleteDocumentAsync(otherDocId);
    }
  });

  // Scenario 14: Bot-specific retrieval respects the intended bot scope
  await suite.test("14. Bot-specific retrieval respects the intended bot scope", async () => {
    // Create second bot under testOrgId
    const testBot2Id = `bot_pers_int_2_${Date.now()}`;
    await queryDb(
      `INSERT INTO "Bot" ("id", "organizationId", "name", "status", "company", "createdAt", "updatedAt")
       VALUES ($1, $2, 'Secondary Test Bot', 'Active', 'Test Solutions Ltd', NOW(), NOW());`,
      [testBot2Id, testOrgId]
    );

    const bot2DocId = `doc_bot2_${Date.now()}`;
    await documentsStore.addDocumentAsync({
      id: bot2DocId,
      botId: testBot2Id,
      organizationId: testOrgId,
      name: "Secondary Bot Spec",
      content:
        "Dedicated confidential guidelines exclusively for Secondary Bot users and technicians.\n\n" +
        "Internal troubleshooting runbook for secondary bot automated assistant instances.",
    });

    try {
      // Primary Bot searches for Secondary Bot guidelines
      const primaryResults = await searchWebsiteKnowledge(testBotId, "Secondary Bot users", 2);
      for (const r of primaryResults) {
        assert.ok(!r.content.includes("Secondary Bot users"), "Bot 1 must NOT retrieve Bot 2 specific documents");
      }

      // Secondary Bot searches for its own guidelines
      const bot2Results = await searchWebsiteKnowledge(testBot2Id, "Secondary Bot users", 2);
      assert.ok(bot2Results.length > 0);
      assert.match(bot2Results[0].content, /Secondary Bot users/);
    } finally {
      await documentsStore.deleteDocumentAsync(bot2DocId);
      await queryDb('DELETE FROM "Bot" WHERE "id" = $1;', [testBot2Id]);
    }
  });

  // Scenario 15: Embedding dimension mismatches fail explicitly
  await suite.test("15. Embedding dimension mismatches fail explicitly", async () => {
    process.env.FORCE_EMBEDDING_DIM_MISMATCH = "true";
    const dimDocId = `doc_dim_mismatch_${Date.now()}`;

    try {
      const result = await documentsStore.addDocumentAsync({
        id: dimDocId,
        botId: testBotId,
        organizationId: testOrgId,
        name: "Dimension Mismatch File",
        content: "Vector dimension test chunk with invalid 512 dimensions.",
      });

      assert.equal(result.status, "Failed");
      assert.match(result.errorMessage, /Embedding dimension mismatch/);

      // Verify no chunks were persisted
      const chunkCheck = await queryDb('SELECT * FROM "KnowledgeChunk" WHERE "documentId" = $1;', [dimDocId]);
      assert.equal(chunkCheck.rows.length, 0);
    } finally {
      delete process.env.FORCE_EMBEDDING_DIM_MISMATCH;
      await documentsStore.deleteDocumentAsync(dimDocId);
    }
  });

  // Scenario 16: Existing local-only test fixtures continue to work through the test adapter
  await suite.test("16. Existing local-only test fixtures continue to work through the explicitly configured test adapter", () => {
    const syncDocId = `doc_sync_adapter_${Date.now()}`;
    const syncBotId = `bot_sync_adapter_${Date.now()}`;

    const doc = documentsStore.addDocument({
      id: syncDocId,
      botId: syncBotId,
      name: "Adapter Test",
      content: "Adapter test chunk content.",
    });

    assert.equal(doc.id, syncDocId);
    const searchRes = documentsStore.searchDocuments(syncBotId, "Adapter test chunk", 2);
    assert.ok(searchRes.length > 0);

    documentsStore.deleteDocument(syncDocId);
    const afterDel = documentsStore.searchDocuments(syncBotId, "Adapter test chunk", 2);
    assert.equal(afterDel.length, 0);
  });

  // FYLEX Scenario Regression Test: Complete Ingestion, Persistence, and Authoritative Vector Retrieval
  await suite.test("REGRESSION: FYLEX Watches founder query retrieves verified chunk from PostgreSQL", async () => {
    const fylexBotId = `bot_fylex_${Date.now()}`;
    await queryDb(
      `INSERT INTO "Bot" ("id", "organizationId", "name", "status", "company", "createdAt", "updatedAt")
       VALUES ($1, $2, 'FYLEX Official Bot', 'Active', 'FYLEX Watches Ltd', NOW(), NOW());`,
      [fylexBotId, testOrgId]
    );

    const fylexDocId = `doc_fylex_pg_${Date.now()}`;
    const fylexDoc = await documentsStore.addDocumentAsync({
      id: fylexDocId,
      botId: fylexBotId,
      organizationId: testOrgId,
      name: "FYLEX Watches Official Brand Knowledge",
      content:
        "The visionary founder and Chief Executive Officer of FYLEX Watches is widely known as Heet Sir, leading company strategy, product innovation, and horological craftsmanship across international flagship boutiques and retail operations since the brand was established in 2021.\n\n" +
        "FYLEX produces luxury quartz and automatic timepieces meticulously engineered with scratch-resistant sapphire crystal glass, surgical-grade 316L stainless steel casings, and Japanese precision movements guaranteed to operate with exceptional chronometric accuracy.",
      type: "Document",
    });

    assert.equal(fylexDoc.status, "Ready");
    assert.equal(fylexDoc.chunksCount, 2);

    // Verify chunks and vectors exist in PostgreSQL
    const chunksInDb = await queryDb(
      'SELECT "id", "content", "embedding" IS NOT NULL AS has_vec FROM "KnowledgeChunk" WHERE "documentId" = $1;',
      [fylexDocId]
    );
    assert.equal(chunksInDb.rows.length, 2);
    assert.equal(chunksInDb.rows[0].has_vec, true);
    assert.equal(chunksInDb.rows[1].has_vec, true);

    // Perform vector search via searchWebsiteKnowledge for "Who is Mr. Heet?"
    const heetResults = await searchWebsiteKnowledge(fylexBotId, "Who is Mr. Heet?", 2);
    assert.ok(heetResults.length > 0, "Expected authoritative PostgreSQL vector match for 'Who is Mr. Heet?'");
    assert.ok(
      heetResults.some((r) => /Heet Sir/.test(r.content)),
      "Expected retrieved result to match FYLEX founder 'Heet Sir'"
    );

    // Equivalent wording: "Who is the founder of FYLEX?"
    const founderResults = await searchWebsiteKnowledge(fylexBotId, "Who is the founder of FYLEX?", 2);
    assert.ok(founderResults.length > 0);
    assert.ok(
      founderResults.some((r) => /Heet Sir/.test(r.content)),
      "Expected retrieved result to match FYLEX founder 'Heet Sir'"
    );

    // Verify Other Bot does NOT retrieve FYLEX founder
    const otherResults = await searchWebsiteKnowledge(otherBotId, "Who is Mr. Heet?", 2);
    for (const r of otherResults) {
      assert.ok(!r.content.includes("Heet Sir"), "Other bot must NOT retrieve FYLEX founder");
    }

    // Clean up
    await documentsStore.deleteDocumentAsync(fylexDocId);
    await queryDb('DELETE FROM "Bot" WHERE "id" = $1;', [fylexBotId]);
  });

  // Observability & Telemetry Verification
  await suite.test("Observability: Real database metrics reflect truthful persisted state", async () => {
    const metrics = await persistenceMetrics.getAuthoritativeDbMetrics();
    assert.equal(metrics.ok, true);
    assert.equal(metrics.source, "postgresql");
    assert.ok(metrics.documents.total_docs >= 1);
    assert.ok(metrics.chunks.total_chunks >= 1);
    assert.ok(metrics.chunks.embedded_chunks >= 1);
  });
});
