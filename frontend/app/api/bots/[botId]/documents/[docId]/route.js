import { NextResponse } from "next/server";
import { documentsStore } from "@/lib/db/documentsStore";
import { botsStore } from "@/lib/db/botsStore";
import { requireAuth, requireOrgRole, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";
import { validateProhibitedContent } from "@/lib/security/contentModeration";
import { getAiResourceLimits } from "@/lib/security/rateLimitPolicy";

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
    const { botId, docId } = await params;
    const isSuperAdmin = isPlatformSuperAdmin(principal);

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot || (!isSuperAdmin && bot.organizationId !== principal.organizationId)) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const doc = documentsStore.getDocumentById(docId);
    if (!doc || doc.botId !== bot.id) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { botId, docId } = await params;
    const isSuperAdmin = isPlatformSuperAdmin(principal);

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot || (!isSuperAdmin && bot.organizationId !== principal.organizationId)) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const existing = documentsStore.getDocumentById(docId);
    if (!existing || existing.botId !== bot.id) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, content, type } = body;

    if (content !== undefined && (!content || !content.trim())) {
      return NextResponse.json({ success: false, error: "Document content cannot be empty" }, { status: 400 });
    }

    const { maxDocumentBytes } = getAiResourceLimits();
    if (content !== undefined && Buffer.byteLength(String(content), "utf8") > maxDocumentBytes) {
      return NextResponse.json({ success: false, error: "Document exceeds maximum size limit." }, { status: 413 });
    }

    const modCheck = validateProhibitedContent({
      name: name ?? existing.name,
      content: content ?? existing.content,
    });
    if (!modCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: modCheck.error,
          code: "PROHIBITED_CATEGORY_VIOLATION",
          category: modCheck.violation,
        },
        { status: 400 }
      );
    }

    const updated = documentsStore.updateDocument(docId, {
      name: name?.trim() || existing.name,
      content: content?.trim() || existing.content,
      type: type || existing.type,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { botId, docId } = await params;
    const isSuperAdmin = isPlatformSuperAdmin(principal);

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot || (!isSuperAdmin && bot.organizationId !== principal.organizationId)) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const existing = documentsStore.getDocumentById(docId);
    if (!existing || (existing.botId !== bot.id && !isSuperAdmin)) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    documentsStore.deleteDocument(docId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
