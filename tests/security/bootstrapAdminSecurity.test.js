/**
 * tests/security/bootstrapAdminSecurity.test.js
 *
 * Security and Boundary Verification for Admin Bootstrap Tool
 * Verifies:
 * 1. Target environment enforcement (blocks production, requires explicit staging flag).
 * 2. Elevation protection (refuses to elevate ordinary non-admin users to SUPER_ADMIN).
 * 3. Idempotent repeat execution (does not overwrite existing password without explicit flag).
 * 4. Explicit password reset behavior.
 * 5. One-time credential generation.
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { runBootstrap } from "../../scripts/bootstrap_admin.js";
import { queryDb } from "../../frontend/lib/db/dbPool.js";

const TEST_DB_URL = process.env.DATABASE_URL;
const HAS_TEST_DB = Boolean(TEST_DB_URL);

test("Admin Bootstrap Security Hardening Suite", async (t) => {
  await t.test("1. Refuses execution when confirmation flag is omitted", async () => {
    await assert.rejects(
      async () => {
        await runBootstrap({
          confirmStaging: false,
          args: [],
          env: { ALLOW_BOOTSTRAP: "" },
        });
      },
      /BOOTSTRAP_REFUSED.*missing explicit authorization/
    );
  });

  await t.test("2. Refuses execution against production database name", async () => {
    await assert.rejects(
      async () => {
        await runBootstrap({
          confirmStaging: true,
          databaseUrl: "postgresql://postgres:secret@localhost:5432/ess_chatbot?schema=public",
          args: ["--confirm-staging"],
          env: {},
        });
      },
      /BOOTSTRAP_REFUSED.*does not contain 'staging' or 'test'/
    );
  });

  await t.test("3. Refuses execution against unauthorized external host", async () => {
    await assert.rejects(
      async () => {
        await runBootstrap({
          confirmStaging: true,
          databaseUrl: "postgresql://postgres:secret@187.127.131.26:5432/ess_chatbot_staging?schema=public",
          args: ["--confirm-staging"],
          env: {},
        });
      },
      /BOOTSTRAP_REFUSED.*not a recognized local or staging host/
    );
  });

  await t.test("4. Refuses password shorter than 10 characters", async () => {
    await assert.rejects(
      async () => {
        await runBootstrap({
          confirmStaging: true,
          databaseUrl: "postgresql://postgres:secret@localhost:5432/ess_chatbot_staging?schema=public",
          password: "short",
          args: ["--confirm-staging"],
          env: {},
        });
      },
      /BOOTSTRAP_ERROR.*at least 10 characters/
    );
  });

  if (!HAS_TEST_DB) {
    t.diagnostic("No live database configured via DATABASE_URL; skipping live bootstrap DB checks.");
    return;
  }

  // --- Live Database Tests ---
  await t.test("5. Refuses to elevate existing ordinary MEMBER to SUPER_ADMIN", async () => {
    const memberEmail = `member_not_admin_${Date.now()}@example.com`;
    const memberId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // Insert an ordinary MEMBER directly into DB
    await queryDb(
      `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status", "createdAt", "updatedAt")
       VALUES ($1, 'Standard Employee', $2, 'scrypt:dummy:hash', 'MEMBER', 'ACTIVE', NOW(), NOW());`,
      [memberId, memberEmail]
    );

    // Attempting to bootstrap this email must throw and refuse elevation
    await assert.rejects(
      async () => {
        await runBootstrap({
          confirmStaging: true,
          databaseUrl: TEST_DB_URL,
          email: memberEmail,
          args: ["--confirm-staging"],
          env: {},
        });
      },
      /BOOTSTRAP_REFUSED.*exists with role 'MEMBER'.*Automatic privilege escalation.*is prohibited/
    );

    // Verify role is still MEMBER in DB
    const check = await queryDb('SELECT "role" FROM "User" WHERE "id" = $1;', [memberId]);
    assert.equal(check.rows[0].role, "MEMBER", "Role must NOT be escalated");
  });

  await t.test("6. Creates fresh SUPER_ADMIN and logs AuditLog entry", async () => {
    const freshEmail = `superadmin_fresh_${Date.now()}@example.com`;
    const res = await runBootstrap({
      confirmStaging: true,
      databaseUrl: TEST_DB_URL,
      email: freshEmail,
      args: ["--confirm-staging"],
      env: {},
    });

    assert.equal(res.success, true);
    assert.equal(res.action, "USER_CREATED");
    assert.equal(res.isGeneratedPassword, true);
    assert.ok(res.temporaryPassword && res.temporaryPassword.length >= 24);

    // Verify AuditLog entry was recorded
    const auditRes = await queryDb(
      'SELECT "action", "resourceType", "resourceId" FROM "AuditLog" WHERE "action" = $1 AND "resourceId" = $2;',
      ["SUPERADMIN_BOOTSTRAP_CREATED", res.userId]
    );
    assert.equal(auditRes.ok, true);
    assert.equal(auditRes.rows.length, 1, "Must record an audit log event");
  });

  await t.test("7. Repeat execution is idempotent and preserves existing password", async () => {
    const adminEmail = `superadmin_repeat_${Date.now()}@example.com`;
    const originalPassword = "OriginalStrongPassword2026!";

    // First run: create admin
    const firstRes = await runBootstrap({
      confirmStaging: true,
      databaseUrl: TEST_DB_URL,
      email: adminEmail,
      password: originalPassword,
      args: ["--confirm-staging"],
      env: {},
    });
    assert.equal(firstRes.action, "USER_CREATED");

    // Fetch original passwordHash
    const userRow1 = await queryDb('SELECT "passwordHash" FROM "User" WHERE "id" = $1;', [firstRes.userId]);
    const hash1 = userRow1.rows[0].passwordHash;

    // Second run: without --reset-password
    const secondRes = await runBootstrap({
      confirmStaging: true,
      databaseUrl: TEST_DB_URL,
      email: adminEmail,
      password: "DifferentPassword999!",
      args: ["--confirm-staging"],
      env: {},
    });
    assert.equal(secondRes.action, "IDEMPOTENT_VERIFIED");

    // Verify hash was NOT changed
    const userRow2 = await queryDb('SELECT "passwordHash" FROM "User" WHERE "id" = $1;', [firstRes.userId]);
    assert.equal(userRow2.rows[0].passwordHash, hash1, "Password hash must remain unchanged without --reset-password");
  });

  await t.test("8. Password reset requires explicit --reset-password flag", async () => {
    const adminEmail = `superadmin_reset_${Date.now()}@example.com`;
    const initialPass = "InitialPass2026!";
    const newPass = "NewSecurePass2026!";

    const initRes = await runBootstrap({
      confirmStaging: true,
      databaseUrl: TEST_DB_URL,
      email: adminEmail,
      password: initialPass,
      args: ["--confirm-staging"],
      env: {},
    });

    const hash1 = (await queryDb('SELECT "passwordHash" FROM "User" WHERE "id" = $1;', [initRes.userId])).rows[0].passwordHash;

    // Reset run with forceReset
    const resetRes = await runBootstrap({
      confirmStaging: true,
      databaseUrl: TEST_DB_URL,
      email: adminEmail,
      password: newPass,
      forceReset: true,
      args: ["--confirm-staging", "--reset-password"],
      env: {},
    });
    assert.equal(resetRes.action, "PASSWORD_RESET");

    const hash2 = (await queryDb('SELECT "passwordHash" FROM "User" WHERE "id" = $1;', [initRes.userId])).rows[0].passwordHash;
    assert.notEqual(hash1, hash2, "Password hash must be updated on explicit reset");
  });
});
