import { NextResponse } from "next/server";
import { requireAuth, ROLES } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/authStore";
import { signSessionToken } from "@/lib/auth/session";

/**
 * PUT /api/auth/profile
 * Persists user profile updates, workspace name updates, and password changes.
 */
export async function PUT(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json().catch(() => ({}));
    const { action = "profile", name, organizationName, currentPassword, newPassword } = body;

    if (action === "password") {
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      await authStore.changeUserPassword({
        userId: principal.userId,
        currentPassword,
        newPassword,
      });

      return NextResponse.json({
        success: true,
        message: "Account password updated securely.",
      });
    }

    const canEditOrg =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.ORG_OWNER ||
      principal.orgRole === ROLES.ORG_ADMIN;

    await authStore.updateUserProfile({
      userId: principal.userId,
      email: principal.email,
      name,
      organizationId: canEditOrg ? principal.organizationId : null,
      organizationName: canEditOrg ? organizationName : null,
    });

    const updatedName = name?.trim() || principal.name || principal.email?.split("@")[0];
    const refreshedToken = signSessionToken({
      userId: principal.userId,
      name: updatedName,
      email: principal.email,
      role: principal.platformRole,
      organizationId: principal.organizationId,
      orgRole: principal.orgRole,
    });

    const response = NextResponse.json({
      success: true,
      message: "Workspace and profile settings saved.",
      user: {
        id: principal.userId,
        name: updatedName,
        email: principal.email,
        role: principal.platformRole,
      },
    });

    const isHttps =
      process.env.COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set({
      name: "ess_session",
      value: refreshedToken,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      secure: isHttps,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update settings." },
      { status: 400 }
    );
  }
}
