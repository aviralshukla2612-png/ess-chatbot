import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("../helpers/routeLoader.js", import.meta.url);

const { POST: postBot } = await import("../../frontend/app/api/bots/route.js");
const { botsStore } = await import("../../frontend/lib/db/botsStore.js");
const { signSessionToken } = await import("../../frontend/lib/auth/session.js");

function createMockRequest(url, { method = "GET", headers = {}, body = null } = {}) {
  return {
    url,
    method,
    headers: {
      get: (h) => {
        const lower = h.toLowerCase();
        for (const [k, v] of Object.entries(headers)) {
          if (k.toLowerCase() === lower) return v;
        }
        return null;
      },
    },
    json: async () => (body ? (typeof body === "string" ? JSON.parse(body) : body) : {}),
  };
}

describe("Bot Creation Limit Suite - Strict 1 Bot Limit for Users / Sub-Admins", () => {
  it("1. Allows Sub-Admin / Org Owner to create their first bot", async () => {
    const orgId = `org_limit_test_first_${Date.now()}`;
    const token = signSessionToken({
      userId: "user_subadmin_1",
      email: "subadmin@test.com",
      role: "MEMBER",
      organizationId: orgId,
      orgRole: "ORG_ADMIN",
    });

    const req = createMockRequest("http://localhost:3000/api/bots", {
      method: "POST",
      headers: { cookie: `ess_session=${token}` },
      body: { name: "First Assistant", company: "Test Co" },
    });

    const res = await postBot(req);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.bot.name, "First Assistant");
  });

  it("2. Strictly rejects second bot creation for User / Sub-Admin with 403 BOT_LIMIT_EXCEEDED", async () => {
    const orgId = `org_limit_test_second_${Date.now()}`;
    // Seed first bot
    botsStore.upsertBot({
      id: `bot_existing_${Date.now()}`,
      name: "Existing Bot",
      organizationId: orgId,
    }, orgId);

    const token = signSessionToken({
      userId: "user_subadmin_2",
      email: "subadmin2@test.com",
      role: "MEMBER",
      organizationId: orgId,
      orgRole: "ORG_ADMIN",
    });

    const req = createMockRequest("http://localhost:3000/api/bots", {
      method: "POST",
      headers: { cookie: `ess_session=${token}` },
      body: { name: "Second Assistant", company: "Test Co" },
    });

    const res = await postBot(req);
    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.equal(data.code, "BOT_LIMIT_EXCEEDED");
    assert.ok(data.error.includes("restricted to creating 1 bot"));
  });

  it("3. Strictly rejects bot creation with 402 TRIAL_AUTOPAY_MANDATORY when trial autopay is not configured", async () => {
    // An organization that is not seeded with active autopay
    const orgId = `org_unpaid_fresh_${Date.now()}`;
    const token = signSessionToken({
      userId: "user_unpaid_1",
      email: "unpaid@test.com",
      role: "MEMBER",
      organizationId: orgId,
      orgRole: "ORG_ADMIN",
    });

    const req = createMockRequest("http://localhost:3000/api/bots", {
      method: "POST",
      headers: { cookie: `ess_session=${token}` },
      body: { name: "Blocked Assistant", company: "Unpaid Co" },
    });

    const res = await postBot(req);
    const data = await res.json();
    assert.equal(res.status, 402);
    assert.equal(data.success, false);
    assert.equal(data.code, "TRIAL_AUTOPAY_MANDATORY");
    assert.ok(data.error.includes("TRIAL_AUTOPAY_MANDATORY"));
  });
});
