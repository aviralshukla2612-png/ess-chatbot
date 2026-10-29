import test from "node:test";
import assert from "node:assert/strict";
import { conversationsStore } from "../../frontend/lib/db/conversationsStore.js";
import { leadsStore } from "../../frontend/lib/db/leadsStore.js";
import { documentsStore } from "../../frontend/lib/db/documentsStore.js";
import { visitorsStore } from "../../frontend/lib/db/visitorsStore.js";

test("Multi-Bot Isolation Suite", async (t) => {
  const orgId = "org_isolation_test_999";
  const bot1 = "bot_clinic_dentist";
  const bot2 = "bot_realty_homes";

  await t.test("1. Conversations created for Bot 1 are strictly isolated from Bot 2", () => {
    const conv1 = conversationsStore.createConversation({
      id: "conv_dentist_001",
      organizationId: orgId,
      botId: bot1,
      botName: "Dentist Assistant",
      visitorName: "Tooth Patient",
      messages: [{ role: "user", content: "Need a root canal" }],
    });

    const conv2 = conversationsStore.createConversation({
      id: "conv_realty_001",
      organizationId: orgId,
      botId: bot2,
      botName: "Realty Assistant",
      visitorName: "Home Buyer",
      messages: [{ role: "user", content: "Looking for 3BHK" }],
    });

    const dentistConvs = conversationsStore.getConversations({ organizationId: orgId, botId: bot1 });
    const realtyConvs = conversationsStore.getConversations({ organizationId: orgId, botId: bot2 });

    assert.ok(dentistConvs.some((c) => c.id === "conv_dentist_001"));
    assert.equal(dentistConvs.some((c) => c.id === "conv_realty_001"), false, "Dentist bot must not see Realty conversations");

    assert.ok(realtyConvs.some((c) => c.id === "conv_realty_001"));
    assert.equal(realtyConvs.some((c) => c.id === "conv_dentist_001"), false, "Realty bot must not see Dentist conversations");
  });

  await t.test("2. Active visitor conversation lookup strictly isolates between Bot 1 and Bot 2", () => {
    const visitorId = "vis_shared_browser_user";

    conversationsStore.createConversation({
      id: "conv_dentist_active",
      organizationId: orgId,
      botId: bot1,
      visitorId: visitorId,
      status: "Active",
      messages: [{ role: "user", content: "Dentist query" }],
    });

    conversationsStore.createConversation({
      id: "conv_realty_active",
      organizationId: orgId,
      botId: bot2,
      visitorId: visitorId,
      status: "Active",
      messages: [{ role: "user", content: "Realty query" }],
    });

    const activeForDentist = conversationsStore.getActiveConversationForVisitor(visitorId, bot1);
    const activeForRealty = conversationsStore.getActiveConversationForVisitor(visitorId, bot2);

    assert.ok(activeForDentist, "Should find active conversation for dentist bot");
    assert.equal(activeForDentist.botId, bot1);
    assert.equal(activeForDentist.id, "conv_dentist_active");

    assert.ok(activeForRealty, "Should find active conversation for realty bot");
    assert.equal(activeForRealty.botId, bot2);
    assert.equal(activeForRealty.id, "conv_realty_active");
  });

  await t.test("3. addMessage correctly assigns botId and does not fallback to bot_aa", () => {
    const newSessionId = `session_auto_${Date.now()}`;
    const added = conversationsStore.addMessage(
      newSessionId,
      { role: "user", content: "Hello Dentist" },
      { botId: bot1, botName: "Dentist Bot", organizationId: orgId }
    );

    const retrieved = conversationsStore.getConversation(newSessionId);
    assert.ok(retrieved, "Conversation should exist");
    assert.equal(retrieved.botId, bot1, "Conversation must have bot1 botId, not bot_aa");
    assert.equal(retrieved.organizationId, orgId);
  });

  await t.test("4. Leads captured for Bot 1 are strictly isolated from Bot 2", () => {
    leadsStore.createLead({
      id: "lead_dentist_patient_999",
      botId: bot1,
      organizationId: orgId,
      name: "Patient Sarah",
      phone: "+919111199991",
      inquiry: "Teeth cleaning appointment",
    });

    leadsStore.createLead({
      id: "lead_realty_client_999",
      botId: bot2,
      organizationId: orgId,
      name: "Investor David",
      phone: "+919222299992",
      inquiry: "Villa purchase",
    });

    const dentistLeads = leadsStore.getLeads({ organizationId: orgId, botId: bot1 });
    const realtyLeads = leadsStore.getLeads({ organizationId: orgId, botId: bot2 });

    assert.ok(dentistLeads.some((l) => l.name === "Patient Sarah"));
    assert.equal(dentistLeads.some((l) => l.name === "Investor David"), false, "Dentist leads must not show Realty leads");

    assert.ok(realtyLeads.some((l) => l.name === "Investor David"));
    assert.equal(realtyLeads.some((l) => l.name === "Patient Sarah"), false, "Realty leads must not show Dentist leads");
  });

  await t.test("5. Knowledge documents for Bot 1 are never returned for Bot 2", () => {
    documentsStore.addDocument({
      id: "doc_dentist_treatments",
      botId: bot1,
      name: "Dental Services & Pricing",
      content: "Root canal treatment costs 5000 rupees. Dental implants cost 25000 rupees.",
    });

    documentsStore.addDocument({
      id: "doc_realty_listings",
      botId: bot2,
      name: "Luxury Villas & Apartments",
      content: "3BHK apartments starting at 85 Lakhs in Green Valley.",
    });

    // Query dentist knowledge
    const dentistResults = documentsStore.searchDocuments(bot1, "treatment root canal implants");
    assert.ok(dentistResults.length > 0, "Dentist search should find dental docs");
    assert.ok(dentistResults.every((r) => r.pageTitle.includes("Dental")));

    // Query realty bot for dental keywords -> MUST RETURN EMPTY
    const realtyResults = documentsStore.searchDocuments(bot2, "root canal treatment");
    assert.equal(realtyResults.length, 0, "Realty bot must NOT find dental documents");

    // Query realty knowledge
    const realtyResults2 = documentsStore.searchDocuments(bot2, "apartments luxury villas");
    assert.ok(realtyResults2.length > 0, "Realty search should find realty docs");
    assert.ok(realtyResults2.every((r) => r.pageTitle.includes("Luxury Villas")));

    // Query dentist bot for apartment keywords -> MUST RETURN EMPTY
    const dentistResults2 = documentsStore.searchDocuments(bot1, "apartments luxury villas");
    assert.equal(dentistResults2.length, 0, "Dentist bot must NOT find realty documents");
  });

  await t.test("6. Visitor identity tokens are strictly isolated per botId", () => {
    const created1 = visitorsStore.createVisitor({
      organizationId: orgId,
      botId: bot1,
      name: "Dentist Visitor",
    });

    const token = created1.rawToken;

    // Resolving on Bot 1 -> OK
    const foundOnBot1 = visitorsStore.getVisitorByToken(bot1, token);
    assert.ok(foundOnBot1);
    assert.equal(foundOnBot1.botId, bot1);

    // Resolving on Bot 2 -> MUST BE NULL
    const foundOnBot2 = visitorsStore.getVisitorByToken(bot2, token);
    assert.equal(foundOnBot2, null, "Visitor token from Bot 1 must not resolve on Bot 2");
  });
});
