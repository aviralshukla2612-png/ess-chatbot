import test from "node:test";
import assert from "node:assert/strict";

import { searchWebsiteKnowledge, vectorStorePoints } from "../../frontend/lib/crawler/engine.js";
import { documentsStore } from "../../frontend/lib/db/documentsStore.js";
import { botsStore } from "../../frontend/lib/db/botsStore.js";

test("PART C — Multi-Tenant Vector & Document Retrieval Isolation", async (t) => {
  const tenantA_OrgId = `org_retail_watches_${Date.now()}`;
  const tenantA_BotId = `bot_watches_${Date.now()}`;

  const tenantB_OrgId = `org_dental_clinic_${Date.now()}`;
  const tenantB_BotId = `bot_dental_${Date.now()}`;

  // Register synthetic bots in botsStore
  const botA = {
    id: tenantA_BotId,
    organizationId: tenantA_OrgId,
    name: "Watch Advisor",
    company: "Apex Luxury Watches",
    status: "Active",
  };
  const botB = {
    id: tenantB_BotId,
    organizationId: tenantB_OrgId,
    name: "Dental Care Guide",
    company: "Smile Dental Clinic",
    status: "Active",
  };

  botsStore.upsertBot(botA, tenantA_OrgId);
  botsStore.upsertBot(botB, tenantB_OrgId);

  // Ingest proprietary document for Tenant A
  const docA = {
    id: `doc_watches_${Date.now()}`,
    botId: tenantA_BotId,
    organizationId: tenantA_OrgId,
    name: "Watch Warranty Policy",
    content: "Apex Luxury Watches provides a 5-year Swiss certified warranty on all automatic calibers and chronographs.",
    status: "Ready",
  };

  // Ingest proprietary document for Tenant B with confidential patient information
  const docB = {
    id: `doc_dental_${Date.now()}`,
    botId: tenantB_BotId,
    organizationId: tenantB_OrgId,
    name: "Dental Confidential Pricing",
    content: "Smile Dental Clinic VIP implants cost $2,400 with proprietary ceramic crowns and nitrous oxide sedation.",
    status: "Ready",
  };

  documentsStore.addDocument(docA);
  documentsStore.addDocument(docB);

  // Populate in-memory website vector store points with organizationId attribution
  vectorStorePoints.push(
    {
      id: `pt_a_${Date.now()}`,
      botId: tenantA_BotId,
      organizationId: tenantA_OrgId,
      content: "Apex Luxury Watches official trade-in program provides up to 70% value on pre-owned timepieces.",
      embedding: new Array(768).fill(0.1),
    },
    {
      id: `pt_b_${Date.now()}`,
      botId: tenantB_BotId,
      organizationId: tenantB_OrgId,
      content: "Smile Dental Clinic confidential doctor schedule: Dr. Miller is on call for weekend tooth extractions.",
      embedding: new Array(768).fill(0.1),
    }
  );

  await t.test("1. Tenant A query retrieves only Tenant A knowledge and zero chunks from Tenant B", async () => {
    const results = await searchWebsiteKnowledge(tenantA_BotId, "warranty and implants schedule", 5, {
      organizationId: tenantA_OrgId,
    });

    assert.ok(results.length > 0, "Tenant A should retrieve its own chunks");
    for (const chunk of results) {
      assert.ok(!chunk.content.includes("Smile Dental"), "Must not leak Tenant B content");
      assert.ok(!chunk.content.includes("implants"), "Must not leak Tenant B confidential content");
      assert.ok(!chunk.content.includes("Dr. Miller"), "Must not leak Tenant B doctor names");
    }
  });

  await t.test("2. Tenant B query retrieves only Tenant B knowledge and zero chunks from Tenant A", async () => {
    const results = await searchWebsiteKnowledge(tenantB_BotId, "warranty and implants schedule", 5, {
      organizationId: tenantB_OrgId,
    });

    assert.ok(results.length > 0, "Tenant B should retrieve its own chunks");
    for (const chunk of results) {
      assert.ok(!chunk.content.includes("Apex Luxury"), "Must not leak Tenant A content");
      assert.ok(!chunk.content.includes("Swiss certified"), "Must not leak Tenant A warranty");
    }
  });

  await t.test("3. Mismatched organizationId with valid foreign botId is immediately rejected", async () => {
    // Malicious or buggy caller: passes Tenant A's organizationId with Tenant B's botId
    const crossResults = await searchWebsiteKnowledge(tenantB_BotId, "implants extractions", 5, {
      organizationId: tenantA_OrgId, // Mismatched!
    });

    assert.deepEqual(crossResults, [], "Cross-tenant bot query with mismatched organizationId must return empty array");
  });

  await t.test("4. Guessed botId belonging to another tenant cannot be queried under caller's tenant boundary", async () => {
    // Attacker from Tenant A guesses Tenant B's bot ID
    const attackerQuery = await searchWebsiteKnowledge(tenantB_BotId, "Dr. Miller weekend tooth extractions", 5, {
      organizationId: tenantA_OrgId,
    });

    assert.equal(attackerQuery.length, 0, "Attacker guessing foreign botId must receive zero results");
  });

  await t.test("5. Fallback in-memory document search strictly respects organizationId", () => {
    const searchDocsA = documentsStore.searchDocuments(tenantA_BotId, "implants warranty", 5, tenantA_OrgId);
    assert.ok(searchDocsA.length > 0);
    assert.ok(searchDocsA.every((d) => !d.content.includes("Smile Dental")));

    // When passing mismatched organizationId, returns 0 docs
    const mismatchedDocs = documentsStore.searchDocuments(tenantA_BotId, "implants warranty", 5, tenantB_OrgId);
    assert.equal(mismatchedDocs.length, 0);
  });

  // Add unassigned legacy document & vector point without organizationId
  const docLegacy = {
    id: `doc_legacy_${Date.now()}`,
    botId: tenantA_BotId,
    // organizationId is intentionally undefined/null (legacy unowned record)
    name: "Legacy Unassigned Manual",
    content: "Unassigned legacy secrets that must never be exposed to any tenant query.",
    status: "Ready",
  };
  documentsStore.addDocument(docLegacy);

  const ptLegacy = {
    id: `pt_legacy_${Date.now()}`,
    botId: tenantA_BotId,
    // organizationId is intentionally undefined/null
    content: "Unassigned legacy vector knowledge that must never leak.",
    embedding: new Array(768).fill(0.1),
  };
  vectorStorePoints.push(ptLegacy);

  await t.test("6. Tenant query cannot retrieve unassigned legacy records", async () => {
    // Vector search must not match ptLegacy because p.organizationId is missing
    const vectorRes = await searchWebsiteKnowledge(tenantA_BotId, "Unassigned legacy vector knowledge", 5, {
      organizationId: tenantA_OrgId,
    });
    assert.ok(
      vectorRes.every((r) => !r.content.includes("Unassigned legacy")),
      "Unassigned legacy vector points must not be returned to tenant query"
    );

    // Document search must not match docLegacy because d.organizationId is missing
    const docRes = documentsStore.searchDocuments(tenantA_BotId, "Unassigned legacy secrets", 5, tenantA_OrgId);
    assert.ok(
      docRes.every((r) => !r.content.includes("Unassigned legacy")),
      "Unassigned legacy documents must not be returned to tenant query"
    );
  });

  await t.test("7. Missing or unresolvable organization ID fails closed with no records", async () => {
    // Passing null organizationId to searchWebsiteKnowledge
    const resNoOrg = await searchWebsiteKnowledge(tenantA_BotId, "warranty", 5, {
      organizationId: null,
    });
    assert.deepEqual(resNoOrg, [], "Missing organizationId must fail closed");

    // Passing empty string organizationId
    const resEmptyOrg = await searchWebsiteKnowledge(tenantA_BotId, "warranty", 5, {
      organizationId: "",
    });
    assert.deepEqual(resEmptyOrg, [], "Empty organizationId must fail closed");

    // documentsStore.searchDocuments with missing org and unknown bot fails closed
    const docResNoOrg = documentsStore.searchDocuments("bot_unknown_nonexistent", "warranty", 5, null);
    assert.deepEqual(docResNoOrg, [], "Unknown bot with missing organizationId must fail closed");
  });

  await t.test("8. searchDocumentsAsync enforces strict tenant isolation and fails closed on mismatch", async () => {
    // Same tenant query retrieves document
    const asyncSameOrg = await documentsStore.searchDocumentsAsync(tenantA_BotId, "warranty", 5, tenantA_OrgId);
    assert.ok(asyncSameOrg.length > 0, "Same tenant async document search should return results");
    assert.ok(asyncSameOrg.every((r) => !r.content.includes("Smile Dental")));

    // Cross-tenant query with mismatched org returns empty
    const asyncCrossOrg = await documentsStore.searchDocumentsAsync(tenantA_BotId, "warranty", 5, tenantB_OrgId);
    assert.deepEqual(asyncCrossOrg, [], "Cross-tenant async search must return empty array");

    // Missing org with unknown bot fails closed
    const asyncUnknown = await documentsStore.searchDocumentsAsync("bot_nonexistent_xyz", "warranty", 5, null);
    assert.deepEqual(asyncUnknown, [], "Async search with unknown bot and missing org must fail closed");
  });

  // Cleanup test documents
  try {
    documentsStore.deleteDocument(docA.id);
    documentsStore.deleteDocument(docB.id);
    documentsStore.deleteDocument(docLegacy.id);
  } catch (e) {}
});
