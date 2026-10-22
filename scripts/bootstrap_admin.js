#!/usr/bin/env node
/**
 * scripts/bootstrap_admin.js
 *
 * Hardened First-Administrator Bootstrap Utility
 * ==============================================
 * Securely provisions or verifies the primary SUPER_ADMIN user and associated
 * organization membership in PostgreSQL without hardcoding credentials in SQL seed files.
 *
 * Strict Security Guardrails:
 * 1. Refuses to execute against production databases or non-staging hosts.
 * 2. Requires explicit authorization flag (ALLOW_BOOTSTRAP=staging/test or --confirm-staging).
 * 3. Never automatically elevates an existing non-admin account (prevents account takeover).
 * 4. Never resets passwords without explicit --reset-password or ADMIN_RESET_PASSWORD=true flag.
 * 5. Never prints or logs environment-supplied secrets.
 * 6. Generates an auditable record in the "AuditLog" table.
 *
 * Usage:
 *   node scripts/bootstrap_admin.js --confirm-staging
 *
 * Environment variables:
 *   ALLOW_BOOTSTRAP       - Must be set to "staging" or "test" (or pass --confirm-staging)
 *   DATABASE_URL          - Target PostgreSQL connection string
 *   ADMIN_EMAIL           - Administrator email (default: admin@emperorsmartsolutions.com)
 *   ADMIN_PASSWORD        - Administrator password (if omitted, a cryptographically secure 24-char secret is generated)
 *   ADMIN_NAME            - Full name for the admin user (default: Emperor Smart Solutions Administrator)
 *   ADMIN_ORG_ID          - Primary organization ID (default: org_ess_default)
 *   ADMIN_RESET_PASSWORD  - Set to "true" or pass --reset-password to explicitly reset an existing admin's password
 */

import crypto from "crypto";
import { createRequire } from "module";
import { hashPassword } from "../frontend/lib/auth/password.js";

const require = createRequire(import.meta.url);
let pg;
try {
  pg = require("pg");
} catch {
  try {
    pg = require("../frontend/node_modules/pg");
  } catch {
    console.error("[BOOTSTRAP_ERROR] 'pg' package is required but could not be resolved.");
    process.exit(1);
  }
}

const { Pool } = pg;

