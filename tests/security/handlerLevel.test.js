import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

// Register custom module loader for Next.js imports and @/ paths
register("../helpers/routeLoader.js", import.meta.url);

// Dynamic imports of modules and route handlers
const { authStore } = await import("../../frontend/lib/db/authStore.js");
const { botsStore } = await import("../../frontend/lib/db/botsStore.js");
const { leadsStore } = await import("../../frontend/lib/db/leadsStore.js");
const { conversationsStore } = await import("../../frontend/lib/db/conversationsStore.js");
const { documentsStore } = await import("../../frontend/lib/db/documentsStore.js");
const { websitesDb } = await import("../../frontend/lib/db/websites.js");
const { signSessionToken } = await import("../../frontend/lib/auth/session.js");
const { ROLES } = await import("../../frontend/lib/auth/guard.js");

// Route Handlers
const { POST: loginHandler } = await import("../../frontend/app/api/auth/login/route.js");
const { GET: getBot, PUT: putBot, DELETE: deleteBot } = await import("../../frontend/app/api/bots/[botId]/route.js");
const { GET: getLead, PUT: putLead, DELETE: deleteLead } = await import("../../frontend/app/api/leads/[id]/route.js");
const { GET: getConv, PUT: putConv, DELETE: deleteConv } = await import("../../frontend/app/api/conversations/[id]/route.js");
const { POST: postMessage } = await import("../../frontend/app/api/conversations/[id]/messages/route.js");
const { GET: getDocs, POST: postDoc } = await import("../../frontend/app/api/bots/[botId]/documents/route.js");
const { GET: getBotWebsites, POST: postBotWebsite } = await import("../../frontend/app/api/bots/[botId]/websites/route.js");
const { POST: postWidgetVerification } = await import("../../frontend/app/api/bots/[botId]/widget-verification/route.js");
const { GET: getWebsite, DELETE: deleteWebsite } = await import("../../frontend/app/api/websites/[websiteId]/route.js");
const { POST: cancelWebsite } = await import("../../frontend/app/api/websites/[websiteId]/cancel/route.js");
const { GET: getWebsitePages } = await import("../../frontend/app/api/websites/[websiteId]/pages/route.js");
const { POST: excludeWebsitePage } = await import("../../frontend/app/api/websites/[websiteId]/pages/[pageId]/exclude/route.js");
const { POST: syncWebsite } = await import("../../frontend/app/api/websites/[websiteId]/sync/route.js");
const { GET: getAnalytics } = await import("../../frontend/app/api/analytics/route.js");
const { GET: getRealtime } = await import("../../frontend/app/api/realtime/route.js");
const { POST: publicChatPost } = await import("../../frontend/app/api/public/chat/[botId]/route.js");
const { GET: publicSessionGet, DELETE: publicSessionDelete } = await import("../../frontend/app/api/public/chat/[botId]/session/route.js");
const { GET: getWidgetConfig } = await import("../../frontend/app/api/bots/[botId]/widget-config/route.js");
const { POST: chatAliasPost } = await import("../../frontend/app/api/chat/route.js");

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

