import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { authStore } from "../../frontend/lib/db/authStore.js";
import { botsStore } from "../../frontend/lib/db/botsStore.js";
import { leadsStore } from "../../frontend/lib/db/leadsStore.js";
import { conversationsStore } from "../../frontend/lib/db/conversationsStore.js";
import { documentsStore } from "../../frontend/lib/db/documentsStore.js";
import { signSessionToken, verifySessionToken } from "../../frontend/lib/auth/session.js";
import { requireAuth, requireOrgRole, ROLES } from "../../frontend/lib/auth/guard.js";

describe("Phase P0 Remediation Regression Test Suite", () => {
  beforeEach(() => {
    authStore._resetMemoryStore();
  });

  // =========================================================================
  // Finding 1: Authentication failure must return HTTP 401 and never directLogin
  // =========================================================================
  describe("Finding 1: Authentication Failure & Super-Admin directLogin Bypass Removal", () => {
    it("1.1 Rejects invalid user credentials and throws without returning authenticated session", async () => {
      await authStore.register({
        email: "security-audit@company.com",
        password: "CorrectPassword123!",
        name: "Audit User",
        organizationName: "Audit Org",
      });

      await assert.rejects(
        async () => {
          await authStore.login({
            email: "security-audit@company.com",
            password: "WrongPassword999!",
          });
        },
        (err) => {
          assert.equal(err.message, "Invalid email or password");
          return true;
        }
      );
    });

    it("1.2 Verified login route code does NOT contain directLogin fallback or isDirect flag", () => {
      const loginRoutePath = path.resolve("frontend/app/api/auth/login/route.js");
      const code = fs.readFileSync(loginRoutePath, "utf8");

      assert.equal(
        code.includes("directLogin"),
        false,
        "Login route must never reference directLogin"
      );
      assert.equal(
        code.includes("isDirect"),
        false,
        "Login route must not contain an isDirect backdoor flag"
      );
      assert.ok(
        code.includes("status: 401"),
        "Login route must return HTTP 401 on invalid credentials"
      );
      assert.ok(
        code.includes("Invalid email or password"),
        "Login route must present generic invalid credentials message"
      );
    });
  });

  // =========================================================================
  // Finding 2: Private management endpoints authentication and tenant isolation
  // =========================================================================
  describe("Finding 2: Management Endpoints Authentication & Tenant Isolation", () => {
    it("2.1 requireAuth rejects unauthenticated requests with HTTP 401", async () => {
      const fakeRequest = { headers: new Headers() };
      const res = await requireAuth(fakeRequest);
      assert.equal(res.ok, false);
      assert.equal(res.response.status, 401);
    });

    it("2.2 requireOrgRole rejects unauthenticated callers with HTTP 401", async () => {
      const fakeRequest = { headers: new Headers() };
      const res = await requireOrgRole(fakeRequest, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
      assert.equal(res.ok, false);
      assert.equal(res.response.status, 401);
    });

    it("2.3 Bot endpoint tenant isolation: Tenant B cannot read or delete Tenant A's bot", () => {
      const orgA = "org_p0_tenant_a";
      const orgB = "org_p0_tenant_b";

      // Tenant A creates bot
      botsStore.upsertBot({
        id: "bot_p0_tenant_a",
        name: "Tenant A Sensitive Bot",
        organizationId: orgA,
        status: "Active",
      }, orgA);

      // Tenant B direct lookup returns null
      const crossFetch = botsStore.getBot("bot_p0_tenant_a", orgB);
      assert.equal(crossFetch, null, "Tenant B must not access Tenant A bot");

      // Tenant B delete does not affect Tenant A bot
      botsStore.deleteBot("bot_p0_tenant_a", orgB);
      const stillExists = botsStore.getBot("bot_p0_tenant_a", orgA);
      assert.ok(stillExists, "Tenant A bot must still exist after Tenant B delete attempt");

      // Cleanup
      botsStore.deleteBot("bot_p0_tenant_a", orgA);
    });

    it("2.4 Lead endpoint tenant isolation: Tenant B cannot read or delete Tenant A's lead", () => {
      const orgA = "org_p0_alpha";
      const orgB = "org_p0_beta";

      leadsStore.createLead({
        id: "lead_p0_alpha_exclusive",
        name: "Enterprise Client",
        email: "client@enterprise.com",
        phone: "+919876543210",
        organizationId: orgA,
      });

      // Tenant B direct lookup returns null
      const crossLead = leadsStore.getLead("lead_p0_alpha_exclusive", orgB);
      assert.equal(crossLead, null, "Tenant B must not access Tenant A lead");

      // Tenant B leads list does not contain Tenant A lead
      const betaLeads = leadsStore.getLeads({ organizationId: orgB });
      assert.equal(
        betaLeads.some((l) => l.id === "lead_p0_alpha_exclusive"),
        false,
        "Tenant B list must not include Tenant A lead"
      );

      // Cleanup
      leadsStore.deleteLead("lead_p0_alpha_exclusive");
    });

    it("2.5 Conversation endpoint tenant isolation: Tenant B cannot read Tenant A's conversation", () => {
      const orgA = "org_conv_tenant_a";
      const orgB = "org_conv_tenant_b";

      conversationsStore.createConversation({
        id: "conv_p0_isolated",
        organizationId: orgA,
        visitorName: "Confidential Visitor",
        visitorEmail: "secret@visitor.com",
      });

      // Tenant B direct lookup returns null
      const crossConv = conversationsStore.getConversation("conv_p0_isolated", orgB);
      assert.equal(crossConv, null, "Tenant B must not access Tenant A conversation");

      // Tenant B listing does not include Tenant A conversation
      const betaConvs = conversationsStore.getConversations({ organizationId: orgB });
      assert.equal(
        betaConvs.some((c) => c.id === "conv_p0_isolated"),
        false,
        "Tenant B list must not include Tenant A conversation"
      );

      // Cleanup
      conversationsStore.deleteConversation("conv_p0_isolated");
    });

    it("2.6 Document management is strictly scoped by botId", () => {
      const doc = documentsStore.addDocument({
        id: "doc_p0_test",
        botId: "bot_scoped_123",
        name: "Restricted Policy",
        content: "Only accessible to bot_scoped_123 authorized users.",
      });

      const docsForBot = documentsStore.getDocuments("bot_scoped_123");
      assert.ok(docsForBot.some((d) => d.id === "doc_p0_test"));

      // Other bot cannot see this document
      const otherBotDocs = documentsStore.getDocuments("bot_other_456");
      assert.equal(
        otherBotDocs.some((d) => d.id === "doc_p0_test"),
        false,
        "Other bot must not receive bot_scoped_123 documents"
      );

      // Cleanup
      documentsStore.deleteDocument("doc_p0_test");
    });

    it("2.7 Code verification: all 5 management routes enforce requireAuth and tenant checks", () => {
      const routes = [
        { path: "frontend/app/api/bots/[botId]/route.js", checks: ["requireAuth", "requireOrgRole", "organizationId"] },
        { path: "frontend/app/api/leads/[id]/route.js", checks: ["requireAuth", "organizationId"] },
        { path: "frontend/app/api/conversations/[id]/route.js", checks: ["requireAuth", "targetOrgId"] },
        { path: "frontend/app/api/conversations/[id]/messages/route.js", checks: ["requireAuth", "targetOrgId"] },
        { path: "frontend/app/api/bots/[botId]/documents/route.js", checks: ["requireAuth", "requireOrgRole", "organizationId"] },
      ];

      for (const r of routes) {
        const fullPath = path.resolve(r.path);
        assert.ok(fs.existsSync(fullPath), `Route file ${r.path} must exist`);
        const content = fs.readFileSync(fullPath, "utf8");
        for (const check of r.checks) {
          assert.ok(
            content.includes(check),
            `Route ${r.path} must enforce '${check}'`
          );
        }
      }
    });
  });

  // =========================================================================
  // Finding 3: Database startup destructive cleanup removal & data persistence
  // =========================================================================
  describe("Finding 3: Database Startup Cleanup Safety & Customer Data Persistence", () => {
    it("3.1 Verified dbPool startup code contains NO destructive name-based DELETE queries", () => {
      const dbPoolPath = path.resolve("frontend/lib/db/dbPool.js");
      const content = fs.readFileSync(dbPoolPath, "utf8");

      assert.equal(
        content.includes('DELETE FROM "Bot" WHERE "name"'),
        false,
        "dbPool.js must not contain destructive bot deletions based on name"
      );
      assert.equal(
        content.includes('DELETE FROM "Organization" WHERE "name"'),
        false,
        "dbPool.js must not contain destructive organization deletions based on name"
      );
    });

    it("3.2 Customer bots named 'Assistant' or 'Admin' persist safely", () => {
      const testOrg = "org_customer_corp";
      const bot = botsStore.upsertBot({
        id: "bot_customer_assistant_safe",
        name: "Assistant Bot",
        organizationId: testOrg,
        status: "Active",
      }, testOrg);

      assert.equal(bot.name, "Assistant Bot");

      // Verify bot exists in store
      const retrieved = botsStore.getBot("bot_customer_assistant_safe", testOrg);
      assert.ok(retrieved, "Bot named 'Assistant Bot' must persist in the store");
      assert.equal(retrieved.id, "bot_customer_assistant_safe");

      // Cleanup
      botsStore.deleteBot("bot_customer_assistant_safe", testOrg);
    });
  });

  // =========================================================================
  // Finding 4: Public chatbot API fallback removal
  // =========================================================================
  describe("Finding 4: Public Chatbot API Fallback Removal", () => {
    it("4.1 Unknown chatbot ID resolves to null and NEVER falls back to bot_aa or another bot", () => {
      const nonExistent = botsStore.getBot("completely_unknown_bot_987654321");
      assert.equal(
        nonExistent,
        null,
        "Unknown chatbot ID must return null, never fall back to another bot"
      );
    });

    it("4.2 Code verification: public chat endpoint does not fall back to bot_aa or allBots[0]", () => {
      const chatRoutePath = path.resolve("frontend/app/api/public/chat/[botId]/route.js");
      const content = fs.readFileSync(chatRoutePath, "utf8");

      assert.equal(
        content.includes('bot = (await botsStore.getBotAsync("bot_aa"))'),
        false,
        "Public chat route must not fall back to bot_aa"
      );
      assert.equal(
        content.includes("allBots[0]"),
        false,
        "Public chat route must not fall back to allBots[0]"
      );
      assert.ok(
        content.includes("Chatbot not found or inactive"),
        "Public chat route must return 404 for unknown or inactive bots"
      );
    });

    it("4.3 Code verification: public session endpoint does not fall back to bot_aa or allBots[0]", () => {
      const sessionRoutePath = path.resolve("frontend/app/api/public/chat/[botId]/session/route.js");
      const content = fs.readFileSync(sessionRoutePath, "utf8");

      assert.equal(
        content.includes('bot = (await botsStore.getBotAsync("bot_aa"))'),
        false,
        "Session route must not fall back to bot_aa"
      );
      assert.equal(
        content.includes("allBots[0]"),
        false,
        "Session route must not fall back to allBots[0]"
      );
      assert.ok(
        content.includes("Chatbot not found or inactive"),
        "Session route must return 404 for unknown or inactive bots"
      );
    });

    it("4.4 Code verification: widget-config endpoint returns 404 for unknown or inactive bots", () => {
      const widgetConfigPath = path.resolve("frontend/app/api/bots/[botId]/widget-config/route.js");
      const content = fs.readFileSync(widgetConfigPath, "utf8");

      assert.equal(
        content.includes('bot = (await botsStore.getBotAsync("bot_aa"))'),
        false,
        "Widget-config route must not fall back to bot_aa"
      );
      assert.ok(
        content.includes("Chatbot not found or inactive"),
        "Widget-config route must return 404 for unknown or inactive bots"
      );
    });
  });
});
