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
    const targetOrgId = isSuperAdmin ? null : principal.organizationId;

    const conv = conversationsStore.getConversation(id, targetOrgId);
    if (!conv) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const agentUser = {
      id: principal.userId,
      name: principal.name || principal.email.split("@")[0],
    };

    const updated = conversationsStore.resolveConversation(id, agentUser);

    return NextResponse.json({
      success: true,
      message: "Conversation marked as resolved.",
      conversation: updated,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

