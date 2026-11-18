/**
 * Centralized API Authentication, Tenant Authorization, CSRF & Principal Rate-Limit Guard
 * Enforces authenticated identity, session tokens, API keys, RBAC, and per-user / per-API-key
 * rate limits across private endpoints.
 */

let NextResponse = globalThis.Response;
try {
  const nextServer = await import("next/server.js");
  if (nextServer?.NextResponse) {
    NextResponse = nextServer.NextResponse;
  }
} catch {
  // Use global Response in environments without next package installed (standalone test runner)
}
import { parseCookies, verifySessionToken } from "./session.js";
import { authStore } from "../db/authStore.js";
import { enforceRateLimit, verifyCsrfOrigin } from "../security/rateLimitPolicy.js";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_OWNER: "ORG_OWNER",
  ORG_ADMIN: "ORG_ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
};

// Short-lived in-memory cache for user block checks to avoid synchronous disk reads on every API call
let blockedUsersCache = { loadedAt: 0, blockedIds: new Set(), blockedEmails: new Set() };
const BLOCK_CACHE_TTL_MS = 5000;

export function invalidateBlockedUsersCache() {
  blockedUsersCache.loadedAt = 0;
}

async function isPrincipalBlocked(principal) {
  const now = Date.now();
  if (now - blockedUsersCache.loadedAt > BLOCK_CACHE_TTL_MS) {
    try {
      const { usersStore } = await import("../db/usersStore.js");
      const list = usersStore.getUsers();
      const ids = new Set();
      const emails = new Set();
      for (const u of list) {
        if (u && (u.status === "Blocked" || u.status === "BLOCKED")) {
          if (u.id) ids.add(u.id);
          if (u.email) emails.add(u.email.toLowerCase());
        }
      }
      blockedUsersCache = { loadedAt: now, blockedIds: ids, blockedEmails: emails };
    } catch {
      return false;
    }
  }

  if (principal.userId && blockedUsersCache.blockedIds.has(principal.userId)) return true;
  if (principal.email && blockedUsersCache.blockedEmails.has(principal.email.toLowerCase())) return true;
  return false;
}

/**
 * Helper: Strictly evaluate whether a verified principal holds Platform SUPER_ADMIN authority.
 */
export function isPlatformSuperAdmin(principal) {
  if (!principal || !principal.authenticated) return false;
  return (
    principal.platformRole === ROLES.SUPER_ADMIN ||
    principal.orgRole === ROLES.SUPER_ADMIN
  );
}

/**
 * Extract authenticated session or API key from Next.js Request.
 */
export async function getAuthenticatedPrincipal(request) {
  // 1. Check Cookie: ess_session
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.ess_session;

  if (sessionToken) {
    const session = verifySessionToken(sessionToken);
    if (session) {
      // Allow caller to switch active organization via X-Organization-Id header ONLY if they are a verified member
      const requestedOrgId = request.headers.get("x-organization-id");
      let activeOrgId = session.organizationId;
      let activeOrgRole = session.orgRole;

      if (requestedOrgId && requestedOrgId !== activeOrgId) {
        const membership = await authStore.verifyOrgMembership(session.userId, requestedOrgId);
        if (membership) {
          activeOrgId = requestedOrgId;
          activeOrgRole = membership.role;
        }
      }

      return {
        authenticated: true,
        type: "session",
        userId: session.userId,
        name: session.name || null,
        email: session.email,
        platformRole: session.role,
        organizationId: activeOrgId,
        orgRole: activeOrgRole,
      };
    }
  }

  // 2. Check Bearer Authorization Header
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();

    // Check if it's an API Key
    if (bearer.startsWith("ess_live_")) {
      const apiKey = await authStore.verifyApiKey(bearer);
      if (apiKey) {
        return {
          authenticated: true,
          type: "apiKey",
          apiKeyId: apiKey.id,
          userId: `apikey_${apiKey.id}`,
          email: "service-account@api",
          platformRole: "MEMBER",
          organizationId: apiKey.organizationId,
          orgRole: apiKey.role || "MEMBER",
        };
      }
    }

    // Otherwise test if bearer is a session token
    const session = verifySessionToken(bearer);
    if (session) {
      return {
        authenticated: true,
        type: "session",
        userId: session.userId,
        name: session.name || null,
        email: session.email,
        platformRole: session.role,
        organizationId: session.organizationId,
        orgRole: session.orgRole,
      };
    }
  }

  // 3. Check X-API-Key Header
  const rawApiKey = request.headers.get("x-api-key");
  if (rawApiKey && rawApiKey.startsWith("ess_live_")) {
    const apiKey = await authStore.verifyApiKey(rawApiKey);
    if (apiKey) {
      return {
        authenticated: true,
        type: "apiKey",
        apiKeyId: apiKey.id,
        userId: `apikey_${apiKey.id}`,
        email: "service-account@api",
        platformRole: "MEMBER",
        organizationId: apiKey.organizationId,
        orgRole: apiKey.role || "MEMBER",
      };
    }
  }

  return { authenticated: false };
}

