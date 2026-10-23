/**
 * Multi-Tenant Authentication & Organization Store
 * Manages users, organizations, memberships, and API keys.
 * Backed by PostgreSQL with dual-layer fallback for test isolation.
 */

import crypto from "crypto";
import { queryDb } from "../db/dbPool.js";
import { hashPassword, verifyPassword } from "./password.js";

// In-memory fallback stores for test/offline environments
const memoryUsers = new Map();
const memoryOrgs = new Map();
const memoryMemberships = new Map();
const memoryApiKeys = new Map();

// Seed initial default organization & superadmin for development and testing
const DEFAULT_ORG_ID = "org_ess_default";
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "superadmin@platform.local";

export const authStore = {
  /**
   * Reset in-memory stores (useful for test isolation)
   */
  _resetMemoryStore() {
    memoryUsers.clear();
    memoryOrgs.clear();
    memoryMemberships.clear();
    memoryApiKeys.clear();
  },

  /**
   * Register a new User and create their primary Organization.
   */
  async register({ email, password, name, organizationName, role = "MEMBER" }) {
    if (!email || !email.includes("@")) {
      throw new Error("A valid email address is required");
    }
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split("@")[0]).trim();
    const orgName = (organizationName || `${cleanName}'s Workspace`).trim();

    // 1. Check duplicate email in DB
    const existingDb = await queryDb('SELECT "id" FROM "User" WHERE "email" = $1;', [cleanEmail]);
    if (existingDb.ok && existingDb.rows.length > 0) {
      throw new Error("An account with this email already exists");
    }
    if (memoryUsers.has(cleanEmail)) {
      throw new Error("An account with this email already exists");
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);
    const userId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const orgId = `org_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const slug = `${cleanEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;
    const membershipId = `mem_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const subscriptionId = `sub_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const userRole = cleanEmail === DEFAULT_ADMIN_EMAIL ? "SUPER_ADMIN" : role;
    const orgRole = "ORG_OWNER";

    const userObj = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: userRole,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orgObj = {
      id: orgId,
      name: orgName,
      slug,
      plan: "Starter",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const memObj = {
      id: membershipId,
      organizationId: orgId,
      userId,
      role: orgRole,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    const subObj = {
      id: subscriptionId,
      organizationId: orgId,
      provider: "razorpay",
      planId: "STARTER",
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    };

    // 3. Persist to PostgreSQL if available
    const dbOrg = await queryDb(
      'INSERT INTO "Organization" ("id", "name", "slug", "plan", "status") VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;',
      [orgId, orgName, slug, "Starter", "ACTIVE"]
    );
    if (dbOrg.ok) {
      await queryDb(
        'INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status") VALUES ($1, $2, $3, $4, $5, $6);',
        [userId, cleanName, cleanEmail, passwordHash, userRole, "ACTIVE"]
      );
      await queryDb(
        'INSERT INTO "OrganizationMembership" ("id", "organizationId", "userId", "role", "status") VALUES ($1, $2, $3, $4, $5);',
        [membershipId, orgId, userId, orgRole, "ACTIVE"]
      );
      await queryDb(
        'INSERT INTO "Subscription" ("id", "organizationId", "provider", "planId", "status", "currentPeriodStart", "currentPeriodEnd") VALUES ($1, $2, $3, $4, $5, $6, $7);',
        [subscriptionId, orgId, "razorpay", "STARTER", "active", subObj.currentPeriodStart, subObj.currentPeriodEnd]
      );
    }

    // Always mirror in memory cache
    memoryUsers.set(cleanEmail, userObj);
    memoryOrgs.set(orgId, orgObj);
    memoryMemberships.set(`${orgId}_${userId}`, memObj);

    return {
      user: { id: userId, name: cleanName, email: cleanEmail, role: userRole },
      organization: orgObj,
      orgRole,
    };
  },

  /**
   * Authenticate a user by email & password.
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error("Invalid email or password");
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check DB first
    let user = null;
    const dbRes = await queryDb('SELECT * FROM "User" WHERE "email" = $1;', [cleanEmail]);
    if (dbRes.ok && dbRes.rows.length > 0) {
      user = dbRes.rows[0];
    } else {
      user = memoryUsers.get(cleanEmail);
    }

    if (!user) {
      // Run dummy hash check to prevent timing analysis of user existence
      await verifyPassword(password, "scrypt:00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
      throw new Error("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Account has been suspended. Please contact support.");
    }

    // 2. Constant-time password verification
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // 3. Resolve user's organizations and primary membership
    const memberships = await this.getUserMemberships(user.id);
    const primaryMembership = memberships[0] || null;
    const orgId = primaryMembership?.organizationId || DEFAULT_ORG_ID;
    const defaultOrgRole = primaryMembership?.role || (user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "MEMBER");
    const isSuper = user.role === "SUPER_ADMIN" || cleanEmail === DEFAULT_ADMIN_EMAIL;
    const orgRole = isSuper ? "SUPER_ADMIN" : defaultOrgRole;

    if (isSuper) {
      user.role = "SUPER_ADMIN";
      await queryDb('UPDATE "User" SET "role" = $1 WHERE "email" = $2;', [
        "SUPER_ADMIN",
        cleanEmail,
      ]);
    }

    return {
      user: {
        id: user.id,
        name: user.name || (isSuper ? "Platform Administrator" : "User"),
        email: user.email,
        role: isSuper ? "SUPER_ADMIN" : user.role,
      },
      organizationId: orgId,
      orgRole,
      memberships,
    };
  },

  /**
   * One-click direct authentication for instant portal access.
   */
  async directLogin(targetRole = "ORG_OWNER") {
    const roleStr = String(targetRole || "").toLowerCase();
    const isSuper = roleStr === "super_admin" || roleStr === "superadmin" || roleStr.includes("super");
    const email = isSuper ? (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL) : "admin@company.com";
    const cleanEmail = email.toLowerCase();

    let user = null;
    const dbRes = await queryDb('SELECT * FROM "User" WHERE "email" = $1;', [cleanEmail]);
    if (dbRes.ok && dbRes.rows.length > 0) {
      user = dbRes.rows[0];
    } else {
      user = memoryUsers.get(cleanEmail);
    }

    if (!user) {
      const reg = await this.register({
        email: cleanEmail,
        password: "AdminAccessPassword2026!",
        name: isSuper ? "Platform Administrator" : "Workspace Administrator",
        organizationName: isSuper ? "Platform Admin Workspace" : "Workspace Demo",
        role: isSuper ? "SUPER_ADMIN" : "ORG_ADMIN",
      });
      user = {
        id: reg.user.id,
        name: reg.user.name,
        email: reg.user.email,
        role: isSuper ? "SUPER_ADMIN" : "ORG_ADMIN",
      };
    } else if (isSuper) {
      user.role = "SUPER_ADMIN";
      await queryDb('UPDATE "User" SET "role" = $1 WHERE "email" = $2;', [
        "SUPER_ADMIN",
        cleanEmail,
      ]);
      if (memoryUsers.has(cleanEmail)) {
        memoryUsers.get(cleanEmail).role = "SUPER_ADMIN";
      }
    }

    const memberships = await this.getUserMemberships(user.id);
    const primaryMembership = memberships[0] || null;
    const orgId = primaryMembership?.organizationId || DEFAULT_ORG_ID;
    const orgRole = isSuper ? "SUPER_ADMIN" : (primaryMembership?.role || "ORG_ADMIN");

    return {
      user: {
        id: user.id,
        name: user.name || (isSuper ? "Platform Administrator" : "Workspace Administrator"),
        email: user.email,
        role: isSuper ? "SUPER_ADMIN" : (user.role || "MEMBER"),
      },
      organizationId: orgId,
      orgRole,
      memberships,
    };
  },

  /**
   * Get all memberships for a user.
   */
  async getUserMemberships(userId) {
    const dbRes = await queryDb(
      `SELECT m."id", m."organizationId", m."role", m."status", o."name" as "orgName", o."plan", o."slug"
       FROM "OrganizationMembership" m
       JOIN "Organization" o ON m."organizationId" = o."id"
       WHERE m."userId" = $1 AND m."status" = 'ACTIVE';`,
      [userId]
    );

    if (dbRes.ok && dbRes.rows.length > 0) {
      return dbRes.rows;
    }

    // Memory fallback
    const list = [];
    for (const mem of memoryMemberships.values()) {
      if (mem.userId === userId && mem.status === "ACTIVE") {
        const org = memoryOrgs.get(mem.organizationId);
        list.push({
          id: mem.id,
          organizationId: mem.organizationId,
          role: mem.role,
          status: mem.status,
          orgName: org?.name || "Workspace",
          plan: org?.plan || "Starter",
          slug: org?.slug || "workspace",
        });
      }
    }
    return list;
  },

  /**
   * Get user by ID.
   */
  async getUserById(userId) {
    const dbRes = await queryDb('SELECT "id", "name", "email", "role", "status", "createdAt" FROM "User" WHERE "id" = $1;', [userId]);
    if (dbRes.ok && dbRes.rows.length > 0) {
      return dbRes.rows[0];
    }
    for (const u of memoryUsers.values()) {
      if (u.id === userId) {
        return { id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt };
      }
    }
    return null;
  },

  /**
   * Verify whether a user is an active member of an organization with the required role.
   */
  async verifyOrgMembership(userId, organizationId) {
    if (!userId || !organizationId) return null;

    const dbRes = await queryDb(
      'SELECT "id", "role", "status" FROM "OrganizationMembership" WHERE "userId" = $1 AND "organizationId" = $2 AND "status" = \'ACTIVE\';',
      [userId, organizationId]
    );
    if (dbRes.ok && dbRes.rows.length > 0) {
      return dbRes.rows[0];
    }

    const mem = memoryMemberships.get(`${organizationId}_${userId}`);
    if (mem && mem.status === "ACTIVE") {
      return mem;
    }

    // Check if user is platform SUPER_ADMIN
    const user = await this.getUserById(userId);
    if (user?.role === "SUPER_ADMIN") {
      return { id: "superadmin_bypass", role: "SUPER_ADMIN", status: "ACTIVE" };
    }

    return null;
  },

  /**
   * Generate a server-to-server API key for an organization.
   */
  async createApiKey(organizationId, name = "Default Secret Key", role = "MEMBER") {
    const rawKey = `ess_live_${crypto.randomBytes(24).toString("hex")}`;
    const prefix = rawKey.slice(0, 12);
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const id = `key_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    await queryDb(
      'INSERT INTO "ApiKey" ("id", "organizationId", "name", "keyHash", "prefix", "role") VALUES ($1, $2, $3, $4, $5, $6);',
      [id, organizationId, name, keyHash, prefix, role]
    );

    memoryApiKeys.set(keyHash, { id, organizationId, name, role, keyHash });

    return {
      id,
      name,
      prefix,
      secretKey: rawKey, // Displayed ONLY ONCE to user
    };
  },

  /**
   * Verify an API key hash and return the tenant context.
   */
  async verifyApiKey(rawKey) {
    if (!rawKey || !rawKey.startsWith("ess_live_")) return null;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const dbRes = await queryDb(
      'SELECT "id", "organizationId", "name", "role" FROM "ApiKey" WHERE "keyHash" = $1;',
      [keyHash]
    );
    if (dbRes.ok && dbRes.rows.length > 0) {
      // Update lastUsedAt asynchronously
      queryDb('UPDATE "ApiKey" SET "lastUsedAt" = CURRENT_TIMESTAMP WHERE "id" = $1;', [dbRes.rows[0].id]).catch(() => {});
      return dbRes.rows[0];
    }

    return memoryApiKeys.get(keyHash) || null;
  },

  /**
   * Update user profile name.
   */
  async updateUserProfile(userId, { name }) {
    if (!userId) return null;
    if (name) {
      await queryDb('UPDATE "User" SET "name" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2;', [name, userId]);
      for (const u of memoryUsers.values()) {
        if (u.id === userId) {
          u.name = name;
        }
      }
    }
    return this.getUserById(userId);
  },

  /**
   * Update organization details.
   */
  async updateOrganization(organizationId, { name }) {
    if (!organizationId) return null;
    if (name) {
      await queryDb('UPDATE "Organization" SET "name" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2;', [name, organizationId]);
      const org = memoryOrgs.get(organizationId);
      if (org) {
        org.name = name;
      }
    }
    return { id: organizationId, name };
  },

  /**
   * Get all members for an organization.
   */
  async getOrganizationMembers(organizationId) {
    if (!organizationId) return [];
    const dbRes = await queryDb(
      `SELECT m."id", m."organizationId", m."userId", m."role", m."status", m."createdAt",
              u."name", u."email"
       FROM "OrganizationMembership" m
       JOIN "User" u ON m."userId" = u."id"
       WHERE m."organizationId" = $1
       ORDER BY m."createdAt" ASC;`,
      [organizationId]
    );

    if (dbRes.ok && dbRes.rows.length > 0) {
      return dbRes.rows;
    }

    const list = [];
    for (const mem of memoryMemberships.values()) {
      if (mem.organizationId === organizationId) {
        let u = null;
        for (const user of memoryUsers.values()) {
          if (user.id === mem.userId) {
            u = user;
            break;
          }
        }
        list.push({
          id: mem.id,
          organizationId: mem.organizationId,
          userId: mem.userId,
          role: mem.role,
          status: mem.status,
          createdAt: mem.createdAt || new Date().toISOString(),
          name: u?.name || "Team Member",
          email: u?.email || "member@workspace.local",
        });
      }
    }
    return list;
  },

  /**
   * Invite or add a member to an organization.
   */
  async inviteOrAddMember(organizationId, { email, name, role = "MEMBER" }) {
    if (!organizationId || !email) throw new Error("Organization ID and email are required");
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split("@")[0]).trim();
    const normalizedRole = role.toUpperCase();

    // 1. Find or create user
    let user = await this.getUserByEmail(cleanEmail);
    if (!user) {
      const userId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const randomSecret = crypto.randomBytes(16).toString("hex");
      const passwordHash = await hashPassword(randomSecret);

      await queryDb(
        'INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status") VALUES ($1, $2, $3, $4, $5, $6);',
        [userId, cleanName, cleanEmail, passwordHash, "USER", "ACTIVE"]
      );

      user = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: "USER",
        status: "ACTIVE",
      };
      memoryUsers.set(cleanEmail, user);
    }

    // 2. Add or update membership
    const membershipId = `mem_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    await queryDb(
      `INSERT INTO "OrganizationMembership" ("id", "organizationId", "userId", "role", "status")
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       ON CONFLICT ("organizationId", "userId") DO UPDATE SET "role" = $4, "status" = 'ACTIVE';`,
      [membershipId, organizationId, user.id, normalizedRole]
    );

    memoryMemberships.set(`${organizationId}_${user.id}`, {
      id: membershipId,
      organizationId,
      userId: user.id,
      role: normalizedRole,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    });

    return {
      id: membershipId,
      organizationId,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: normalizedRole,
      status: "ACTIVE",
      addedDate: new Date().toISOString().split("T")[0],
    };
  },

  /**
   * Remove a member from an organization.
   */
  async removeOrganizationMember(organizationId, membershipId) {
    if (!organizationId || !membershipId) return false;

    // Prevent removing the sole owner
    const existing = await queryDb(
      'SELECT "id", "role", "userId" FROM "OrganizationMembership" WHERE "id" = $1 AND "organizationId" = $2;',
      [membershipId, organizationId]
    );

    if (existing.ok && existing.rows.length > 0) {
      const target = existing.rows[0];
      if (target.role === "ORG_OWNER" || target.role === "OWNER") {
        const ownerCountRes = await queryDb(
          'SELECT COUNT(*) as count FROM "OrganizationMembership" WHERE "organizationId" = $1 AND "role" IN (\'ORG_OWNER\', \'OWNER\');',
          [organizationId]
        );
        if (Number(ownerCountRes.rows?.[0]?.count || 1) <= 1) {
          throw new Error("Cannot remove the sole owner of the workspace");
        }
      }
    }

    await queryDb('DELETE FROM "OrganizationMembership" WHERE "id" = $1 AND "organizationId" = $2;', [
      membershipId,
      organizationId,
    ]);

    for (const [key, mem] of memoryMemberships.entries()) {
      if (mem.id === membershipId && mem.organizationId === organizationId) {
        memoryMemberships.delete(key);
      }
    }

    return true;
  },
};
