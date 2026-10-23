import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { authStore } from "@/lib/auth/authStore";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const members = await authStore.getOrganizationMembers(principal.organizationId);

    const formatted = (members || []).map((m) => {
      const addedDate = m.createdAt
        ? new Date(m.createdAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      return {
        id: m.id,
        name: m.name || m.email?.split("@")[0] || "Team Member",
        email: m.email,
        role: m.role === "ORG_OWNER" ? "Owner" : m.role === "ADMIN" ? "Admin" : "Member",
        status: m.status === "ACTIVE" ? "Active" : "Pending",
        addedDate,
      };
    });

    return NextResponse.json({
      success: true,
      members: formatted,
    });
  } catch (err) {
    console.error("[TEAM_GET_ERR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    // Only ORG_OWNER or ADMIN can invite members
    if (principal.orgRole !== "ORG_OWNER" && principal.orgRole !== "OWNER" && principal.orgRole !== "ADMIN" && principal.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Only workspace owners and admins can invite members" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, email, role } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "A valid email address is required" }, { status: 400 });
    }

    const member = await authStore.inviteOrAddMember(principal.organizationId, {
      name: name || email.split("@")[0],
      email,
      role: role || "MEMBER",
    });

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role === "ORG_OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : "Member",
        status: member.status === "ACTIVE" ? "Active" : "Pending",
        addedDate: member.addedDate,
      },
    });
  } catch (err) {
    console.error("[TEAM_POST_ERR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    if (principal.orgRole !== "ORG_OWNER" && principal.orgRole !== "OWNER" && principal.orgRole !== "ADMIN" && principal.platformRole !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Only workspace owners and admins can remove members" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get("id");

    if (!membershipId) {
      return NextResponse.json({ success: false, error: "Membership ID is required" }, { status: 400 });
    }

    await authStore.removeOrganizationMember(principal.organizationId, membershipId);

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (err) {
    console.error("[TEAM_DELETE_ERR]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
