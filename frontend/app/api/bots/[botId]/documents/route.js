import { NextResponse } from "next/server";
import { documentsStore } from "@/lib/db/documentsStore";
import { botsStore } from "@/lib/db/botsStore";
import { requireAuth, requireOrgRole, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";
import { validateProhibitedContent } from "@/lib/security/contentModeration";
import {
  enforceRateLimit,
  applyRateLimitHeaders,
  getAiResourceLimits,
} from "@/lib/security/rateLimitPolicy";

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

/**
 * Lightweight readable text extractor for PDF binary buffers when raw `.text()` yields `%PDF-` stream markers.
 */
function extractReadableTextFromBuffer(buffer, rawText = "") {
  if (!rawText.startsWith("%PDF-")) {
    return rawText;
  }
  const latin = buffer.toString("latin1");
  const pieces = [];
  // Extract parenthesized PDF text strings (...) inside BT..ET blocks and TJ/Tj operators
  const textMatches = latin.matchAll(/\(([^()\\]{2,200}(?:\\.[^()\\]*)*)\)\s*(?:Tj|'|")/g);
  for (const m of textMatches) {
    const cleaned = m[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/[^\x20-\x7E\n]/g, " ")
      .trim();
    if (cleaned.length > 1) pieces.push(cleaned);
  }

  const tjArrayMatches = latin.matchAll(/\[([^\]]{3,600})\]\s*TJ/g);
  for (const arrMatch of tjArrayMatches) {
    const inner = [...arrMatch[1].matchAll(/\(([^()\\]+(?:\\.[^()\\]*)*)\)/g)]
      .map((x) => x[1].replace(/[^\x20-\x7E]/g, ""))
      .join("");
    if (inner.trim().length > 1) pieces.push(inner.trim());
  }

  const joined = pieces.join(" ").replace(/\s+/g, " ").trim();
  return joined;
}

async function resolveAuthorizedBot(botId, principal) {
  const isSuperAdmin = isPlatformSuperAdmin(principal);

  // Allow dashboard Knowledge page fallback "default" / "bot_sales_01" ONLY to resolve caller's own first bot
  if ((botId === "default" || botId === "bot_sales_01") && principal.organizationId) {
    const ownBots =
      (await botsStore.getBotsAsync(principal.organizationId)) ||
      botsStore.getBots(principal.organizationId);
    if (ownBots && ownBots.length > 0) {
      return ownBots[0];
    }
  }

  const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
  if (!bot) return null;

  // Strict tenant boundary check (SEC-07 — never mutate bot.organizationId!)
  if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
    return null;
  }

  return bot;
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { botId } = await params;

    const bot = await resolveAuthorizedBot(botId, principal);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const docs = documentsStore.getDocuments(bot.id);
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

    const bot = await resolveAuthorizedBot(botId, principal);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const rateCheck = await enforceRateLimit(
      "file_upload",
      principal.organizationId || principal.userId
    );
    if (!rateCheck.ok) return rateCheck.response;

    const { maxDocumentBytes } = getAiResourceLimits();
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { id, name, content, type } = body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return NextResponse.json({ success: false, error: "Document content cannot be empty" }, { status: 400 });
      }
      if (Buffer.byteLength(content, "utf8") > maxDocumentBytes) {
        return NextResponse.json(
          { success: false, error: `Document exceeds maximum size of ${Math.round(maxDocumentBytes / (1024 * 1024))}MB.` },
          { status: 413 }
        );
      }

      // If base64 data URL was passed from wizard file input, decode cleanly
      let normalizedContent = content.trim();
      if (/^data:[^;]+;base64,/i.test(normalizedContent)) {
        const b64Part = normalizedContent.split(",")[1] || "";
        const buf = Buffer.from(b64Part, "base64");
        const rawUtf8 = buf.toString("utf8");
        normalizedContent = extractReadableTextFromBuffer(buf, rawUtf8);
        if (!normalizedContent || normalizedContent.length < 10) {
          return NextResponse.json(
            {
              success: false,
              error: "Could not extract readable text from binary file. Please upload a text-based PDF, Markdown (.md), TXT, or CSV file.",
            },
            { status: 400 }
          );
        }
      }

      const contentCheck = validateProhibitedContent({ name, content: normalizedContent });
      if (!contentCheck.ok) {
        return NextResponse.json(
          {
            success: false,
            error: contentCheck.error,
            code: "PROHIBITED_CATEGORY_VIOLATION",
            category: contentCheck.violation,
          },
          { status: 400 }
        );
      }

      const doc = documentsStore.addDocument({
        id,
        botId: bot.id,
        name: name?.trim().slice(0, 180) || "Custom Business Knowledge",
        content: normalizedContent,
        type: type || "Document",
      });
      return applyRateLimitHeaders(NextResponse.json({ success: true, document: doc }), rateCheck.result);
    }

    // FormData upload
    const formData = await request.formData();
    const file = formData.get("file");
    const manualContent = formData.get("content");
    const manualName = formData.get("name");

    let textContent = typeof manualContent === "string" ? manualContent : "";
    const fileName = (manualName || file?.name || "Uploaded Document").toString().slice(0, 180);

    if (file && typeof file.arrayBuffer === "function") {
      const buf = Buffer.from(await file.arrayBuffer());
      if (buf.length > maxDocumentBytes) {
        return NextResponse.json(
          { success: false, error: `Uploaded file exceeds ${Math.round(maxDocumentBytes / (1024 * 1024))}MB limit.` },
          { status: 413 }
        );
      }
      const rawUtf8 = buf.toString("utf8");
      const extracted = extractReadableTextFromBuffer(buf, rawUtf8);
      if (extracted && extracted.trim()) {
        textContent = extracted;
      }
    }

    if (!textContent || !textContent.trim() || textContent.startsWith("%PDF-")) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not extract selectable text from document. Please upload a text-based PDF, TXT, MD, or paste text directly.",
        },
        { status: 400 }
      );
    }

    const contentCheck = validateProhibitedContent({ name: fileName, content: textContent });
    if (!contentCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: contentCheck.error,
          code: "PROHIBITED_CATEGORY_VIOLATION",
          category: contentCheck.violation,
        },
        { status: 400 }
      );
    }

    const doc = documentsStore.addDocument({
      botId: bot.id,
      name: fileName,
      content: textContent.trim(),
      type: fileName.split(".").pop()?.toUpperCase() || "Document",
    });

    return applyRateLimitHeaders(NextResponse.json({ success: true, document: doc }), rateCheck.result);
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

    const bot = await resolveAuthorizedBot(botId, principal);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id, name, content, type } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Document id is required" }, { status: 400 });
    }

    const existing = documentsStore.getDocumentById(id);
    if (!existing || existing.botId !== bot.id) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const { maxDocumentBytes } = getAiResourceLimits();
    if (content !== undefined && Buffer.byteLength(String(content), "utf8") > maxDocumentBytes) {
      return NextResponse.json({ success: false, error: "Document content exceeds size limit." }, { status: 413 });
    }

    // Enforce Acceptable Use Policy on edits too (SEC-18)
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

    const bot = await resolveAuthorizedBot(botId, principal);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const docId = url.searchParams.get("id");

    if (!docId) {
      return NextResponse.json({ success: false, error: "Document id query parameter is required" }, { status: 400 });
    }

    const existing = documentsStore.getDocumentById(docId);
    if (!existing || (existing.botId !== bot.id && !isPlatformSuperAdmin(principal))) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    documentsStore.deleteDocument(docId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
