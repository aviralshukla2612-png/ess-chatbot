import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

// Register custom module loader for Next.js imports and @/ paths
register("../helpers/routeLoader.js", import.meta.url);

const { botsStore } = await import("../../frontend/lib/db/botsStore.js");
const { leadsStore } = await import("../../frontend/lib/db/leadsStore.js");
const { conversationsStore } = await import("../../frontend/lib/db/conversationsStore.js");
const { sseBroker, SSEBroker } = await import("../../frontend/lib/db/sseBroker.js");
const { signSessionToken } = await import("../../frontend/lib/auth/session.js");
const { ROLES } = await import("../../frontend/lib/auth/guard.js");

// Route Handlers
const { POST: cleanDummyPost } = await import("../../frontend/app/api/admin/clean-dummy/route.js");
const { GET: getAdminSettings, POST: postAdminSettings } = await import("../../frontend/app/api/admin/settings/route.js");
const { GET: getAdminStats } = await import("../../frontend/app/api/admin/stats/route.js");
const { GET: getRealtime } = await import("../../frontend/app/api/realtime/route.js");

function createMockRequest(url, { method = "GET", headers = {}, body = null } = {}) {
  const reqHeaders = new Headers(headers);
  if (body && !reqHeaders.has("content-type")) {
    reqHeaders.set("content-type", "application/json");
  }
  return new Request(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : null,
  });
}

function authHeader(token) {
  return { cookie: `ess_session=${encodeURIComponent(token)}` };
}

function createMockStreamController() {
  const chunks = [];
  return {
    chunks,
    enqueue(chunk) {
      const decoded = new TextDecoder().decode(chunk);
      chunks.push(decoded);
    },
    close() {},
    error(err) {},
  };
}

