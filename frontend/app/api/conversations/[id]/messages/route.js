import { NextResponse } from "next/server";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { requireAuth, isPlatformSuperAdmin } from "@/lib/auth/guard";

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

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const targetOrgId = isSuperAdmin ? null : principal.organizationId;

    const existing = conversationsStore.getConversation(id, targetOrgId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const rawContent = (body.content || body.text || "").toString().trim();
    if (!rawContent) {
      return NextResponse.json({ success: false, error: "Message content is required" }, { status: 400 });
    }
    if (rawContent.length > 8000) {
      return NextResponse.json({ success: false, error: "Agent message exceeds 8,000 character limit" }, { status: 400 });
    }

    const agentName =
      principal.name ||
      principal.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    if (existing.handlingMode !== "HUMAN") {
      conversationsStore.takeoverConversation(id, {
        id: principal.userId,
        name: agentName,
        email: principal.email,
      });
    }

    const result = conversationsStore.addMessage(
      id,
      {
        role: "agent",
        senderType: "human",
        senderId: principal.userId,
        senderName: agentName,
        content: rawContent,
        sources: Array.isArray(body.sources) ? body.sources : [],
      },
      {
        agentId: principal.userId,
        agentName,
        organizationId: existing.organizationId,
      }
    );

    return NextResponse.json({
      success: true,
      message: result.message,
      conversation: result.conversation,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