describe("Handler-Level Security Verification Suite", () => {
  const orgAlpha = "org_handler_alpha";
  const orgBeta = "org_handler_beta";

  let tokenOwnerA, tokenMemberA, tokenOwnerB;

  before(async () => {
    // Generate valid session tokens for different tenants and roles
    tokenOwnerA = signSessionToken({
      userId: "usr_owner_a",
      email: "owner@alpha.com",
      role: "MEMBER",
      organizationId: orgAlpha,
      orgRole: ROLES.ORG_OWNER,
    });

    tokenMemberA = signSessionToken({
      userId: "usr_member_a",
      email: "member@alpha.com",
      role: "MEMBER",
      organizationId: orgAlpha,
      orgRole: ROLES.MEMBER,
    });

    tokenOwnerB = signSessionToken({
      userId: "usr_owner_b",
      email: "owner@beta.com",
      role: "MEMBER",
      organizationId: orgBeta,
      orgRole: ROLES.ORG_OWNER,
    });
  });

  beforeEach(() => {
    authStore._resetMemoryStore();
  });

  // =========================================================================
  // 1. Authentication Handler Execution
  // =========================================================================
  describe("1. Real Authentication Handler Execution (POST /api/auth/login)", () => {
    it("1.1 Rejects wrong password with HTTP 401 and sets NO session cookie", async () => {
      await authStore.register({
        email: "alice@alpha.com",
        password: "RealPassword123!",
        name: "Alice",
        organizationName: "Alpha Corp",
      });

      const req = createMockRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "alice@alpha.com", password: "WrongPassword999!" },
      });

      const res = await loginHandler(req);
      assert.equal(res.status, 401, "Expected HTTP 401 for bad password");

      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.error, "Invalid email or password");
      assert.equal(res.headers.get("set-cookie"), null, "Must not set cookie on failure");
    });

    it("1.2 Rejects nonexistent email with HTTP 401 without cookie", async () => {
      const req = createMockRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "ghost@nowhere.com", password: "AnyPassword123!" },
      });

      const res = await loginHandler(req);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(res.headers.get("set-cookie"), null);
    });

    it("1.3 Rejects missing credentials with HTTP 400", async () => {
      const req = createMockRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "" },
      });

      const res = await loginHandler(req);
      assert.equal(res.status, 400);
      assert.equal(res.headers.get("set-cookie"), null);
    });

    it("1.4 Authenticates valid credentials with HTTP 200 and issues session cookie", async () => {
      await authStore.register({
        email: "bob@alpha.com",
        password: "ValidEnterprisePassword2026!",
        name: "Bob",
        organizationName: "Alpha Corp",
      });

      const req = createMockRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: { email: "bob@alpha.com", password: "ValidEnterprisePassword2026!" },
      });

      const res = await loginHandler(req);
      assert.equal(res.status, 200);

      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.token);

      const cookieHeader = res.headers.get("set-cookie");
      assert.ok(cookieHeader && cookieHeader.includes("ess_session="), "Must set ess_session cookie");
    });
  });

  // =========================================================================
  // 2. Unauthenticated Access to Private Management Endpoints
  // =========================================================================
  describe("2. Unauthenticated Access Rejection across Management Routes", () => {
    it("2.1 Rejects unauthenticated GET /api/bots/[botId] with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/bots/bot_123");
      const res = await getBot(req, { params: Promise.resolve({ botId: "bot_123" }) });
      assert.equal(res.status, 401);
    });

    it("2.2 Rejects unauthenticated PUT /api/bots/[botId] with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/bots/bot_123", {
        method: "PUT",
        body: { name: "Malicious Edit" },
      });
      const res = await putBot(req, { params: Promise.resolve({ botId: "bot_123" }) });
      assert.equal(res.status, 401);
    });

    it("2.3 Rejects unauthenticated DELETE /api/bots/[botId] with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/bots/bot_123", { method: "DELETE" });
      const res = await deleteBot(req, { params: Promise.resolve({ botId: "bot_123" }) });
      assert.equal(res.status, 401);
    });

    it("2.4 Rejects unauthenticated GET /api/leads/[id] with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/leads/lead_123");
      const res = await getLead(req, { params: Promise.resolve({ id: "lead_123" }) });
      assert.equal(res.status, 401);
    });

    it("2.5 Rejects unauthenticated GET /api/conversations/[id] with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/conversations/conv_123");
      const res = await getConv(req, { params: Promise.resolve({ id: "conv_123" }) });
      assert.equal(res.status, 401);
    });

    it("2.6 Rejects unauthenticated POST /api/conversations/[id]/messages with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/conversations/conv_123/messages", {
        method: "POST",
        body: { content: "Unauthorized message" },
      });
      const res = await postMessage(req, { params: Promise.resolve({ id: "conv_123" }) });
      assert.equal(res.status, 401);
    });

    it("2.7 Rejects unauthenticated GET /api/bots/[botId]/documents with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/bots/bot_123/documents");
      const res = await getDocs(req, { params: Promise.resolve({ botId: "bot_123" }) });
      assert.equal(res.status, 401);
    });

    it("2.8 Rejects unauthenticated GET /api/analytics with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/analytics");
      const res = await getAnalytics(req);
      assert.equal(res.status, 401);
    });

    it("2.9 Rejects unauthenticated GET /api/realtime with HTTP 401", async () => {
      const req = createMockRequest("http://localhost:3000/api/realtime");
      const res = await getRealtime(req);
      assert.equal(res.status, 401);
    });

    it("2.10 Rejects unauthenticated GET and POST /api/bots/[botId]/websites with HTTP 401", async () => {
      const reqGet = createMockRequest("http://localhost:3000/api/bots/bot_123/websites");
      const resGet = await getBotWebsites(reqGet, { params: Promise.resolve({ botId: "bot_123" }) });
      assert.equal(resGet.status, 401);

      const reqPost = createMockRequest("http://localhost:3000/api/bots/bot_123/websites", {
        method: "POST",
        body: { baseUrl: "https://example.com" },
      });
      const resPost = await postBotWebsite(reqPost, { params: Promise.resolve({ botId: "bot_123" }) });
      assert.equal(resPost.status, 401);
    });
  });

  // =========================================================================
  // 3. Cross-Tenant Isolation Handler Execution
  // =========================================================================
  describe("3. Cross-Tenant Isolation Enforcement (Tenant A accessing Tenant B)", () => {
    const botBetaId = "bot_beta_confidential";
    const leadBetaId = "lead_beta_confidential";
    const convBetaId = "conv_beta_confidential";

    before(() => {
      // Seed Tenant B's private resources
      botsStore.upsertBot({
        id: botBetaId,
        name: "Beta Financial Bot",
        organizationId: orgBeta,
        status: "Active",
      }, orgBeta);

      leadsStore.createLead({
        id: leadBetaId,
        name: "Beta High Net Worth Client",
        email: "client@beta-wealth.com",
        organizationId: orgBeta,
      });

      conversationsStore.createConversation({
        id: convBetaId,
        organizationId: orgBeta,
        botId: botBetaId,
        visitorName: "Beta Secret Visitor",
        visitorEmail: "secret@beta.com",
      });
    });

    after(() => {
      botsStore.deleteBot(botBetaId, orgBeta);
      leadsStore.deleteLead(leadBetaId);
      conversationsStore.deleteConversation(convBetaId);
    });

    it("3.1 Tenant A cannot GET Tenant B's bot (returns 404)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/bots/${botBetaId}`, {
        headers: authHeader(tokenOwnerA),
      });
      const res = await getBot(req, { params: Promise.resolve({ botId: botBetaId }) });
      assert.equal(res.status, 404, "Cross-tenant bot read must return 404");
    });

    it("3.2 Tenant A cannot PUT (mutate) Tenant B's bot (returns 404)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/bots/${botBetaId}`, {
        method: "PUT",
        headers: authHeader(tokenOwnerA),
        body: { name: "Hijacked Bot Name" },
      });
      const res = await putBot(req, { params: Promise.resolve({ botId: botBetaId }) });
      assert.equal(res.status, 404, "Cross-tenant bot mutation must return 404");

      // Verify original bot was untouched
      const bot = botsStore.getBot(botBetaId, orgBeta);
      assert.equal(bot.name, "Beta Financial Bot");
    });

    it("3.3 Tenant A cannot DELETE Tenant B's bot (returns 404)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/bots/${botBetaId}`, {
        method: "DELETE",
        headers: authHeader(tokenOwnerA),
      });
      const res = await deleteBot(req, { params: Promise.resolve({ botId: botBetaId }) });
      assert.equal(res.status, 404, "Cross-tenant bot delete must return 404");

      const bot = botsStore.getBot(botBetaId, orgBeta);
      assert.ok(bot, "Tenant B bot must still exist");
    });

    it("3.4 Tenant A cannot GET Tenant B's lead (returns 404)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/leads/${leadBetaId}`, {
        headers: authHeader(tokenOwnerA),
      });
      const res = await getLead(req, { params: Promise.resolve({ id: leadBetaId }) });
      assert.equal(res.status, 404, "Cross-tenant lead read must return 404");
    });

    it("3.5 Tenant A cannot GET Tenant B's conversation (returns 404)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/conversations/${convBetaId}`, {
        headers: authHeader(tokenOwnerA),
      });
      const res = await getConv(req, { params: Promise.resolve({ id: convBetaId }) });
      assert.equal(res.status, 404, "Cross-tenant conversation read must return 404");
    });

    it("3.6 Tenant A cannot inject message into Tenant B's conversation (returns 404)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/conversations/${convBetaId}/messages`, {
        method: "POST",
        headers: authHeader(tokenOwnerA),
        body: { content: "Phishing message injected" },
      });
      const res = await postMessage(req, { params: Promise.resolve({ id: convBetaId }) });
      assert.equal(res.status, 404, "Cross-tenant message injection must return 404");
    });

    it("3.7 Tenant A cannot upload documents to Tenant B's bot (returns 404)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/bots/${botBetaId}/documents`, {
        method: "POST",
        headers: authHeader(tokenOwnerA),
        body: { name: "Malicious Doc", content: "Tampered content", type: "PDF" },
      });
      const res = await postDoc(req, { params: Promise.resolve({ botId: botBetaId }) });
      assert.equal(res.status, 404, "Cross-tenant document upload must return 404");
    });
  });

  // =========================================================================
  // 4. Role Authorization on Mutations
  // =========================================================================
  describe("4. Role Authorization on Mutations (MEMBER vs ORG_OWNER)", () => {
    const botAlphaId = "bot_alpha_role_test";

    before(() => {
      botsStore.upsertBot({
        id: botAlphaId,
        name: "Alpha Role Test Bot",
        organizationId: orgAlpha,
        status: "Active",
      }, orgAlpha);
    });

    after(() => {
      botsStore.deleteBot(botAlphaId, orgAlpha);
    });

    it("4.1 MEMBER can GET bot within same organization (HTTP 200)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/bots/${botAlphaId}`, {
        headers: authHeader(tokenMemberA),
      });
      const res = await getBot(req, { params: Promise.resolve({ botId: botAlphaId }) });
      assert.equal(res.status, 200);
    });

    it("4.2 MEMBER cannot PUT (mutate) bot (returns HTTP 403 Forbidden)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/bots/${botAlphaId}`, {
        method: "PUT",
        headers: authHeader(tokenMemberA),
        body: { name: "Unauthorized Member Edit" },
      });
      const res = await putBot(req, { params: Promise.resolve({ botId: botAlphaId }) });
      assert.equal(res.status, 403, "MEMBER role must be rejected with 403 on bot edit");
    });

    it("4.3 MEMBER cannot DELETE bot (returns HTTP 403 Forbidden)", async () => {
      const req = createMockRequest(`http://localhost:3000/api/bots/${botAlphaId}`, {
        method: "DELETE",
        headers: authHeader(tokenMemberA),
      });
      const res = await deleteBot(req, { params: Promise.resolve({ botId: botAlphaId }) });
      assert.equal(res.status, 403, "MEMBER role must be rejected with 403 on bot delete");
    });
  });

  // =========================================================================
  // 5. Public Chatbot API Fallback Elimination
  // =========================================================================
  describe("5. Public Chatbot Visitor Endpoints Strict Resolution", () => {
    it("5.1 Public chat returns 404 for unknown bot and NEVER falls back to another bot", async () => {
      const req = createMockRequest("http://localhost:3000/api/public/chat/unknown_random_bot_9999", {
        method: "POST",
        body: { message: "Hello chatbot" },
      });
      const res = await publicChatPost(req, { params: Promise.resolve({ botId: "unknown_random_bot_9999" }) });
      assert.equal(res.status, 404);

      const body = await res.json();
      assert.equal(body.error, "Chatbot not found or inactive");
    });

    it("5.2 Public session returns 404 for unknown bot", async () => {
      const req = createMockRequest("http://localhost:3000/api/public/chat/unknown_random_bot_9999/session");
      const res = await publicSessionGet(req, { params: Promise.resolve({ botId: "unknown_random_bot_9999" }) });
      assert.equal(res.status, 404);

      const body = await res.json();
      assert.equal(body.error, "Chatbot not found or inactive");
    });

    it("5.3 Public session DELETE returns 404 for unknown bot", async () => {
      const req = createMockRequest("http://localhost:3000/api/public/chat/unknown_random_bot_9999/session", {
        method: "DELETE",
      });
      const res = await publicSessionDelete(req, { params: Promise.resolve({ botId: "unknown_random_bot_9999" }) });
      assert.equal(res.status, 404);
    });

    it("5.4 Widget config returns 404 for unknown bot", async () => {
      const req = createMockRequest("http://localhost:3000/api/bots/unknown_random_bot_9999/widget-config");
      const res = await getWidgetConfig(req, { params: Promise.resolve({ botId: "unknown_random_bot_9999" }) });
      assert.equal(res.status, 404);
    });

    it("5.5 POST /api/chat alias without botId returns HTTP 400 instead of falling back to bot_aa", async () => {
      const req = createMockRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: { message: "Hello without bot ID" },
      });
      const res = await chatAliasPost(req);
      assert.equal(res.status, 400, "Missing botId must return HTTP 400");
      const body = await res.json();
      assert.equal(body.error, "Chatbot ID is required");
    });
  });
});
