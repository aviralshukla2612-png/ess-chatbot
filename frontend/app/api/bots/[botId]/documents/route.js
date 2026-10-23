import { NextResponse } from "next/server";
import { documentsStore } from "@/lib/db/documentsStore";
import { botsStore } from "@/lib/db/botsStore";
import { requireAuth, requireOrgRole, ROLES } from "@/lib/auth/guard";

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { botId } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const docs = documentsStore.getDocuments(botId);
    return NextResponse.json({ success: true, documents: docs });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireOrgRole(request, [ROLES.ORG_OWNER, ROLES.ORG_ADMIN]);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { botId } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { id, name, content, type } = body;
      if (!content || !content.trim()) {
        return NextResponse.json({ success: false, error: "Document content cannot be empty" }, { status: 400 });
      }
      const doc = documentsStore.addDocument({
        id,
        botId,
        name: name?.trim() || "Custom Business Knowledge",
        content: content.trim(),
        type: type || "Document",
      });
      return NextResponse.json({ success: true, document: doc });
    }

    // FormData upload
    const formData = await request.formData();
    const file = formData.get("file");
    const manualContent = formData.get("content");
    const manualName = formData.get("name");

    let textContent = manualContent || "";
    let fileName = manualName || file?.name || "Uploaded Document";

    if (file && typeof file.text === "function") {
      try {
        const extracted = await file.text();
        if (extracted && extracted.trim()) {
          textContent = extracted;
        }
      } catch (e) {}
    }

    if (!textContent || !textContent.trim()) {
      return NextResponse.json(
        { success: false, error: "Could not read text content from document. Please provide text or PDF content." },
        { status: 400 }
      );
    }

    const doc = documentsStore.addDocument({
      botId,
      name: fileName,
      content: textContent.trim(),
      type: fileName.split(".").pop()?.toUpperCase() || "Document",
    });

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
    const { botId } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, content, type } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Document id is required" }, { status: 400 });
    }

    const existing = documentsStore.getDocumentById(id);
    if (!existing || existing.botId !== botId) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const updated = documentsStore.updateDocument(id, {
      name: name?.trim() || existing.name,
      content: content !== undefined ? content.trim() : existing.content,
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
    const { botId } = await params;

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const docId = url.searchParams.get("id");

    if (!docId) {
      return NextResponse.json({ success: false, error: "Document id query parameter is required" }, { status: 400 });
    }

    const existing = documentsStore.getDocumentById(docId);
    if (existing && existing.botId !== botId && !isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    documentsStore.deleteDocument(docId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

