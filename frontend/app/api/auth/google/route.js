import crypto from "crypto";
import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { signSessionToken } from "@/lib/auth/session";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { extractClientIp, enforceRateLimit, applyRateLimitHeaders } from "@/lib/security/rateLimitPolicy";

function resolveSafeBaseUrl(request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/+$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const proto = request.headers.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

function sanitizeRedirectPath(raw) {
  if (!raw || typeof raw !== "string") return "/dashboard";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "/dashboard";
  }
  return trimmed;
}

/**
 * GET /api/auth/google
 * Redirects the user directly to official Google OAuth 2.0 consent screen with a signed CSRF state cookie.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectTarget = sanitizeRedirectPath(searchParams.get("redirect") || "/dashboard");
    const baseUrl = resolveSafeBaseUrl(request);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    const isJson =
      searchParams.get("format") === "json" ||
      searchParams.get("action") === "accounts";

    // Account listing is strictly restricted to authenticated Platform SUPER_ADMIN (prevents user enumeration)
    if (isJson) {
      const adminAuth = await requireSuperAdmin(request);
      if (!adminAuth.ok) return adminAuth.response;
      const accounts = await authStore.listSystemAccounts();
      return NextResponse.json({
        success: true,
        accounts,
        hasGoogleConfig: Boolean(clientId),
      });
    }

    if (!clientId) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=Google+OAuth+not+yet+configured.+Please+set+GOOGLE_CLIENT_ID+in+server+env.`
      );
    }

    const csrfNonce = crypto.randomBytes(24).toString("hex");
    const statePayload = Buffer.from(
      JSON.stringify({ nonce: csrfNonce, redirect: redirectTarget })
    ).toString("base64url");

    const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleUrl.searchParams.set("client_id", clientId);
    googleUrl.searchParams.set("redirect_uri", redirectUri);
    googleUrl.searchParams.set("response_type", "code");
    googleUrl.searchParams.set("scope", "openid email profile");
    googleUrl.searchParams.set("prompt", "select_account");
    googleUrl.searchParams.set("access_type", "offline");
    googleUrl.searchParams.set("state", statePayload);

    const response = NextResponse.redirect(googleUrl.toString());
    const isHttps = baseUrl.startsWith("https://") || process.env.NODE_ENV === "production";
    response.cookies.set({
      name: "ess_oauth_state",
      value: csrfNonce,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
      secure: isHttps,
    });
    return response;
  } catch (err) {
    console.error("[GOOGLE_OAUTH_GET_ERROR]", err);
    const baseUrl = resolveSafeBaseUrl(request);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent("Failed to initiate Google OAuth")}`
    );
  }
}

/**
 * POST /api/auth/google
 * Verifies a cryptographic Google ID Token (`idToken` / `credential`) via Google's tokeninfo endpoint
 * before establishing a session. Unverified raw email payloads are strictly rejected.
 */
export async function POST(request) {
  try {
    const clientIp = extractClientIp(request);
    const rateCheck = await enforceRateLimit("login_ip", clientIp);
    if (!rateCheck.ok) return rateCheck.response;

    const body = await request.json().catch(() => ({}));
    const idToken = body.idToken || body.credential;

    if (!idToken || typeof idToken !== "string" || idToken.split(".").length !== 3) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Cryptographically signed Google ID token (credential) is required.",
            code: "MISSING_GOOGLE_ID_TOKEN",
          },
          { status: 401 }
        ),
        rateCheck.result
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Google OAuth is not configured on this server." },
        { status: 503 }
      );
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { signal: AbortSignal.timeout(6000) }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired Google ID token." },
        { status: 401 }
      );
    }

    const tokenPayload = await verifyRes.json();
    const isEmailVerified =
      tokenPayload.email_verified === true || tokenPayload.email_verified === "true";

    if (
      tokenPayload.aud !== clientId ||
      !tokenPayload.email ||
      !isEmailVerified
    ) {
      return NextResponse.json(
        { success: false, error: "Google token audience or email verification check failed." },
        { status: 401 }
      );
    }

    const authResult = await authStore.loginWithOAuth({
      email: tokenPayload.email.toLowerCase(),
      name: tokenPayload.name || tokenPayload.given_name || tokenPayload.email.split("@")[0],
      avatar: tokenPayload.picture || "",
      provider: "google",
    });

    const { user, organizationId, orgRole, memberships } = authResult;

    const token = signSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId,
      orgRole,
    });

    const isSuper = user.role === "SUPER_ADMIN" || orgRole === "SUPER_ADMIN";
    const destination = isSuper ? "/admin" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      user,
      token,
      organizationId,
      orgRole,
      memberships,
      destination,
    });

    const isHttps =
      process.env.COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set({
      name: "ess_session",
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      secure: isHttps,
    });

    return applyRateLimitHeaders(response, rateCheck.result);
  } catch (err) {
    console.error("[GOOGLE_AUTH_ERROR]", err);
    return NextResponse.json(
      { success: false, error: "Failed to authenticate with Google" },
      { status: 401 }
    );
  }
}
