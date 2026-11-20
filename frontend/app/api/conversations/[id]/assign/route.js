import { NextResponse } from "next/server";
import { requireAuth, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { authStore } from "@/lib/db/authStore";

export async function POST(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const isOwnerOrAdmin =
      isSuperAdmin ||
      principal.orgRole === ROLES.ORG_OWNER ||
      principal.orgRole === ROLES.ORG_ADMIN;

    // Strict tenant isolation: ORG_OWNER/ORG_ADMIN can manage within THEIR org only
    const targetOrgId = isSuperAdmin ? null : principal.organizationId;

    const conv = conversationsStore.getConversation(id, targetOrgId);
    if (!conv) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    let targetUserId = body.targetUserId;
    let targetUserName = body.targetUserName;

    if (body.assignToMe || !targetUserId) {
      targetUserId = principal.userId;
      targetUserName = principal.name || principal.email.split("@")[0];
    } else {
      if (!isOwnerOrAdmin && targetUserId !== principal.userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Only administrators can assign conversations to other team members." },
          { status: 403 }
        );
      }
    }

    // Verify target user is an active member of the conversation's organization (SEC-04)
    const effectiveOrgId = conv.organizationId || principal.organizationId || "org_ess_default";
    const membership = await authStore.verifyOrgMembership(targetUserId, effectiveOrgId);
    if (!membership || membership.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Target user is not an active member of this organization." },
        { status: 400 }
      );
    }

    if (!targetUserName) {
      const u = await authStore.getUserById(targetUserId);
      targetUserName = u?.name || u?.email?.split("@")[0] || "Team Member";
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
