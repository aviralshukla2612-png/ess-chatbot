import { NextResponse } from "next/server";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { requireAuth, requireOrgRole, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";
import { enforceRateLimit } from "@/lib/security/rateLimitPolicy";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const rateCheck = await enforceRateLimit("user_api", principal.userId || principal.email);
    if (!rateCheck.ok) return rateCheck.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "All";
    const handlingMode = searchParams.get("handlingMode") || "All";
    const assignedToId = searchParams.get("assignedToId");
    const view = searchParams.get("view");
    const onlyLeads = searchParams.get("onlyLeads") === "true";
    const search = searchParams.get("search") || "";
    const botId = searchParams.get("botId") || "All";
    const limitParam = parseInt(searchParams.get("limit") || "0", 10);
    const requestedOrg = searchParams.get("organizationId");

    // STRICT TENANT ISOLATION: Only Platform SUPER_ADMIN can view cross-tenant conversations
    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const targetOrgId = isSuperAdmin ? (requestedOrg || null) : principal.organizationId;

    const allOrgConvs = conversationsStore.getConversations({ organizationId: targetOrgId });
    const counts = {
      all: allOrgConvs.length,
      unread: allOrgConvs.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
      unassigned: allOrgConvs.filter((c) => !c.assignedToId && c.status !== "RESOLVED" && c.status !== "Closed").length,
      assignedToMe: allOrgConvs.filter((c) => c.assignedToId === principal.userId && c.status !== "RESOLVED" && c.status !== "Closed").length,
      humanActive: allOrgConvs.filter((c) => (c.handlingMode === "HUMAN" || c.status === "HUMAN_ACTIVE") && c.status !== "RESOLVED" && c.status !== "Closed").length,
      waitingForHuman: allOrgConvs.filter((c) => c.status === "WAITING_FOR_HUMAN").length,
      resolved: allOrgConvs.filter((c) => c.status === "RESOLVED" || c.status === "Closed").length,
    };

    let conversations = conversationsStore.getConversations({
      organizationId: targetOrgId,
      status,
      handlingMode,
      assignedToId,
      view,
      currentUserId: principal.userId,
      onlyLeads,
      search,
      botId,
    });

    const total = conversations.length;
    if (Number.isFinite(limitParam) && limitParam > 0) {
      conversations = conversations.slice(0, limitParam);
    }

    return NextResponse.json({
      success: true,
      conversations,
      counts,
      total,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const body = await request.json();

    // Bind conversation strictly to caller's organizationId
    const newConv = conversationsStore.createConversation({
      ...body,
      organizationId: principal.organizationId,
    });

    return NextResponse.json({
      success: true,
      conversation: newConv,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { searchParams } = new URL(request.url);
    const clearAll = searchParams.get("clearAll") === "true";
    const id = searchParams.get("id");
    const requestedOrg = searchParams.get("organizationId");

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const targetOrgId = isSuperAdmin ? (requestedOrg || principal.organizationId) : principal.organizationId;

    if (clearAll) {
      conversationsStore.clearAll(targetOrgId);
      return NextResponse.json({ success: true, message: "Workspace conversations cleared." });
    }

    if (id) {
      const existing = conversationsStore.getConversation(id, isSuperAdmin ? null : principal.organizationId);
      if (!existing) {
        return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
      }
      conversationsStore.deleteConversation(id, isSuperAdmin ? null : principal.organizationId);
      return NextResponse.json({ success: true, message: "Conversation deleted." });
    }

    return NextResponse.json({ success: false, error: "Missing parameter: id or clearAll" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
