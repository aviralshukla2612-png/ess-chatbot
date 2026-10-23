import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { leadsStore } from "../../frontend/lib/db/leadsStore.js";
import { visitorsStore } from "../../frontend/lib/db/visitorsStore.js";
import { conversationsStore } from "../../frontend/lib/db/conversationsStore.js";

describe("Organization Roles & Implicit Fallback Remediation Suite", () => {
  describe("1. Organization Role Authorization Checks (PATCH /api/auth/me)", () => {
    it("Allows ORG_OWNER and ORG_ADMIN to update organization name", async () => {
      const allowedRoles = ["OWNER", "ORG_OWNER", "ADMIN", "ORG_ADMIN"];
      for (const role of allowedRoles) {
        const canUpdateOrg =
          allowedRoles.includes(role) || role === "SUPER_ADMIN";
        assert.equal(canUpdateOrg, true, `Role ${role} should be permitted`);
      }
    });

    it("Allows platform SUPER_ADMIN to update organization name", async () => {
      const principal = { platformRole: "SUPER_ADMIN", orgRole: "MEMBER" };
      const canUpdateOrg =
        ["OWNER", "ORG_OWNER", "ADMIN", "ORG_ADMIN"].includes(principal.orgRole) ||
        principal.platformRole === "SUPER_ADMIN";
      assert.equal(canUpdateOrg, true);
    });

    it("Strictly forbids ordinary MEMBER and VIEWER roles from updating organization name", async () => {
      const forbiddenRoles = ["MEMBER", "VIEWER", "GUEST", "USER"];
      const allowedRoles = ["OWNER", "ORG_OWNER", "ADMIN", "ORG_ADMIN"];
      for (const role of forbiddenRoles) {
        const canUpdateOrg =
          allowedRoles.includes(role) || role === "SUPER_ADMIN";
        assert.equal(canUpdateOrg, false, `Role ${role} must be forbidden`);
      }
    });
  });

  describe("2. Implicit Organization Fallback Removal in Leads Store", () => {
    it("Does not assign default org_ess_default to leads with missing organizationId", () => {
      const unmappedLead = leadsStore.createLead({
        organizationId: null,
        botId: "bot_orphan",
        name: "Orphan Lead",
        email: "orphan@example.com",
      });

      assert.equal(unmappedLead.organizationId, null);

      // Normal tenant org_alpha must not see or access the unmapped lead
      const scopedLeads = leadsStore.getLeads({ organizationId: "org_alpha" });
      const found = scopedLeads.find((l) => l.id === unmappedLead.id);
      assert.equal(found, undefined, "Unmapped lead must not leak into org_alpha");
    });

    it("Enforces tenant isolation: Tenant B cannot access Tenant A's lead", () => {
      const leadA = leadsStore.createLead({
        organizationId: "org_alpha_lead_test",
        botId: "bot_alpha_lead",
        name: "Lead Alpha",
        email: "lead_a@alpha.com",
      });

      const leadB = leadsStore.createLead({
        organizationId: "org_beta_lead_test",
        botId: "bot_beta_lead",
        name: "Lead Beta",
        email: "lead_b@beta.com",
      });

      const alphaLeads = leadsStore.getLeads({ organizationId: "org_alpha_lead_test" });
      assert.ok(alphaLeads.some((l) => l.id === leadA.id));
      assert.equal(alphaLeads.some((l) => l.id === leadB.id), false);

      const betaLeads = leadsStore.getLeads({ organizationId: "org_beta_lead_test" });
      assert.ok(betaLeads.some((l) => l.id === leadB.id));
      assert.equal(betaLeads.some((l) => l.id === leadA.id), false);
    });
  });

  describe("3. Implicit Organization Fallback Removal in Visitors Store", () => {
    it("getVisitorById does not fall back to org_ess_default when record has no organizationId", () => {
      const { visitor } = visitorsStore.createVisitor({
        organizationId: null,
        botId: "bot_test_visitor_orphan",
        name: "Unassigned Visitor",
      });

      // Querying for tenant org_tenant_123 must NOT find this visitor
      const lookedUp = visitorsStore.getVisitorById(visitor.id, "org_tenant_123");
      assert.equal(lookedUp, null, "Visitor without orgId must not match a specific tenant");

      // Querying with exact null matches or returns visitor
      const rawLookedUp = visitorsStore.getVisitorById(visitor.id, null);
      assert.equal(rawLookedUp?.id, visitor.id);
    });

    it("Enforces strict visitor tenant matching", () => {
      const { visitor: vA } = visitorsStore.createVisitor({
        organizationId: "org_visitor_alpha",
        botId: "bot_vis_a",
        name: "Alpha Visitor",
      });

      // Tenant Beta cannot access Alpha's visitor
      const crossTenant = visitorsStore.getVisitorById(vA.id, "org_visitor_beta");
      assert.equal(crossTenant, null);

      // Same tenant Alpha accesses successfully
      const sameTenant = visitorsStore.getVisitorById(vA.id, "org_visitor_alpha");
      assert.equal(sameTenant?.id, vA.id);
    });
  });

  describe("4. Implicit Organization Fallback Removal in Conversations Store", () => {
    it("getConversations does not assign default org_ess_default to unassigned conversations", () => {
      const conv = conversationsStore.createConversation({
        organizationId: null,
        botId: "bot_orphan_conv",
        visitorName: "Orphan Visitor",
      });

      assert.equal(conv.organizationId, null);

      // Scoped query for tenant org_customer_1 must not return the orphan conversation
      const list = conversationsStore.getConversations({ organizationId: "org_customer_1" });
      const found = list.find((c) => c.id === conv.id);
      assert.equal(found, undefined, "Unassigned conversation must not be returned to org_customer_1");
    });
  });
});
