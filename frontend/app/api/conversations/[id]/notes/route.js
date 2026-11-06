import { NextResponse } from "next/server";
import { requireAuth, ROLES } from "@/lib/auth/guard";
import { conversationsStore } from "@/lib/db/conversationsStore";

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

    const conv = conversationsStore.getConversation(id, targetOrgId);
    if (!conv) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const notes = conversationsStore.getInternalNotes(id);

    return NextResponse.json({
      success: true,
      notes,
      total: notes.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
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

    const conv = conversationsStore.getConversation(id, targetOrgId);
    if (!conv) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const body = await request.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ success: false, error: "Note content cannot be empty" }, { status: 400 });
    }

    const authorName = principal.name || principal.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const note = conversationsStore.addInternalNote(id, {
      authorId: principal.userId,
      authorName,
      content: body.content,
      organizationId: conv.organizationId,
    });

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

