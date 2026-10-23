process.env.NODE_ENV = "test";
process.env.ALLOW_TEST_EMBEDDINGS = "true";

import test from "node:test";
import assert from "node:assert/strict";
import { documentsStore } from "../../frontend/lib/db/documentsStore.js";
import { searchWebsiteKnowledge } from "../../frontend/lib/crawler/engine.js";

test("Document Knowledge Management — Write, Edit, Index & Isolation", async (t) => {
  const botA_Id = `bot_watch_test_${Date.now()}`;
  const botB_Id = `bot_other_test_${Date.now()}`;

  let createdDocId = null;

  await t.test("1. Create and Write Custom Document Note for Bot A", () => {
    const doc = documentsStore.addDocument({
      botId: botA_Id,
      name: "Fylex Watches Warranty & Pricing Guide",
      type: "Custom Note",
      content: `Fylex Watches provides luxury automatic timepieces.
Model Alpha costs $450 and comes with sapphire crystal glass and 50m water resistance.
All Fylex timepieces carry a 2-year international warranty.
Verification secret: FYLEX-WATCH-TOKEN-7788.`,
    });

    assert.ok(doc.id, "Document must have generated ID");
    assert.equal(doc.botId, botA_Id);
    assert.equal(doc.name, "Fylex Watches Warranty & Pricing Guide");
    assert.ok(doc.chunksCount > 0, "Document must be chunked");
    createdDocId = doc.id;

    // Verify retrievable in bot's document list
    const botDocs = documentsStore.getDocuments(botA_Id);
    assert.equal(botDocs.length, 1);
    assert.equal(botDocs[0].id, createdDocId);
  });

  await t.test("2. Retrieve knowledge from written document for Bot A", async () => {
    const results = await searchWebsiteKnowledge(botA_Id, "What is the warranty and price for Model Alpha?", 3);
    assert.ok(results.length > 0, "Must find relevant chunks from written document");
    const foundWarranty = results.some((r) => r.content.includes("2-year international warranty") || r.content.includes("FYLEX-WATCH-TOKEN-7788"));
    assert.equal(foundWarranty, true, "Must retrieve written warranty information");
  });

  await t.test("3. Edit / Update document text and verify updated knowledge", async () => {
    const updated = documentsStore.updateDocument(createdDocId, {
      name: "Fylex Watches — Updated Warranty & Return Rules",
      content: `Fylex Watches has updated its customer policy.
The international warranty has been extended to 5 years for all owners.
Returns are accepted within 30 days of delivery.
Updated verification token: FYLEX-EXTENDED-WARRANTY-9922.`,
    });

    assert.ok(updated, "Update must succeed");
    assert.equal(updated.name, "Fylex Watches — Updated Warranty & Return Rules");
    assert.ok(updated.content.includes("5 years"));

    // Verify search reflects updated text
    const searchUpdated = await searchWebsiteKnowledge(botA_Id, "How many years is the warranty?", 3);
    assert.ok(searchUpdated.length > 0);
    const found5Years = searchUpdated.some((r) => r.content.includes("5 years"));
    assert.equal(found5Years, true, "Search must retrieve updated 5 years warranty");
  });

  await t.test("4. Multi-Tenant Document Isolation — Bot B cannot see or retrieve Bot A documents", async () => {
    // Bot B documents list must be empty
    const botBDocs = documentsStore.getDocuments(botB_Id);
    assert.equal(botBDocs.length, 0, "Bot B must NOT see Bot A documents");

    // Bot B search must NOT retrieve Bot A warranty or token
    const resultsB = await searchWebsiteKnowledge(botB_Id, "What is the warranty for Fylex Watches?", 3);
    const leaked = resultsB.some((r) => r.content.includes("FYLEX-EXTENDED-WARRANTY-9922") || r.content.includes("Fylex Watches"));
    assert.equal(leaked, false, "Bot B must NEVER retrieve Bot A written document chunks");
  });

  await t.test("5. Delete document", () => {
    const deleted = documentsStore.deleteDocument(createdDocId);
    assert.equal(deleted, true);

    const remaining = documentsStore.getDocuments(botA_Id);
    assert.equal(remaining.length, 0, "Document list must be empty after deletion");
  });
});
