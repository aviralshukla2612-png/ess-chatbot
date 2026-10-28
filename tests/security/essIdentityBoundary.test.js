/**
 * tests/security/essIdentityBoundary.test.js
 *
 * Security Regression Test Suite for ESS Identity & Privileged Bot Protection
 * Validates Part B requirements:
 * 1. A bot ID by itself (e.g., bot_aa) must not grant ESS identity or privileges.
 * 2. An ordinary tenant cannot obtain ESS identity by naming or configuring a bot.
 * 3. Bot creation cannot impersonate an existing privileged bot by submitting a chosen ID.
 * 4. Legitimate ESS organization retains intended behavior.
 * 5. Missing or conflicting ownership fails closed without granting ESS privileges.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { buildMasterSystemPrompt, checkInputScopeAndSafety } from "../../frontend/lib/ai/masterPrompt.js";
import { botsStore } from "../../frontend/lib/db/botsStore.js";
import { POST as createBotRoute } from "../../frontend/app/api/bots/route.js";

test("PART B Security Suite — ESS Identity & Privileged Bot Boundaries", async (t) => {
  const tenantOrgId = `org_watches_${Date.now()}`;
  const legitimateEssOrgId = "org_ess_default";

  await t.test("1. Ordinary tenant bot using id 'bot_aa' does NOT obtain ESS identity or prompt", () => {
    // Malicious or misconfigured tenant attempts to claim bot_aa
    const imposterBot = {
      id: "bot_aa",
      organizationId: tenantOrgId,
      name: "Watch Bot",
      company: "Apex Luxury Watches",
      companyName: "Apex Luxury Watches",
      isEss: true, // Tenant fraudulently claims isEss
    };

    const prompt = buildMasterSystemPrompt({
      bot: imposterBot,
      businessName: imposterBot.company,
      tenantId: tenantOrgId,
    });

    // Must NOT contain ESS agency information or founders
    assert.doesNotMatch(prompt, /Emperor Smart Solutions/);
    assert.doesNotMatch(prompt, /Yash Sharma/);
    assert.doesNotMatch(prompt, /Karan Makwana/);
    assert.doesNotMatch(prompt, /₹50,000/);

    // Perimeter safety check must NOT treat imposter as ESS
    const scopeCheck = checkInputScopeAndSafety("We need software development for mobile", {
      bot: imposterBot,
      businessName: imposterBot.company,
      organizationId: tenantOrgId,
      prohibitedTopics: ["software development"],
      outOfScopeFallback: "Apex Luxury Watches only handles timepieces.",
    });
    // Non-ESS bot with prohibited topic should be blocked, not treated as ESS software agency
    assert.equal(scopeCheck.blocked, true);
    assert.equal(scopeCheck.reply, "Apex Luxury Watches only handles timepieces.");
  });

  await t.test("2. Bot with missing or undefined organizationId does NOT obtain ESS privileges", () => {
    const unownedBot = {
      id: "bot_aa",
      // organizationId missing/undefined
      name: "Unowned Bot",
      company: "Unowned Entity",
    };

    const prompt = buildMasterSystemPrompt({
      bot: unownedBot,
      businessName: unownedBot.company,
      tenantId: null,
    });

    assert.doesNotMatch(prompt, /Emperor Smart Solutions/);
    assert.doesNotMatch(prompt, /Yash Sharma/);
    assert.doesNotMatch(prompt, /Karan Makwana/);
  });

  await t.test("3. Legitimate ESS bot owned by 'org_ess_default' retains intended ESS behavior", () => {
    const legitEssBot = {
      id: "bot_aa",
      organizationId: legitimateEssOrgId,
      name: "Emperor AI",
      company: "Emperor Smart Solutions",
      companyName: "Emperor Smart Solutions",
      isEss: true,
    };

    const prompt = buildMasterSystemPrompt({
      bot: legitEssBot,
      businessName: legitEssBot.company,
      tenantId: legitimateEssOrgId,
    });

    assert.match(prompt, /Emperor Smart Solutions/);
    assert.match(prompt, /Yash Sharma/);
    assert.match(prompt, /Karan Makwana/);
    assert.match(prompt, /63591 20081/);
  });

  await t.test("4. POST /api/bots rejects non-ESS caller attempting to create bot with id 'bot_aa'", async () => {
    const payload = {
      id: "bot_aa",
      name: "Hacked ESS Bot",
      company: "Sneaky Tenant",
    };

    const mockReq = {
      json: async () => payload,
      headers: new Headers(),
    };

    // Principal belongs to tenantOrgId, NOT org_ess_default
    const mockPrincipal = {
      authenticated: true,
      userId: "usr_attacker",
      organizationId: tenantOrgId,
      orgRole: "ORG_ADMIN",
    };

    const res = await createBotRoute(mockReq, { _testPrincipal: mockPrincipal });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Reserved bot ID/);
  });

  await t.test("5. POST /api/bots rejects conflicting bot ID already owned by another organization", async () => {
    const victimOrgId = `org_victim_${Date.now()}`;
    const victimBotId = `bot_victim_${Date.now()}`;

    // Seed existing bot for victim
    botsStore.upsertBot({
      id: victimBotId,
      name: "Victim Bot",
      company: "Victim Corp",
      organizationId: victimOrgId,
    }, victimOrgId);

    // Attacker tries to create a bot with the same ID
    const payload = {
      id: victimBotId,
      name: "Imposter Bot",
      company: "Attacker Corp",
    };

    const mockReq = {
      json: async () => payload,
      headers: new Headers(),
    };

    const mockPrincipal = {
      authenticated: true,
      userId: "usr_attacker_2",
      organizationId: tenantOrgId,
      orgRole: "ORG_ADMIN",
    };

    const res = await createBotRoute(mockReq, { _testPrincipal: mockPrincipal });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /Bot ID already exists/);
  });

  await t.test("6. botsStore.upsertBot reassigns safe unique ID if non-ESS tenant submits reserved ID", () => {
    const createdBot = botsStore.upsertBot({
      id: "bot_aa",
      name: "Tenant Watch Bot",
      company: "Watch Co",
    }, tenantOrgId);

    assert.notEqual(createdBot.id, "bot_aa", "Must strip bot_aa from non-ESS tenant");
    assert.ok(createdBot.id.startsWith("bot_"), "Must assign valid bot_ prefix ID");
    assert.equal(createdBot.organizationId, tenantOrgId);
  });
});