/**
 * Guard: Requires any valid authenticated session or API key.
 * Enforces CSRF Origin verification on cookie-authenticated mutations,
 * account block status, and per-API-key / per-user / per-org rate limits.
 * Returns { ok: true, principal, rateLimit } OR { ok: false, response: NextResponse }
 */
export async function requireAuth(request, options = {}) {
  const principal = await getAuthenticatedPrincipal(request);
  if (!principal.authenticated) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Valid session cookie or Bearer token is required.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      ),
    };
  }

  // 1. CSRF check for browser cookie state-changing requests
  if (principal.type === "session" && options.skipCsrf !== true) {
    const csrf = verifyCsrfOrigin(request);
    if (!csrf.ok) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: csrf.error,
            code: "CSRF_ORIGIN_MISMATCH",
          },
          { status: 403 }
        ),
      };
    }
  }

  // 2. Enforce account block for non-superadmin users
  if (!isPlatformSuperAdmin(principal)) {
    if (await isPrincipalBlocked(principal)) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Your account has been blocked or suspended by platform administration.",
            code: "ACCOUNT_BLOCKED",
          },
          { status: 403 }
        ),
      };
    }
  }

  // 3. Enforce per-API-key OR per-user + per-organization rate limits
  if (options.skipRateLimit !== true) {
    if (principal.type === "apiKey") {
      const keyLimit = await enforceRateLimit("api_key", principal.apiKeyId || principal.userId);
      if (!keyLimit.ok) return { ok: false, response: keyLimit.response };
    } else if (principal.userId) {
      const userLimit = await enforceRateLimit("user_api", principal.userId);
      if (!userLimit.ok) return { ok: false, response: userLimit.response };
    }

    if (principal.organizationId) {
      const orgLimit = await enforceRateLimit("organization", principal.organizationId);
      if (!orgLimit.ok) return { ok: false, response: orgLimit.response };
    }
  }

  return { ok: true, principal };
}

/**
 * Guard: Requires organization membership with specific role(s).
 */
export async function requireOrgRole(
  request,
  allowedRoles = [ROLES.ORG_OWNER, ROLES.ORG_ADMIN],
  options = {}
) {
  const auth = await requireAuth(request, options);
  if (!auth.ok) return auth;

  const { principal } = auth;
  // Super Admins always pass
  if (isPlatformSuperAdmin(principal)) {
    return { ok: true, principal };
  }

  if (!allowedRoles.includes(principal.orgRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Forbidden. This operation requires one of: ${allowedRoles.join(", ")}. Current role: ${principal.orgRole}`,
          code: "FORBIDDEN_INSUFFICIENT_ROLE",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, principal };
}

/**
 * Guard: Requires platform SUPER_ADMIN role.
 */
export async function requireSuperAdmin(request, options = {}) {
  const auth = await requireAuth(request, options);
  if (!auth.ok) return auth;

  const { principal } = auth;
  if (!isPlatformSuperAdmin(principal)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Forbidden. This administrative operation requires platform SUPER_ADMIN privileges.",
          code: "FORBIDDEN_SUPER_ADMIN_REQUIRED",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, principal };
}