describe("P0.2 Security Verification — Admin Hardening, Realtime Isolation, API Surface", () => {
  const orgAlpha = "org_p02_alpha";
  const orgBeta = "org_p02_beta";

  let tokenOwnerA, tokenMemberA, tokenOwnerB, tokenSuperAdmin;

  before(() => {
    tokenOwnerA = signSessionToken({
      userId: "usr_p02_owner_a",
      email: "owner@alpha-test.com",
      role: "MEMBER",
      organizationId: orgAlpha,
      orgRole: ROLES.ORG_OWNER,
    });

    tokenMemberA = signSessionToken({
      userId: "usr_p02_member_a",
      email: "member@alpha-test.com",
      role: "MEMBER",
      organizationId: orgAlpha,
      orgRole: ROLES.MEMBER,
    });

    tokenOwnerB = signSessionToken({
      userId: "usr_p02_owner_b",
      email: "owner@beta-test.com",
      role: "MEMBER",
      organizationId: orgBeta,
      orgRole: ROLES.ORG_OWNER,
    });

    tokenSuperAdmin = signSessionToken({
      userId: "usr_p02_superadmin",
      email: "superadmin@platform.com",
      role: ROLES.SUPER_ADMIN,
      organizationId: "org_ess_01",
      orgRole: ROLES.SUPER_ADMIN,
    });
  });

  describe("Task 1: Secure Admin Cleanup Endpoint (/api/admin/clean-dummy)", () => {
    it("1.1 Rejects unauthenticated cleanup requests with 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/clean-dummy", {
        method: "POST",
        body: { dryRun: false },
      });
      const res = await cleanDummyPost(req);
      assert.equal(res.status, 401);
    });

    it("1.2 Rejects ordinary tenant owner (non-super-admin) with 403 Forbidden", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/clean-dummy", {
        method: "POST",
        headers: authHeader(tokenOwnerA),
        body: { dryRun: false },
      });
      const res = await cleanDummyPost(req);
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.ok(json.error.includes("Forbidden"));
    });

    it("1.3 Default super-admin invocation performs dry-run preview and modifies ZERO records", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/clean-dummy", {
        method: "POST",
        headers: authHeader(tokenSuperAdmin),
        body: {},
      });
      const res = await cleanDummyPost(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.dryRun, true);
      assert.equal(json.executed, false);
      assert.ok(json.preview);
      assert.ok(json.message.includes("Dry-run preview mode"));
    });

    it("1.4 Rejects execution when confirmation token is incorrect or missing", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/clean-dummy", {
        method: "POST",
        headers: authHeader(tokenSuperAdmin),
        body: { dryRun: false, confirm: "WRONG_TOKEN" },
      });
      const res = await cleanDummyPost(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      // Safe fallback to dryRun preview mode
      assert.equal(json.dryRun, true);
      assert.equal(json.executed, false);
    });

    it("1.5 Preserves protected resources ('bot_aa', 'org_ess_01', 'org_ess_default') even if passed", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/clean-dummy", {
        method: "POST",
        headers: authHeader(tokenSuperAdmin),
        body: {
          dryRun: true,
          targetBotIds: ["bot_aa", "bot_custom_dummy"],
          targetOrgIds: ["org_ess_01", "org_custom_dummy"],
        },
      });
      const res = await cleanDummyPost(req);
      const json = await res.json();
      assert.equal(json.dryRun, true);
      assert.deepEqual(json.preview.targetBotIds, ["bot_custom_dummy"]);
      assert.deepEqual(json.preview.targetOrgIds, ["org_custom_dummy"]);
      assert.ok(!json.preview.targetBotIds.includes("bot_aa"));
      assert.ok(!json.preview.targetOrgIds.includes("org_ess_01"));
    });
  });

  describe("Task 2: Realtime Tenant Isolation & Pre-Delivery Filtering", () => {
    beforeEach(() => {
      sseBroker._reset();
    });

    it("2.1 Delivers Org A events exclusively to Org A subscribers, never to Org B", () => {
      const clientA = createMockStreamController();
      const clientB = createMockStreamController();

      sseBroker.subscribe(clientA, { organizationId: orgAlpha, isSuperAdmin: false });
      sseBroker.subscribe(clientB, { organizationId: orgBeta, isSuperAdmin: false });

      assert.equal(sseBroker.getActiveClientsCount(orgAlpha), 1);
      assert.equal(sseBroker.getActiveClientsCount(orgBeta), 1);

      // Broadcast an event for Org Alpha
      sseBroker.broadcast("lead_created", {
        id: "lead_test_alpha_01",
        organizationId: orgAlpha,
        name: "Confidential Alpha Customer",
      });

      // Verify Org A received it
      assert.equal(clientA.chunks.length, 1);
      assert.ok(clientA.chunks[0].includes("Confidential Alpha Customer"));
      assert.ok(clientA.chunks[0].includes("lead_created"));

      // Verify Org B received ZERO events
      assert.equal(clientB.chunks.length, 0);
    });

    it("2.2 Delivers Org B events exclusively to Org B subscribers, never to Org A", () => {
      const clientA = createMockStreamController();
      const clientB = createMockStreamController();

      sseBroker.subscribe(clientA, { organizationId: orgAlpha, isSuperAdmin: false });
      sseBroker.subscribe(clientB, { organizationId: orgBeta, isSuperAdmin: false });

      // Broadcast an event for Org Beta
      sseBroker.broadcast("message_added", {
        conversationId: "conv_beta_01",
        organizationId: orgBeta,
        message: { content: "Secret Beta Message" },
      });

      // Verify Org B received it
      assert.equal(clientB.chunks.length, 1);
      assert.ok(clientB.chunks[0].includes("Secret Beta Message"));

      // Verify Org A received ZERO events
      assert.equal(clientA.chunks.length, 0);
    });

    it("2.3 Drops unassociated events so tenant subscribers never receive them", () => {
      const clientA = createMockStreamController();
      const clientSuperAdmin = createMockStreamController();

      sseBroker.subscribe(clientA, { organizationId: orgAlpha, isSuperAdmin: false });
      sseBroker.subscribe(clientSuperAdmin, { organizationId: "org_ess_01", isSuperAdmin: true });

      // Broadcast event without organization association
      sseBroker.broadcast("system_ping", {
        status: "alive",
      });

      // Tenant subscriber must NOT receive it
      assert.equal(clientA.chunks.length, 0);

      // Super admin receives it
      assert.equal(clientSuperAdmin.chunks.length, 1);
      assert.ok(clientSuperAdmin.chunks[0].includes("system_ping"));
    });

    it("2.4 Super-admin subscribers receive events across all organizations", () => {
      const clientSuper = createMockStreamController();
      sseBroker.subscribe(clientSuper, { organizationId: "org_ess_01", isSuperAdmin: true });

      sseBroker.broadcast("lead_created", { id: "l1", organizationId: orgAlpha });
      sseBroker.broadcast("lead_created", { id: "l2", organizationId: orgBeta });

      assert.equal(clientSuper.chunks.length, 2);
    });

    it("2.5 Unsubscribing removes client and prevents further event delivery", () => {
      const clientA = createMockStreamController();
      const unsubscribe = sseBroker.subscribe(clientA, { organizationId: orgAlpha });

      assert.equal(sseBroker.getActiveClientsCount(orgAlpha), 1);

      unsubscribe();
      assert.equal(sseBroker.getActiveClientsCount(orgAlpha), 0);

      sseBroker.broadcast("lead_created", { id: "l3", organizationId: orgAlpha });
      assert.equal(clientA.chunks.length, 0);
    });

    it("2.6 Realtime route handler /api/realtime enforces authentication and returns SSE stream", async () => {
      // Unauthenticated
      const unauthReq = createMockRequest("http://localhost:3000/api/realtime");
      const unauthRes = await getRealtime(unauthReq);
      assert.equal(unauthRes.status, 401);

      // Authenticated tenant
      const authReq = createMockRequest("http://localhost:3000/api/realtime", {
        headers: authHeader(tokenOwnerA),
      });
      const authRes = await getRealtime(authReq);
      assert.equal(authRes.status, 200);
      assert.equal(authRes.headers.get("content-type"), "text/event-stream; charset=utf-8");
      assert.equal(authRes.headers.get("cache-control"), "no-cache, no-transform, no-store");
      if (authRes.body?.cancel) {
        await authRes.body.cancel();
      }
    });
  });

  describe("Task 3: Admin Settings and Stats Authorization Guardrails", () => {
    it("3.1 GET /api/admin/settings rejects unauthenticated requests with 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/settings");
      const res = await getAdminSettings(req);
      assert.equal(res.status, 401);
    });

    it("3.2 GET /api/admin/settings rejects non-super-admin with 403 Forbidden", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/settings", {
        headers: authHeader(tokenOwnerA),
      });
      const res = await getAdminSettings(req);
      assert.equal(res.status, 403);
    });

    it("3.3 POST /api/admin/settings rejects unauthenticated requests with 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/settings", {
        method: "POST",
        body: { aiProvider: "ollama" },
      });
      const res = await postAdminSettings(req);
      assert.equal(res.status, 401);
    });

    it("3.4 POST /api/admin/settings rejects non-super-admin with 403 Forbidden", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/settings", {
        method: "POST",
        headers: authHeader(tokenOwnerA),
        body: { aiProvider: "ollama" },
      });
      const res = await postAdminSettings(req);
      assert.equal(res.status, 403);
    });

    it("3.5 GET /api/admin/settings permits super-admin and returns configuration", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/settings", {
        headers: authHeader(tokenSuperAdmin),
      });
      const res = await getAdminSettings(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.ok, true);
      assert.ok(json.settings);
    });

    it("3.6 GET /api/admin/stats rejects unauthenticated requests with 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/stats");
      const res = await getAdminStats(req);
      assert.equal(res.status, 401);
    });

    it("3.7 GET /api/admin/stats rejects non-super-admin with 403 Forbidden", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/stats", {
        headers: authHeader(tokenOwnerA),
      });
      const res = await getAdminStats(req);
      assert.equal(res.status, 403);
    });

    it("3.8 GET /api/admin/stats permits super-admin and returns aggregated metrics", async () => {
      const req = createMockRequest("http://localhost:3000/api/admin/stats", {
        headers: authHeader(tokenSuperAdmin),
      });
      const res = await getAdminStats(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.stats);
    });
  });

  describe("Store Broadcast Scoping Verification", () => {
    beforeEach(() => {
      sseBroker._reset();
    });

    it("4.1 botsStore.deleteBot emits bot_deleted event with organizationId", () => {
      const clientA = createMockStreamController();
      const clientB = createMockStreamController();

      sseBroker.subscribe(clientA, { organizationId: orgAlpha });
      sseBroker.subscribe(clientB, { organizationId: orgBeta });

      // Create test bot in Org Alpha
      botsStore.upsertBot({
        id: "bot_p02_alpha_01",
        name: "Alpha Bot",
        organizationId: orgAlpha,
      }, orgAlpha);

      // Delete bot in Org Alpha
      botsStore.deleteBot("bot_p02_alpha_01", orgAlpha);

      // Verify Org A received bot_deleted with organizationId
      const deleteChunk = clientA.chunks.find((c) => c.includes("bot_deleted"));
      assert.ok(deleteChunk, "Org A should receive bot_deleted");
      assert.ok(deleteChunk.includes(orgAlpha));

      // Verify Org B received ZERO events from bot deletion
      const bDeleteChunk = clientB.chunks.find((c) => c.includes("bot_deleted"));
      assert.ok(!bDeleteChunk, "Org B must not receive Org A bot_deleted event");
    });

    it("4.2 leadsStore.deleteLead emits lead_deleted event with organizationId", () => {
      const clientA = createMockStreamController();
      const clientB = createMockStreamController();

      sseBroker.subscribe(clientA, { organizationId: orgAlpha });
      sseBroker.subscribe(clientB, { organizationId: orgBeta });

      // Create test lead in Org Alpha
      leadsStore.createLead({
        id: "lead_p02_alpha_01",
        name: "Alpha Prospect",
        organizationId: orgAlpha,
      });

      // Delete lead in Org Alpha
      leadsStore.deleteLead("lead_p02_alpha_01", orgAlpha);

      // Verify Org A received lead_deleted
      const deleteChunk = clientA.chunks.find((c) => c.includes("lead_deleted"));
      assert.ok(deleteChunk, "Org A should receive lead_deleted");
      assert.ok(deleteChunk.includes(orgAlpha));

      // Verify Org B received ZERO events
      const bDeleteChunk = clientB.chunks.find((c) => c.includes("lead_deleted"));
      assert.ok(!bDeleteChunk, "Org B must not receive Org A lead_deleted event");
    });

    it("4.3 conversationsStore.deleteConversation emits conversation_deleted event with organizationId", () => {
      const clientA = createMockStreamController();
      const clientB = createMockStreamController();

      sseBroker.subscribe(clientA, { organizationId: orgAlpha });
      sseBroker.subscribe(clientB, { organizationId: orgBeta });

      // Create test conversation in Org Alpha
      conversationsStore.createConversation({
        id: "conv_p02_alpha_01",
        organizationId: orgAlpha,
        messages: [{ role: "user", content: "Hello from Alpha" }],
      });

      // Delete conversation in Org Alpha
      conversationsStore.deleteConversation("conv_p02_alpha_01", orgAlpha);

      // Verify Org A received conversation_deleted
      const deleteChunk = clientA.chunks.find((c) => c.includes("conversation_deleted"));
      assert.ok(deleteChunk, "Org A should receive conversation_deleted");
      assert.ok(deleteChunk.includes(orgAlpha));

      // Verify Org B received ZERO events
      const bDeleteChunk = clientB.chunks.find((c) => c.includes("conversation_deleted"));
      assert.ok(!bDeleteChunk, "Org B must not receive Org A conversation_deleted event");
    });
  });
});
