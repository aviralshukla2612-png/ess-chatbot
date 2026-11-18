import { NextResponse } from "next/server";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { requireAuth, requireOrgRole, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const targetOrgId = isSuperAdmin ? null : principal.organizationId;

    const conversation = conversationsStore.getConversation(id, targetOrgId);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const targetOrgId = isSuperAdmin ? null : principal.organizationId;

    const existing = conversationsStore.getConversation(id, targetOrgId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    // Prevent mass assignment over id / organizationId / botId
    const safeUpdates = {};
    for (const field of ["visitorName", "visitorEmail", "visitorPhone", "status", "handlingMode", "isLead", "leadScore"]) {
      if (body[field] !== undefined) {
        safeUpdates[field] = body[field];
      }
    }

    const updated = conversationsStore.updateConversation(id, safeUpdates);
    return NextResponse.json({ success: true, conversation: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const targetOrgId = isSuperAdmin ? null : principal.organizationId;

    const existing = conversationsStore.getConversation(id, targetOrgId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    conversationsStore.deleteConversation(id, targetOrgId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
