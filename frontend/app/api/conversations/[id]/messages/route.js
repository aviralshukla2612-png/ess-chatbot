import { NextResponse } from "next/server";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { requireAuth, ROLES } from "@/lib/auth/guard";

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

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

    const existing = conversationsStore.getConversation(id, targetOrgId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json();
    if (!body.content && !body.text) {
      return NextResponse.json({ success: false, error: "Message content is required" }, { status: 400 });
    }

    const result = conversationsStore.addMessage(id, {
      role: body.role || "assistant",
      content: body.content || body.text,
      sources: body.sources || [],
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      conversation: result.conversation,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
