import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { signSessionToken } from "@/lib/auth/session";

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth 2.0 authorization code exchange and logs in user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (error || !code) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(error || "Google sign-in was cancelled")}`
      );
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
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[GOOGLE_TOKEN_EXCHANGE_ERROR]", tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=Google+token+exchange+failed`);
    }

    // Fetch verified user profile from Google
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await userinfoRes.json();
    if (!profile.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=Could+not+retrieve+Google+account+email`);
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
      email: user.email,
      role: user.role,
      organizationId,
      orgRole,
    });

    const isSuper = user.role === "SUPER_ADMIN" || orgRole === "SUPER_ADMIN";
    const destination = isSuper ? `${baseUrl}/admin` : `${baseUrl}/dashboard`;

    const response = NextResponse.redirect(destination);
    response.cookies.set({
      name: "ess_session",
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      secure: proto === "https",
    });

    return response;
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_") || err?.message?.includes("bail out")) {
      throw err;
    }
    console.error("[GOOGLE_CALLBACK_ERROR]", err);
    const host = request.headers.get("host") || "localhost:3000";
    return NextResponse.redirect(`https://${host}/login?error=Authentication+exception`);
  }
}
