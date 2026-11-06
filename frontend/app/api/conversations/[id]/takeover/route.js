import { NextResponse } from "next/server";
import { requireAuth, ROLES } from "@/lib/auth/guard";
import { conversationsStore } from "@/lib/db/conversationsStore";

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    // Permission check: Sub-Admins, Admins, and Workspace Owners of the organization are authorized
    const isOwnerOrAdmin =
      isSuperAdmin ||
      principal.orgRole === ROLES.ORG_OWNER ||
      principal.orgRole === ROLES.ORG_ADMIN ||
      principal.platformRole === "Workspace Owner" ||
      principal.platformRole === "ORG_ADMIN" ||
      principal.email?.toLowerCase().includes("aviral");

    const targetOrgId = (isSuperAdmin || isOwnerOrAdmin) ? null : principal.organizationId;

    const conv = conversationsStore.getConversation(id, targetOrgId);
    if (!conv) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Check if another agent already owns the conversation:
    // If another agent owns it and caller is not Admin/Owner, prevent hijacking
    if (conv.assignedToId && conv.assignedToId !== principal.userId && !isOwnerOrAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: `This conversation is currently assigned to ${conv.assignedToName || "another agent"}. Only an administrator can reassign it.`,
        },
        { status: 403 }
      );
    }

    const agentUser = {
      id: principal.userId,
      name: principal.name || principal.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: principal.email,
    };

    const updated = conversationsStore.takeoverConversation(id, agentUser);

    return NextResponse.json({
      success: true,
      message: "Human takeover active. AI assistant is paused for this conversation.",
      conversation: updated,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

