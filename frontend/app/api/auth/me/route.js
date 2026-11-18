import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/authStore";

export async function GET(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        user: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }

  const { principal } = auth;
  const user = await authStore.getUserById(principal.userId);
  const memberships = await authStore.getUserMemberships(principal.userId);
  const activeMembership = Array.isArray(memberships)
    ? memberships.find((m) => m.organizationId === principal.organizationId)
    : null;

  return NextResponse.json(
    {
      success: true,
      authenticated: true,
      user: {
        id: principal.userId,
        email: principal.email,
        name: user?.name || principal.name || principal.email?.split("@")[0] || "User",
        role: principal.platformRole,
      },
      activeOrganizationId: principal.organizationId,
      activeOrgName: activeMembership?.organizationName || activeMembership?.name || null,
      activeOrgRole: principal.orgRole,
      memberships,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
