import { NextResponse } from "next/server";
import { authStore } from "@/lib/db/authStore";
import { signSessionToken } from "@/lib/auth/session";

/**
 * GET /api/auth/google
 * Returns authenticated session accounts (no hardcoded fallback defaults)
 */
export async function GET() {
  return NextResponse.json({ success: true, accounts: [] });
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
