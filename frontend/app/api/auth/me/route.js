import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/authStore";

export async function GET(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { principal } = auth;
  const user = await authStore.getUserById(principal.userId);
  const memberships = await authStore.getUserMemberships(principal.userId);

  return NextResponse.json({
    success: true,
    user: {
      id: principal.userId,
      email: principal.email,
      name: user?.name || principal.email.split("@")[0],
      role: principal.platformRole,
    },
    activeOrganizationId: principal.organizationId,
    activeOrgRole: principal.orgRole,
    memberships,
  });
}

export async function PATCH(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { principal } = auth;
  const body = await request.json().catch(() => ({}));

  if (body.name && typeof body.name === "string") {
    await authStore.updateUserProfile(principal.userId, { name: body.name.trim() });
  }

  if (body.orgName && typeof body.orgName === "string") {
    const canUpdateOrg =
      ["OWNER", "ORG_OWNER", "ADMIN", "ORG_ADMIN"].includes(principal.orgRole) ||
      principal.platformRole === "SUPER_ADMIN";

    if (!canUpdateOrg) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only workspace owners and administrators can rename this organization." },
        { status: 403 }
      );
    }
    await authStore.updateOrganization(principal.organizationId, { name: body.orgName.trim() });
  }

  const updatedUser = await authStore.getUserById(principal.userId);
  const memberships = await authStore.getUserMemberships(principal.userId);

  return NextResponse.json({
    success: true,
    user: {
      id: principal.userId,
      email: principal.email,
      name: updatedUser?.name || principal.email.split("@")[0],
      role: principal.platformRole,
    },
    activeOrganizationId: principal.organizationId,
    activeOrgRole: principal.orgRole,
    memberships,
  });
}
