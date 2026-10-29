import test from "node:test";
import assert from "node:assert/strict";
import { authStore } from "../../frontend/lib/db/authStore.js";
import { verifySessionToken } from "../../frontend/lib/auth/session.js";

test("Google OAuth & Account Chooser Suite", async (t) => {
  await t.test("1. listSystemAccounts returns active platform accounts without dummy data", async () => {
    const accounts = await authStore.listSystemAccounts();
    assert.ok(Array.isArray(accounts), "Accounts must be an array");

    // Ensure dummy placeholder accounts are never injected
    const dummyCheck = accounts.some(
      (a) => a.email.toLowerCase() === "admin@company.com" || a.email.toLowerCase() === "admin@emperorsmartsolutions.com"
    );
    assert.equal(dummyCheck, false, "Must not contain dummy placeholder accounts");
  });

  await t.test("2. loginWithOAuth logs in existing account and preserves role", async () => {
    const result = await authStore.loginWithOAuth({
      email: "admin@emperorsmartsolutions.com",
      name: "Emperor Smart Solution",
      provider: "google",
    });

    assert.equal(result.user.email, "admin@emperorsmartsolutions.com");
    assert.equal(result.user.role, "SUPER_ADMIN");
    assert.equal(result.orgRole, "SUPER_ADMIN");
  });

  await t.test("3. loginWithOAuth auto-registers new Google user with dedicated workspace", async () => {
    const testEmail = `new.google.user.${Date.now()}@gmail.com`;
    const result = await authStore.loginWithOAuth({
      email: testEmail,
      name: "Sarah Parker",
      provider: "google",
    });

    assert.equal(result.user.email, testEmail);
    assert.equal(result.user.name, "Sarah Parker");
    assert.equal(result.orgRole, "ORG_OWNER");
    assert.ok(result.organizationId, "Organization ID must be created");
  });

  await t.test("4. Re-login with previously created Google user reuses their workspace", async () => {
    const testEmail = `returning.google.${Date.now()}@gmail.com`;
    const firstLogin = await authStore.loginWithOAuth({
      email: testEmail,
      name: "Alex Doe",
      provider: "google",
    });

    const secondLogin = await authStore.loginWithOAuth({
      email: testEmail,
      name: "Alex Doe",
      provider: "google",
    });

    assert.equal(firstLogin.user.id, secondLogin.user.id);
    assert.equal(firstLogin.organizationId, secondLogin.organizationId);
  });
});
