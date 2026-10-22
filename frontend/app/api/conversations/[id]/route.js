import { NextResponse } from "next/server";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { requireAuth, ROLES } from "@/lib/auth/guard";

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

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;
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

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;
    const targetOrgId = isSuperAdmin ? null : principal.organizationId;

    const existing = conversationsStore.getConversation(id, targetOrgId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json();
    const updated = conversationsStore.updateConversation(id, body);
    return NextResponse.json({ success: true, conversation: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { id } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;
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
