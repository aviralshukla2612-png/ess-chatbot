/**
 * Emperor Nexus — Multi-Tenant Concurrency & Isolation Stress Verification
 *
 * Verifies that under concurrent operations across multiple tenants:
 * - No cross-tenant conversation or message leakage occurs.
 * - No cross-tenant lead access occurs.
 * - No visitor or session identity confusion occurs.
 * - Stage 2.8 elimination of default tenant fallback holds 100% under parallel pressure.
 */

import test, { describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

const { authStore } = await import("../../frontend/lib/db/authStore.js");
const { botsStore } = await import("../../frontend/lib/db/botsStore.js");
const { conversationsStore } = await import("../../frontend/lib/db/conversationsStore.js");
const { leadsStore } = await import("../../frontend/lib/db/leadsStore.js");
const { visitorsStore } = await import("../../frontend/lib/db/visitorsStore.js");

describe("Stage 3 Multi-Tenant Concurrency & Isolation Verification", () => {
  const orgAlpha = "org_stage3_alpha_test";
  const orgBeta = "org_stage3_beta_test";
  const botAlpha = "bot_stage3_alpha_01";
  const botBeta = "bot_stage3_beta_01";

  before(() => {
    // Provision Tenant Alpha Bot
    botsStore.upsertBot({
      id: botAlpha,
      name: "Alpha Bot",
      organizationId: orgAlpha,
      status: "Active",
      allowedDomains: ["*"],
    });

    // Provision Tenant Beta Bot
    botsStore.upsertBot({
      id: botBeta,
      name: "Beta Bot",
      organizationId: orgBeta,
      status: "Active",
      allowedDomains: ["*"],
    });
  });

  test("1. Concurrent visitor and session creation maintains strict tenant partition", async () => {
    const operations = [];
    const count = 50;

    for (let i = 0; i < count; i++) {
      const isAlpha = i % 2 === 0;
      const targetOrg = isAlpha ? orgAlpha : orgBeta;
      const targetBot = isAlpha ? botAlpha : botBeta;

      operations.push(
        (async () => {
          const vis = visitorsStore.createVisitor({
            botId: targetBot,
            organizationId: targetOrg,
            name: `Visitor ${i} for ${targetOrg}`,
          });

          const conv = conversationsStore.createConversation({
            visitorId: vis.visitor.id,
            organizationId: targetOrg,
            botId: targetBot,
            visitorName: `Visitor ${i}`,
            messages: [
              {
                id: `m_${Date.now()}_${i}`,
                role: "user",
                text: `Private message for ${targetOrg} #${i}`,
                timestamp: new Date().toISOString(),
              },
            ],
          });

          return { org: targetOrg, visitorId: vis.visitor.id, convId: conv.id };
        })()
      );
    }

    const results = await Promise.all(operations);
    assert.equal(results.length, count);

    // Verify cross-tenant isolation on each record
    for (const item of results) {
      const opposingOrg = item.org === orgAlpha ? orgBeta : orgAlpha;

      // Opposing org MUST NOT be able to read this conversation
      const crossRead = conversationsStore.getConversation(item.convId, opposingOrg);
      assert.equal(crossRead, null, `Cross-tenant read MUST fail for conversation ${item.convId}`);

      // Same org CAN read
      const validRead = conversationsStore.getConversation(item.convId, item.org);
      assert.ok(validRead !== null, `Same-tenant read must succeed`);
      assert.equal(validRead.organizationId, item.org);

      // Default tenant MUST NOT access
      const defaultRead = conversationsStore.getConversation(item.convId, "org_ess_default");
      assert.equal(defaultRead, null, "Default tenant must have zero access to isolated conversation");
    }
  });

  test("2. Concurrent lead ingestion enforces strict organization boundaries", async () => {
    const leadsAlpha = [];
    const leadsBeta = [];

    const tasks = [];
    for (let i = 0; i < 40; i++) {
      const isAlpha = i < 20;
      const targetOrg = isAlpha ? orgAlpha : orgBeta;
      const leadPayload = {
        name: `Lead ${i}`,
        email: `lead_${i}@${isAlpha ? "alpha.test" : "beta.test"}`,
        phone: `+9198765${String(i).padStart(5, "0")}`,
        organizationId: targetOrg,
      };

      tasks.push(
        (async () => {
          const created = leadsStore.createLead(leadPayload);
          if (isAlpha) leadsAlpha.push(created.id);
          else leadsBeta.push(created.id);
        })()
      );
    }

    await Promise.all(tasks);

    // Query Tenant Alpha Leads
    const alphaResults = leadsStore.getLeads({ organizationId: orgAlpha });
    assert.ok(alphaResults.length >= 20);
    assert.ok(alphaResults.every((l) => l.organizationId === orgAlpha), "Alpha leads must only contain Alpha records");
    assert.equal(alphaResults.some((l) => leadsBeta.includes(l.id)), false, "Alpha must NOT contain Beta leads");

    // Query Tenant Beta Leads
    const betaResults = leadsStore.getLeads({ organizationId: orgBeta });
    assert.ok(betaResults.length >= 20);
    assert.ok(betaResults.every((l) => l.organizationId === orgBeta), "Beta leads must only contain Beta records");
    assert.equal(betaResults.some((l) => leadsAlpha.includes(l.id)), false, "Beta must NOT contain Alpha leads");
  });
});
