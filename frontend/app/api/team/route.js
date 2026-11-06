import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { authStore } from "@/lib/db/authStore";
import { conversationsStore } from "@/lib/db/conversationsStore";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const orgMembers = await authStore.getOrgMembers(principal.organizationId);

    // Ensure the current user is at least present in the list
    const hasCurrent = orgMembers.some((m) => m.id === principal.userId || m.email === principal.email);
    if (!hasCurrent) {
      orgMembers.unshift({
        id: principal.userId,
        name: principal.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: principal.email,
        orgRole: principal.orgRole || "ORG_OWNER",
        status: "ACTIVE",
        joinedAt: new Date().toISOString(),
      });
    }

    // Attach active conversations count
    const enriched = orgMembers.map((member) => {
      const activeConvs = conversationsStore.getConversations({
        organizationId: principal.organizationId,
        assignedToId: member.id,
        status: "Active",
      });
      return {
        id: member.id,
        name: member.name || member.email?.split("@")[0] || "Agent",
        email: member.email,
        role: member.orgRole === "ORG_OWNER" ? "Owner" : member.orgRole === "ORG_ADMIN" ? "Admin" : "Member",
        rawRole: member.orgRole,
        status: member.status || "ACTIVE",
        activeConversationsCount: activeConvs.length,
        joinedAt: member.joinedAt,
      };
    });

    return NextResponse.json({
      success: true,
      members: enriched,
      total: enriched.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