function parseDatabaseTarget(connectionString, fallbackConfig) {
  if (connectionString) {
    try {
      const u = new URL(connectionString);
      return {
        host: u.hostname,
        port: u.port || "5432",
        database: u.pathname.replace(/^\//, "").split("?")[0],
        user: u.username,
      };
    } catch {
      // If URL parsing fails, extract basic tokens
      return {
        host: fallbackConfig.host || "unknown",
        port: fallbackConfig.port || "5432",
        database: fallbackConfig.database || "unknown",
        user: fallbackConfig.user || "unknown",
      };
    }
  }
  return fallbackConfig;
}

export async function runBootstrap(options = {}) {
  const args = options.args || process.argv.slice(2);
  const env = options.env || process.env;

  const email = (options.email || env.ADMIN_EMAIL || "admin@emperorsmartsolutions.com").trim().toLowerCase();
  const name = (options.name || env.ADMIN_NAME || "Emperor Smart Solutions Administrator").trim();
  const orgId = (options.orgId || env.ADMIN_ORG_ID || "org_ess_default").trim();
  const forceReset = options.forceReset || env.ADMIN_RESET_PASSWORD === "true" || args.includes("--reset-password");
  const confirmStaging = options.confirmStaging || env.ALLOW_BOOTSTRAP === "staging" || env.ALLOW_BOOTSTRAP === "test" || args.includes("--confirm-staging") || args.includes("--confirm-test");

  // --- GUARD 1: Require Explicit Authorization ---
  if (!confirmStaging) {
    throw new Error(
      "[BOOTSTRAP_REFUSED] Execution refused: missing explicit authorization. " +
      "You must provide ALLOW_BOOTSTRAP=staging or pass --confirm-staging to acknowledge this is a staging/test environment."
    );
  }

  // Determine DB target configuration
  const poolConfig = {
    connectionTimeoutMillis: 5000,
  };

  const rawUrl = options.databaseUrl || env.DATABASE_URL;
  let target;

  if (rawUrl) {
    poolConfig.connectionString = rawUrl;
    target = parseDatabaseTarget(rawUrl, {});
  } else {
    target = {
      host: env.POSTGRES_HOST || "127.0.0.1",
      port: parseInt(env.POSTGRES_PORT || "5432", 10),
      database: env.POSTGRES_DB || "ess_chatbot_staging",
      user: env.POSTGRES_USER || "postgres",
    };
    poolConfig.host = target.host;
    poolConfig.port = target.port;
    poolConfig.database = target.database;
    poolConfig.user = target.user;
    poolConfig.password = env.POSTGRES_PASSWORD || "postgres";
  }

  // --- GUARD 2: Production Target Blockers ---
  const hostLower = String(target.host || "").toLowerCase();
  const dbLower = String(target.database || "").toLowerCase();

  // Known production indicator checks
  const isAuthorizedLocalOrStagingHost =
    hostLower === "localhost" ||
    hostLower === "127.0.0.1" ||
    hostLower === "::1" ||
    hostLower === "postgres" ||
    hostLower === "ess-postgres-staging" ||
    hostLower.includes("staging") ||
    hostLower.includes("test");

  if (!isAuthorizedLocalOrStagingHost && !options.allowExternalHost) {
    throw new Error(
      `[BOOTSTRAP_REFUSED] Target host '${target.host}' is not a recognized local or staging host. ` +
      "Connecting to production infrastructure via bootstrap utility is strictly forbidden."
    );
  }

  // Prohibit unadorned production database name
  const isStagingOrTestDb = dbLower.includes("staging") || dbLower.includes("test") || options.allowNonStagingDbName;
  if (!isStagingOrTestDb) {
    throw new Error(
      `[BOOTSTRAP_REFUSED] Target database '${target.database}' does not contain 'staging' or 'test'. ` +
      "Bootstrap script will not run against unverified database names to prevent accidental production overwrite."
    );
  }

  // Password resolution
  let password = options.password || env.ADMIN_PASSWORD;
  let isGeneratedPassword = false;

  if (!password) {
    password = crypto.randomBytes(18).toString("base64url");
    isGeneratedPassword = true;
  } else if (password.length < 10) {
    throw new Error("[BOOTSTRAP_ERROR] ADMIN_PASSWORD must be at least 10 characters long.");
  }

  const pool = new Pool(poolConfig);

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      // 1. Verify or create primary Organization
      const orgCheck = await client.query('SELECT "id" FROM "Organization" WHERE "id" = $1;', [orgId]);
      if (orgCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO "Organization" ("id", "name", "slug", "plan", "status", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, 'Enterprise', 'ACTIVE', NOW(), NOW())
           ON CONFLICT ("id") DO NOTHING;`,
          [orgId, "Emperor Smart Solutions", "org-ess-default"]
        );
      }

      // 2. Check if admin user exists
      const userCheck = await client.query(
        'SELECT "id", "email", "role", "status", "passwordHash" FROM "User" WHERE "email" = $1;',
        [email]
      );

      let userId;
      let actionOutcome = "NO_CHANGE";

      if (userCheck.rows.length > 0) {
        const existing = userCheck.rows[0];
        userId = existing.id;

        // --- GUARD 3: Refuse Automatic Privilege Elevation ---
        if (existing.role !== "SUPER_ADMIN") {
          throw new Error(
            `[BOOTSTRAP_REFUSED] Account '${email}' exists with role '${existing.role}'. ` +
            "Automatic privilege escalation of existing standard accounts to SUPER_ADMIN is prohibited to prevent account takeover. " +
            "A separate administrative migration or manual elevated action is required."
          );
        }

        // Existing SUPER_ADMIN
        if (forceReset) {
          const newHash = await hashPassword(password);
          await client.query(
            'UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE "id" = $2;',
            [newHash, userId]
          );
          actionOutcome = "PASSWORD_RESET";

          // Log auditable event
          await client.query(
            `INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "resourceType", "resourceId", "metadata", "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
            [
              `audit_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
              orgId,
              userId,
              "ADMIN_PASSWORD_RESET",
              "User",
              userId,
              JSON.stringify({ email, method: "bootstrap_cli", forceReset: true })
            ]
          );
        } else {
          actionOutcome = "IDEMPOTENT_VERIFIED";
        }
      } else {
        // Create new SUPER_ADMIN user
        userId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        const passwordHash = await hashPassword(password);

        await client.query(
          `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', 'ACTIVE', NOW(), NOW());`,
          [userId, name, email, passwordHash]
        );
        actionOutcome = "USER_CREATED";

        // Log auditable event
        await client.query(
          `INSERT INTO "AuditLog" ("id", "organizationId", "userId", "action", "resourceType", "resourceId", "metadata", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
          [
            `audit_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
            orgId,
            userId,
            "SUPERADMIN_BOOTSTRAP_CREATED",
            "User",
            userId,
            JSON.stringify({ email, role: "SUPER_ADMIN", method: "bootstrap_cli" })
          ]
        );
      }

      // 3. Ensure OrganizationMembership
      const memCheck = await client.query(
        'SELECT "id", "role" FROM "OrganizationMembership" WHERE "organizationId" = $1 AND "userId" = $2;',
        [orgId, userId]
      );

      if (memCheck.rows.length === 0) {
        const memId = `mem_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        await client.query(
          `INSERT INTO "OrganizationMembership" ("id", "organizationId", "userId", "role", "status", "createdAt")
           VALUES ($1, $2, $3, 'SUPER_ADMIN', 'ACTIVE', NOW())
           ON CONFLICT ("organizationId", "userId") DO NOTHING;`,
          [memId, orgId, userId]
        );
      } else if (memCheck.rows[0].role !== "SUPER_ADMIN") {
        await client.query(
          'UPDATE "OrganizationMembership" SET "role" = \'SUPER_ADMIN\' WHERE "id" = $1;',
          [memCheck.rows[0].id]
        );
      }

      await client.query("COMMIT;");

      return {
        success: true,
        action: actionOutcome,
        email,
        userId,
        orgId,
        isGeneratedPassword,
        temporaryPassword: (isGeneratedPassword && (actionOutcome === "USER_CREATED" || actionOutcome === "PASSWORD_RESET")) ? password : null,
      };
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// CLI execution wrapper
if (process.argv[1] && process.argv[1].endsWith("bootstrap_admin.js")) {
  runBootstrap()
    .then((result) => {
      console.log("\n=======================================================");
      console.log("       BOOTSTRAP SUCCESSFUL - SUMMARY");
      console.log("=======================================================");
      console.log(`Action      : ${result.action}`);
      console.log(`Admin Email : ${result.email}`);
      console.log(`User ID     : ${result.userId}`);
      console.log(`Role        : SUPER_ADMIN`);
      console.log(`Organization: ${result.orgId}`);
      if (result.temporaryPassword) {
        console.log(`One-Time Password: ${result.temporaryPassword}`);
        console.log("IMPORTANT: Save this credential immediately. It will NOT be logged or displayed again.");
      } else if (result.action === "PASSWORD_RESET") {
        console.log(`Password    : [Custom secret updated via environment]`);
      } else if (result.action === "IDEMPOTENT_VERIFIED") {
        console.log(`Password    : [Unchanged - pass --reset-password to update]`);
      } else {
        console.log(`Password    : [Custom secret provided via environment]`);
      }
      console.log("=======================================================\n");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exit(1);
    });
}
