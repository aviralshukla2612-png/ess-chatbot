import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { signSessionToken } from "@/lib/auth/session";

/**
 * GET /api/auth/google
 * Redirects the user directly to official Google OAuth 2.0 consent screen
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectTarget = searchParams.get("redirect") || "/dashboard";

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || `${proto}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const clientId = process.env.GOOGLE_CLIENT_ID;

    const isJson =
      request.headers.get("accept")?.includes("application/json") ||
      searchParams.get("format") === "json" ||
      searchParams.get("action") === "accounts";

    if (isJson) {
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

    const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleUrl.searchParams.set("client_id", clientId);
    googleUrl.searchParams.set("redirect_uri", redirectUri);
    googleUrl.searchParams.set("response_type", "code");
    googleUrl.searchParams.set("scope", "openid email profile");
    googleUrl.searchParams.set("prompt", "select_account");
    googleUrl.searchParams.set("access_type", "offline");
    googleUrl.searchParams.set("state", redirectTarget);

    return NextResponse.redirect(googleUrl.toString());
  } catch (err) {
    console.error("[GOOGLE_OAUTH_GET_ERROR]", err);
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    return NextResponse.redirect(`${proto}://${host}/login?error=${encodeURIComponent(err.message || "Failed to initiate Google OAuth")}`);
  }
}

/**
 * POST /api/auth/google
 * Authenticates the selected Google user, establishes session, and returns redirect
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, name, avatar } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid Google email address is required" },
        { status: 400 }
      );
    }

    const authResult = await authStore.loginWithOAuth({
      email,
      name,
      avatar,
      provider: "google",
    });

    const { user, organizationId, orgRole, memberships } = authResult;

    const token = signSessionToken({
      userId: user.id,
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

    response.cookies.set({
      name: "ess_session",
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      secure: process.env.COOKIE_SECURE === "true",
    });

    return response;
  } catch (err) {
    console.error("[GOOGLE_AUTH_ERROR]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to authenticate with Google" },
      { status: 401 }
    );
  }
}
