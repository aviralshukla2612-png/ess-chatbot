import crypto from "crypto";
import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { signSessionToken } from "@/lib/auth/session";

function resolveSafeBaseUrl(request) {
  // 1. Prioritize active request host and proto (supports emperornexus.com, www, and local dev)
  const host = request?.headers?.get("x-forwarded-host") || request?.headers?.get("host");
  const proto = request?.headers?.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");

  if (host) {
    const cleanHost = host.split(",")[0].trim();
    const isAllowed =
      cleanHost === "emperornexus.com" ||
      cleanHost === "www.emperornexus.com" ||
      cleanHost.startsWith("localhost") ||
      cleanHost.startsWith("127.0.0.1") ||
      (process.env.APP_URL && cleanHost === new URL(process.env.APP_URL).host);

    if (isAllowed) {
      return `${proto}://${cleanHost}`.replace(/\/+$/, "");
    }
  }

  // 2. Fall back to environment configuration
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/+$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

  return "https://emperornexus.com";
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
 * GET /api/auth/google/callback
 * Handles Google OAuth 2.0 authorization code exchange, verifies CSRF state & email_verified, and logs in user.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const rawState = searchParams.get("state") || "";

    const baseUrl = resolveSafeBaseUrl(request);
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (error || !code) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(error || "Google sign-in was cancelled")}`
      );
    }

    // Verify OAuth CSRF state cookie
    const stateCookie = request.cookies.get("ess_oauth_state")?.value || "";
    let redirectTarget = "/dashboard";
    let stateNonce = "";

    try {
      const parsedState = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8"));
      stateNonce = parsedState?.nonce || "";
      redirectTarget = sanitizeRedirectPath(parsedState?.redirect || "/dashboard");
    } catch {
      return NextResponse.redirect(`${baseUrl}/login?error=Invalid+OAuth+state+parameter`);
    }

    if (
      !stateCookie ||
      !stateNonce ||
      stateCookie.length !== stateNonce.length ||
      !crypto.timingSafeEqual(Buffer.from(stateCookie), Buffer.from(stateNonce))
    ) {
      return NextResponse.redirect(`${baseUrl}/login?error=OAuth+session+expired+or+CSRF+mismatch`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/login?error=Google+OAuth+credentials+missing+in+server+env`);
    }

    // Exchange code for Google OAuth tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(8000),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[GOOGLE_TOKEN_EXCHANGE_ERROR]", tokenData?.error || "token_exchange_failed");
      return NextResponse.redirect(`${baseUrl}/login?error=Google+token+exchange+failed`);
    }

    // Fetch verified user profile from Google
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(8000),
    });

    const profile = await userinfoRes.json();
    if (!profile.email || profile.email_verified !== true) {
      return NextResponse.redirect(`${baseUrl}/login?error=Verified+Google+account+email+is+required`);
    }

    // Authenticate or auto-provision workspace for user
    const authResult = await authStore.loginWithOAuth({
      email: profile.email.toLowerCase(),
      name: profile.name || profile.given_name || profile.email.split("@")[0],
      avatar: profile.picture || "",
      provider: "google",
    });

    const { user, organizationId, orgRole } = authResult;

    const token = signSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId,
      orgRole,
    });

    const isSuper = user.role === "SUPER_ADMIN" || orgRole === "SUPER_ADMIN";
    const destination = isSuper ? `${baseUrl}/admin` : `${baseUrl}${redirectTarget}`;
    const isHttps = baseUrl.startsWith("https://") || process.env.NODE_ENV === "production";

    const response = NextResponse.redirect(destination);
    response.cookies.set({
      name: "ess_oauth_state",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      secure: isHttps,
    });
    response.cookies.set({
      name: "ess_session",
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      secure: isHttps,
    });

    return response;
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_") || err?.message?.includes("bail out")) {
      throw err;
    }
    console.error("[GOOGLE_CALLBACK_ERROR]", err);
    const baseUrl = resolveSafeBaseUrl(request);
    return NextResponse.redirect(`${baseUrl}/login?error=Authentication+exception`);
  }
}
