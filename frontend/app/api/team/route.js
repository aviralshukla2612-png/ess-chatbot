import { NextResponse } from "next/server";
import { requireAuth, requireOrgRole, ROLES } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/authStore";
import { conversationsStore } from "@/lib/db/conversationsStore";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const orgMembers = await authStore.getOrgMembers(principal.organizationId);

    // Ensure the current authenticated user is always represented in their workspace roster
    const hasCurrent = orgMembers.some(
      (m) => m.id === principal.userId || (m.email && principal.email && m.email.toLowerCase() === principal.email.toLowerCase())
    );
    if (!hasCurrent) {
      orgMembers.unshift({
        id: principal.userId,
        name:
          principal.name ||
          (principal.email ? principal.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Workspace Owner"),
        email: principal.email,
        orgRole: principal.orgRole || "ORG_OWNER",
        status: "ACTIVE",
        joinedAt: new Date().toISOString(),
      });
    }

    // Compute active conversation assignments in a single org-scoped read
    const activeOrgConvs = conversationsStore.getConversations({
      organizationId: principal.organizationId,
      status: "Active",
    });

    const countByMember = new Map();
    for (const c of activeOrgConvs) {
      if (c.assignedToId) {
        countByMember.set(c.assignedToId, (countByMember.get(c.assignedToId) || 0) + 1);
      }
    }

    const enriched = orgMembers.map((member) => ({
      id: member.id,
      name: member.name || member.email?.split("@")[0] || "Agent",
      email: member.email,
      role:
        member.orgRole === "ORG_OWNER"
          ? "Owner"
          : member.orgRole === "ORG_ADMIN"
          ? "Admin"
          : member.orgRole === "VIEWER"
          ? "Viewer"
          : "Member",
      rawRole: member.orgRole,
      status: member.status || "ACTIVE",
      activeConversationsCount: countByMember.get(member.id) || 0,
      joinedAt: member.joinedAt,
    }));

    return NextResponse.json({
      success: true,
      members: enriched,
      total: enriched.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json().catch(() => ({}));
    const { email, name, role = "Member" } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid teammate email address is required." },
        { status: 400 }
      );
    }

    const added = await authStore.inviteOrgMember({
      organizationId: principal.organizationId,
      email,
      name,
      role,
    });

    return NextResponse.json({
      success: true,
      member: added,
      message: `${added.email} has been added to the workspace.`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to add team member." },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: "memberId query parameter is required." },
        { status: 400 }
      );
    }

    if (memberId === principal.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot remove your own active account." },
        { status: 400 }
      );
    }

    await authStore.removeOrgMember({
      organizationId: principal.organizationId,
      memberId,
    });

    return NextResponse.json({
      success: true,
      message: "Team member removed from workspace.",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to remove team member." },
      { status: 400 }
    );
  }
}
