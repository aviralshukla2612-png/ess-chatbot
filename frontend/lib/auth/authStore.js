/**
 * Multi-Tenant Authentication & Organization Store
 * Manages users, organizations, memberships, and API keys.
 * Backed by PostgreSQL with dual-layer fallback for test isolation.
 */

import crypto from "crypto";
import { queryDb } from "../db/dbPool.js";
import { hashPassword, verifyPassword } from "./password.js";
import { usersStore, isDummyOrTestAccount } from "../db/usersStore.js";
import { sseBroker } from "../db/sseBroker.js";
import { otpStore } from "./otpStore.js";

// In-memory fallback stores for test/offline environments
const memoryUsers = new Map();
const memoryOrgs = new Map();
const memoryMemberships = new Map();
const memoryApiKeys = new Map();

// Seed initial default organization & superadmin for development and testing
const DEFAULT_ORG_ID = "org_ess_default";
const DEFAULT_ADMIN_EMAIL = "admin@emperorsmartsolutions.com";

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
  async register({ email, password, name, organizationName, role = "MEMBER", phone, phoneVerified = false }) {
    const cleanPhone = phone ? otpStore.normalizePhone(phone) : null;
    if (!cleanPhone && (!email || !email.includes("@"))) {
      throw new Error("A valid mobile number is required");
    }

    const cleanDigits = cleanPhone ? cleanPhone.replace(/\D/g, "") : Date.now().toString();
    const cleanEmail = email && email.includes("@")
      ? email.trim().toLowerCase()
      : `${cleanDigits}@phone.emperornexus.com`;

    const cleanName = (name || (cleanPhone ? `User ${cleanDigits.slice(-4)}` : cleanEmail.split("@")[0])).trim();
    const orgName = (organizationName || `${cleanName}'s Workspace`).trim();

    // 1. Check duplicate email in DB if email explicitly provided
    if (email) {
      const existingDb = await queryDb('SELECT "id" FROM "User" WHERE "email" = $1;', [cleanEmail]);
      if (existingDb.ok && existingDb.rows.length > 0) {
        throw new Error("An account with this email already exists");
      }
      if (memoryUsers.has(cleanEmail)) {
        throw new Error("An account with this email already exists");
      }
    }

    // Check duplicate phone if provided
    if (cleanPhone) {
      const existingPhone = await queryDb('SELECT "id" FROM "User" WHERE "phone" = $1;', [cleanPhone]);
      if (existingPhone.ok && existingPhone.rows.length > 0) {
        throw new Error("An account with this mobile number already exists");
      }
      for (const u of memoryUsers.values()) {
        if (u.phone === cleanPhone) {
          throw new Error("An account with this mobile number already exists");
        }
      }
    }

    // 2. Hash password (or generate random secure hash if phone-only registration)
    const passwordHash = password && password.length >= 6
      ? await hashPassword(password)
      : await hashPassword(crypto.randomBytes(32).toString("hex"));
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
      phone: cleanPhone,
      phoneVerified: Boolean(phoneVerified),
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
      status: "pending_autopay",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    // 3. Persist to PostgreSQL if available
    const dbOrg = await queryDb(
      'INSERT INTO "Organization" ("id", "name", "slug", "plan", "status") VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING;',
      [orgId, orgName, slug, "Starter (Trial Pending)", "ACTIVE"]
    );
    if (dbOrg.ok) {
      await queryDb(
        'INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status", "phone", "phoneVerified") VALUES ($1, $2, $3, $4, $5, $6, $7, $8);',
        [userId, cleanName, cleanEmail, passwordHash, userRole, "ACTIVE", cleanPhone, Boolean(phoneVerified)]
      );
      await queryDb(
        'INSERT INTO "OrganizationMembership" ("id", "organizationId", "userId", "role", "status") VALUES ($1, $2, $3, $4, $5);',
        [membershipId, orgId, userId, orgRole, "ACTIVE"]
      );
      await queryDb(
        'INSERT INTO "Subscription" ("id", "organizationId", "provider", "planId", "status", "currentPeriodStart", "currentPeriodEnd") VALUES ($1, $2, $3, $4, $5, $6, $7);',
        [subscriptionId, orgId, "razorpay", "STARTER", "pending_autopay", subObj.currentPeriodStart, subObj.currentPeriodEnd]
      );
    }

    // Always mirror in memory and disk cache
    memoryUsers.set(cleanEmail, userObj);
    memoryOrgs.set(orgId, orgObj);
    memoryMemberships.set(`${orgId}_${userId}`, memObj);

    try {
      usersStore.upsertUser({
        id: userId,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        organization: orgName,
        role: userRole === "SUPER_ADMIN" ? "Platform Super Admin" : "Workspace Owner",
        status: "Active",
      });
      sseBroker.broadcast("USER_CREATED", {
        user: { id: userId, name: cleanName, email: cleanEmail, phone: cleanPhone, role: userRole },
        organizationId: orgId,
      });
    } catch (e) { }

    return {
      user: { id: userId, name: cleanName, email: cleanEmail, phone: cleanPhone, role: userRole },
      organization: orgObj,
      orgRole,
    };
  },

  /**
   * Authenticate user by verified mobile phone number.
   */
  async loginWithPhone({ phone }) {
    if (!phone) {
      throw new Error("Mobile number is required");
    }
    const cleanPhone = otpStore.normalizePhone(phone);
    if (!cleanPhone) {
      throw new Error("Invalid mobile number");
    }

    let user = null;
    const dbRes = await queryDb('SELECT * FROM "User" WHERE "phone" = $1;', [cleanPhone]);
    if (dbRes.ok && dbRes.rows.length > 0) {
      user = dbRes.rows[0];
    } else {
      for (const u of memoryUsers.values()) {
        if (u.phone === cleanPhone) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      return {
        userFound: false,
        phone: cleanPhone,
      };
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Account has been suspended. Please contact support.");
    }

    const memberships = await this.getUserMemberships(user.id);
    const primaryMembership = memberships[0] || null;
    const orgId = primaryMembership?.organizationId || DEFAULT_ORG_ID;
    const defaultOrgRole = primaryMembership?.role || (user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "MEMBER");
    const isSuper = user.role === "SUPER_ADMIN" || user.email === DEFAULT_ADMIN_EMAIL;
    const orgRole = isSuper ? "SUPER_ADMIN" : defaultOrgRole;

    return {
      userFound: true,
      user: {
        id: user.id,
        name: isSuper ? "Emperor Smart Solution" : user.name,
        email: user.email,
        phone: user.phone,
        role: isSuper ? "SUPER_ADMIN" : user.role,
      },
      organizationId: orgId,
      orgRole,
      memberships,
    };
  },

  /**
   * Check if an account already exists with the given mobile phone number.
   * Checks PostgreSQL database, in-memory cache, and disk user store.
   */
  async checkPhoneExists(phone) {
    if (!phone) return false;
    const cleanPhone = otpStore.normalizePhone(phone);
    const rawDigits = String(phone).replace(/\D/g, "");
    const digits10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
    if (!digits10 || digits10.length < 10) return false;

    const digits12 = `91${digits10}`;
    const plusDigits = `+91${digits10}`;
    const generatedEmail = `${digits10}@phone.emperornexus.com`;
    const phoneVariants = [cleanPhone, digits10, digits12, plusDigits].filter(Boolean);

    // 1. Check PostgreSQL DB
    try {
      const dbRes = await queryDb(
        'SELECT "id", "phone", "email" FROM "User" WHERE "phone" = $1 OR "phone" = $2 OR "phone" = $3 OR "email" = $4 LIMIT 1;',
        [plusDigits, digits10, digits12, generatedEmail]
      );
      if (dbRes.ok && dbRes.rows && dbRes.rows.length > 0) {
        return true;
      }
    } catch (e) {
      console.warn("[AUTH_CHECK_PHONE_DB_WARN]", e.message);
    }

    // 2. Check in-memory store
    for (const u of memoryUsers.values()) {
      if (!u) continue;
      const uPhoneDigits = String(u.phone || "").replace(/\D/g, "");
      if (
        phoneVariants.includes(u.phone) ||
        (uPhoneDigits && uPhoneDigits.endsWith(digits10)) ||
        u.email === generatedEmail
      ) {
        return true;
      }
    }

    // 3. Check usersStore (JSON disk storage fallback)
    try {
      const allUsers = usersStore.getUsers ? usersStore.getUsers() : [];
      const found = allUsers.some((u) => {
        if (!u) return false;
        const uPhoneDigits = String(u.phone || "").replace(/\D/g, "");
        return (
          phoneVariants.includes(u.phone) ||
          (uPhoneDigits && uPhoneDigits.endsWith(digits10)) ||
          u.email === generatedEmail
        );
      });
      if (found) return true;
    } catch (e) { }

    return false;
  },

  /**
   * Authenticate a user by mobile phone & password.
   */
  async loginWithPhoneAndPassword({ phone, password }) {
    if (!phone || !password) {
      throw new Error("Mobile number and password are required");
    }
    const cleanPhone = otpStore.normalizePhone(phone);
    if (!cleanPhone) {
      throw new Error("Invalid mobile number");
    }

    let user = null;
    const dbRes = await queryDb('SELECT * FROM "User" WHERE "phone" = $1;', [cleanPhone]);
    if (dbRes.ok && dbRes.rows.length > 0) {
      user = dbRes.rows[0];
    } else {
      for (const u of memoryUsers.values()) {
        if (u.phone === cleanPhone) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      // Run dummy scrypt hash check to prevent timing analysis of user existence (SEC-03-C)
      await verifyPassword(
        password,
        "scrypt:00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      );
      throw new Error("Invalid mobile number or password");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Account has been suspended. Please contact support.");
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid mobile number or password");
    }

    const memberships = await this.getUserMemberships(user.id);
    const primaryMembership = memberships[0] || null;
    const orgId = primaryMembership?.organizationId || DEFAULT_ORG_ID;
    const defaultOrgRole = primaryMembership?.role || (user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "MEMBER");
    const isSuper = user.role === "SUPER_ADMIN" || user.email === DEFAULT_ADMIN_EMAIL;
    const orgRole = isSuper ? "SUPER_ADMIN" : defaultOrgRole;

    return {
      userFound: true,
      user: {
        id: user.id,
        name: isSuper ? "Emperor Smart Solution" : user.name,
        email: user.email,
        phone: user.phone,
        role: isSuper ? "SUPER_ADMIN" : user.role,
      },
      organizationId: orgId,
      orgRole,
      memberships,
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
      await verifyPassword(
        password,
        "scrypt:00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      );
      throw new Error("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Account has been suspended. Please contact support.");
    }

    // 2. Constant-time password verification (no hardcoded backdoor passwords)
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
      user.name = "Emperor Smart Solution";
      user.role = "SUPER_ADMIN";
      await queryDb('UPDATE "User" SET "name" = $1, "role" = $2 WHERE "email" = $3;', [
        "Emperor Smart Solution",
        "SUPER_ADMIN",
        cleanEmail,
      ]);
    }

    return {
      user: {
        id: user.id,
        name: isSuper ? "Emperor Smart Solution" : user.name,
        email: user.email,
        role: isSuper ? "SUPER_ADMIN" : user.role,
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
   * Get all active members for an organization.
   */
  async getOrgMembers(organizationId) {
    if (!organizationId) return [];
    try {
      const dbRes = await queryDb(
        `SELECT u."id", u."name", u."email", u."role" as "platformRole", m."role" as "orgRole", m."status", m."createdAt" as "joinedAt"
         FROM "OrganizationMembership" m
         JOIN "User" u ON m."userId" = u."id"
         WHERE m."organizationId" = $1 AND m."status" = 'ACTIVE';`,
        [organizationId]
      );
      if (dbRes.ok && dbRes.rows.length > 0) {
        return dbRes.rows;
      }
    } catch (e) { }

    // Tenant-isolated memory fallback: NEVER return users belonging to other organizations
    const members = [];
    for (const mem of memoryMemberships.values()) {
      if (mem.organizationId === organizationId && (mem.status === "ACTIVE" || mem.status === "INVITED")) {
        let matchedUser = null;
        for (const u of memoryUsers.values()) {
          if (u.id === mem.userId) {
            matchedUser = u;
            break;
          }
        }
        if (matchedUser) {
          members.push({
            id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email,
            orgRole: mem.role || "MEMBER",
            status: mem.status || "ACTIVE",
            joinedAt: mem.createdAt || matchedUser.createdAt || new Date().toISOString(),
          });
        }
      }
    }
    return members;
  },

  /**
   * Invite or add a team member into a specific organization.
   */
  async inviteOrgMember({ organizationId, email, name, role = "MEMBER" }) {
    if (!organizationId || !email || !email.includes("@")) {
      throw new Error("Valid email address and organization are required.");
    }
    const cleanEmail = email.trim().toLowerCase();
    const normalizedRole =
      role === "Admin" || role === "ORG_ADMIN"
        ? "ORG_ADMIN"
        : role === "Viewer" || role === "VIEWER"
          ? "VIEWER"
          : "MEMBER";
    const cleanName = (name || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).trim();

    let userId = null;
    const existingDb = await queryDb('SELECT "id", "name", "email" FROM "User" WHERE "email" = $1;', [cleanEmail]);
    if (existingDb.ok && existingDb.rows.length > 0) {
      userId = existingDb.rows[0].id;
    } else if (memoryUsers.has(cleanEmail)) {
      userId = memoryUsers.get(cleanEmail).id;
    } else {
      userId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const randomPassHash = await hashPassword(crypto.randomBytes(24).toString("hex"));
      const userObj = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        passwordHash: randomPassHash,
        role: "MEMBER",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryUsers.set(cleanEmail, userObj);
      await queryDb(
        'INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "status") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ("email") DO NOTHING;',
        [userId, cleanName, cleanEmail, randomPassHash, "MEMBER", "ACTIVE"]
      );
    }

    const memId = `mem_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const joinedAt = new Date().toISOString();
    const memObj = {
      id: memId,
      organizationId,
      userId,
      role: normalizedRole,
      status: "ACTIVE",
      createdAt: joinedAt,
    };
    memoryMemberships.set(`${organizationId}_${userId}`, memObj);

    await queryDb(
      `INSERT INTO "OrganizationMembership" ("id", "organizationId", "userId", "role", "status")
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       ON CONFLICT DO NOTHING;`,
      [memId, organizationId, userId, normalizedRole]
    );

    return {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      orgRole: normalizedRole,
      role: normalizedRole === "ORG_ADMIN" ? "Admin" : normalizedRole === "VIEWER" ? "Viewer" : "Member",
      status: "ACTIVE",
      joinedAt,
    };
  },

  /**
   * Remove a member from an organization (cannot remove ORG_OWNER).
   */
  async removeOrgMember({ organizationId, memberId }) {
    if (!organizationId || !memberId) {
      throw new Error("organizationId and memberId are required.");
    }
    const memKey = `${organizationId}_${memberId}`;
    const existingMem = memoryMemberships.get(memKey);
    if (existingMem?.role === "ORG_OWNER") {
      throw new Error("Cannot remove the primary Organization Owner.");
    }
    memoryMemberships.delete(memKey);

    await queryDb(
      `DELETE FROM "OrganizationMembership"
       WHERE "organizationId" = $1 AND "userId" = $2 AND "role" != 'ORG_OWNER';`,
      [organizationId, memberId]
    );
    return { removed: true };
  },

  /**
   * Update user profile and/or workspace name.
   */
  async updateUserProfile({ userId, email, name, organizationId, organizationName }) {
    if (name && name.trim()) {
      const cleanName = name.trim().slice(0, 100);
      await queryDb('UPDATE "User" SET "name" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2;', [cleanName, userId]);
      if (email && memoryUsers.has(email.toLowerCase())) {
        memoryUsers.get(email.toLowerCase()).name = cleanName;
      }
      for (const u of memoryUsers.values()) {
        if (u.id === userId) u.name = cleanName;
      }
    }

    if (organizationId && organizationName && organizationName.trim()) {
      const cleanOrg = organizationName.trim().slice(0, 120);
      await queryDb('UPDATE "Organization" SET "name" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2;', [cleanOrg, organizationId]);
      if (memoryOrgs.has(organizationId)) {
        memoryOrgs.get(organizationId).name = cleanOrg;
      }
    }

    return { updated: true };
  },

  /**
   * Change user password after verifying current password.
   */
  async changeUserPassword({ userId, currentPassword, newPassword }) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    let user = null;
    const dbRes = await queryDb('SELECT * FROM "User" WHERE "id" = $1;', [userId]);
    if (dbRes.ok && dbRes.rows.length > 0) {
      user = dbRes.rows[0];
    } else {
      for (const u of memoryUsers.values()) {
        if (u.id === userId) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new Error("Account not found.");
    }

    if (currentPassword && user.passwordHash) {
      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        throw new Error("Current password is incorrect.");
      }
    }

    const nextHash = await hashPassword(newPassword);
    await queryDb('UPDATE "User" SET "passwordHash" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2;', [nextHash, userId]);
    if (user.email && memoryUsers.has(user.email.toLowerCase())) {
      memoryUsers.get(user.email.toLowerCase()).passwordHash = nextHash;
    }

    return { updated: true };
  },

  /**
   * Reset user password by verified mobile phone number.
   */
  async resetPasswordWithPhone({ phone, newPassword }) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    const cleanPhone = otpStore.normalizePhone(phone);
    const rawDigits = String(phone || "").replace(/\D/g, "");
    const digits10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
    if (!digits10 || digits10.length < 10) {
      throw new Error("A valid 10-digit mobile number is required.");
    }

    const digits12 = `91${digits10}`;
    const plusDigits = `+91${digits10}`;
    const generatedEmail = `${digits10}@phone.emperornexus.com`;
    const phoneVariants = [cleanPhone, digits10, digits12, plusDigits].filter(Boolean);

    let user = null;
    try {
      const dbRes = await queryDb(
        'SELECT * FROM "User" WHERE "phone" = $1 OR "phone" = $2 OR "phone" = $3 OR "email" = $4 LIMIT 1;',
        [plusDigits, digits10, digits12, generatedEmail]
      );
      if (dbRes.ok && dbRes.rows && dbRes.rows.length > 0) {
        user = dbRes.rows[0];
      }
    } catch (e) {
      console.warn("[AUTH_RESET_PWD_DB_WARN]", e.message);
    }

    if (!user) {
      for (const u of memoryUsers.values()) {
        if (!u) continue;
        const uPhoneDigits = String(u.phone || "").replace(/\D/g, "");
        if (
          phoneVariants.includes(u.phone) ||
          (uPhoneDigits && uPhoneDigits.endsWith(digits10)) ||
          u.email === generatedEmail
        ) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new Error("No account found with this mobile number.");
    }

    const nextHash = await hashPassword(newPassword);
    await queryDb('UPDATE "User" SET "passwordHash" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2;', [nextHash, user.id]);

    if (user.email && memoryUsers.has(user.email.toLowerCase())) {
      memoryUsers.get(user.email.toLowerCase()).passwordHash = nextHash;
    }
    for (const u of memoryUsers.values()) {
      if (u.id === user.id) {
        u.passwordHash = nextHash;
      }
    }

    return { success: true, userId: user.id };
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
      queryDb('UPDATE "ApiKey" SET "lastUsedAt" = CURRENT_TIMESTAMP WHERE "id" = $1;', [dbRes.rows[0].id]).catch(() => { });
      return dbRes.rows[0];
    }

    return memoryApiKeys.get(keyHash) || null;
  },

  /**
   * List available system accounts for OAuth account chooser.
   */
  async listSystemAccounts() {
    const accounts = [];
    const seenEmails = new Set();

    try {
      const dbRes = await queryDb('SELECT "id", "name", "email", "role" FROM "User" WHERE "status" = \'ACTIVE\' ORDER BY "createdAt" DESC LIMIT 15;');
      if (dbRes.ok && Array.isArray(dbRes.rows)) {
        for (const row of dbRes.rows) {
          if (!seenEmails.has(row.email.toLowerCase())) {
            seenEmails.add(row.email.toLowerCase());
            accounts.push({
              id: row.id,
              name: row.name || row.email.split("@")[0],
              email: row.email,
              role: row.role,
              isSuperAdmin: row.role === "SUPER_ADMIN" || row.email.toLowerCase() === DEFAULT_ADMIN_EMAIL,
            });
          }
        }
      }
    } catch (e) { }

    // Add memory users
    for (const u of memoryUsers.values()) {
      if (u.email && !seenEmails.has(u.email.toLowerCase())) {
        seenEmails.add(u.email.toLowerCase());
        accounts.push({
          id: u.id,
          name: u.name || u.email.split("@")[0],
          email: u.email,
          role: u.role,
          isSuperAdmin: u.role === "SUPER_ADMIN" || u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL,
        });
      }
    }

    // Filter out dummy placeholder accounts so only real user accounts are displayed
    const realAccounts = accounts.filter(
      (a) =>
        a.email &&
        a.email.toLowerCase() !== "admin@company.com" &&
        a.email.toLowerCase() !== "admin@emperorsmartsolutions.com" &&
        !isDummyOrTestAccount(a.email, a.name)
    );

    return realAccounts;
  },

  /**
   * Log in or sign up via Google / OAuth provider.
   */
  async loginWithOAuth({ email, name, avatar, provider = "google" }) {
    if (!email || !email.includes("@")) {
      throw new Error("Valid email address is required for Google Sign-In");
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase())).trim();

    let user = null;
    const dbRes = await queryDb('SELECT * FROM "User" WHERE "email" = $1;', [cleanEmail]);
    if (dbRes.ok && dbRes.rows.length > 0) {
      user = dbRes.rows[0];
    } else {
      user = memoryUsers.get(cleanEmail);
    }

    const isSuper = cleanEmail === DEFAULT_ADMIN_EMAIL;

    if (!user) {
      // Auto-register new OAuth user
      const userRole = isSuper ? "SUPER_ADMIN" : "MEMBER";
      const orgRole = isSuper ? "SUPER_ADMIN" : "ORG_OWNER";
      const registered = await this.register({
        email: cleanEmail,
        password: `OAuth_${crypto.randomBytes(16).toString("hex")}!2026`,
        name: cleanName,
        organizationName: `${cleanName}'s Workspace`,
        role: userRole,
      });

      user = {
        id: registered.user.id,
        name: registered.user.name,
        email: cleanEmail,
        role: registered.user.role,
      };

      return {
        user,
        organizationId: registered.organization.id,
        orgRole,
        memberships: [
          {
            id: `mem_${registered.organization.id}`,
            organizationId: registered.organization.id,
            role: orgRole,
            orgName: registered.organization.name,
          },
        ],
      };
    }

    // User already exists, resolve memberships
    const memberships = await this.getUserMemberships(user.id);
    const primaryMembership = memberships[0] || null;
    const orgId = primaryMembership?.organizationId || DEFAULT_ORG_ID;
    const orgRole = isSuper ? "SUPER_ADMIN" : (primaryMembership?.role || "ORG_ADMIN");

    if (isSuper) {
      user.name = "Emperor Smart Solution";
      user.role = "SUPER_ADMIN";
    }

    try {
      usersStore.upsertUser({
        id: user.id,
        name: isSuper ? "Emperor Smart Solution" : (user.name || cleanName),
        email: user.email,
        organization: isSuper ? "Emperor Smart Solutions" : (primaryMembership?.orgName || `${user.name || cleanName}'s Workspace`),
        role: isSuper ? "Platform Super Admin" : "Workspace Owner",
        status: "Active",
      });
      sseBroker.broadcast("USER_LOGIN", {
        user: { id: user.id, name: user.name || cleanName, email: user.email },
        organizationId: orgId,
      });
    } catch (e) { }

    return {
      user: {
        id: user.id,
        name: isSuper ? "Emperor Smart Solution" : (user.name || cleanName),
        email: user.email,
        role: isSuper ? "SUPER_ADMIN" : (user.role || "MEMBER"),
      },
      organizationId: orgId,
      orgRole,
      memberships,
    };
  },
};
