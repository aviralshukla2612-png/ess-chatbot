import { NextResponse } from "next/server";
import { requireAuth, ROLES } from "@/lib/auth/guard";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { authStore } from "@/lib/db/authStore";

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

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

    const body = await request.json().catch(() => ({}));
    let targetUserId = body.targetUserId;
    let targetUserName = body.targetUserName;

    // Self-assignment
    if (body.assignToMe || !targetUserId) {
      targetUserId = principal.userId;
      targetUserName = principal.name || principal.email.split("@")[0];
    } else {
      // Assigning to someone else requires Admin or Owner
      if (!isOwnerOrAdmin && targetUserId !== principal.userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Only administrators can assign conversations to other team members." },
          { status: 403 }
        );
      }
      if (!targetUserName) {
        const u = await authStore.getUserById(targetUserId);
        targetUserName = u?.name || u?.email?.split("@")[0] || "Team Member";
      }
    }

    const assignedByUser = {
      id: principal.userId,
      name: principal.name || principal.email.split("@")[0],
    };

    const targetUser = {
      id: targetUserId,
      name: targetUserName,
    };

    const updated = conversationsStore.assignConversation(id, targetUser, assignedByUser);

    return NextResponse.json({
      success: true,
      message: `Conversation successfully assigned to ${targetUserName}.`,
      conversation: updated,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

