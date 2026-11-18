import { NextResponse } from "next/server";
import { botsStore } from "@/lib/db/botsStore";
import { requireAuth, requireOrgRole, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";
import { validateProhibitedContent } from "@/lib/security/contentModeration";

const TENANT_MUTABLE_BOT_FIELDS = [
  "name",
  "company",
  "description",
  "industry",
  "avatar",
  "primaryColor",
  "welcomeMessage",
  "placeholderText",
  "systemPrompt",
  "instructions",
  "collectLeads",
  "allowedDomains",
  "quickReplies",
  "starterQuestions",
  "websiteUrl",
  "phoneNumber",
  "webhookUrl",
  "webhookSecret",
  "fallbackMessage",
  "globalBotEnabled",
  "brandingEnabled",
  "launcherPosition",
  "launcherShape",
  "launcherSize",
  "launcherIcon",
  "launcherLogoUrl",
  "launcherText",
  "launcherMarginBottom",
  "launcherMarginRight",
  "launcherMarginLeft",
  "launcherMarginTop",
  "launcherAnimation",
];

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const { botId } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);

    const bot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, bot });
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
    const body = await request.json();

    const isSuperAdmin = isPlatformSuperAdmin(principal);

    const existingBot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!existingBot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    if (!isSuperAdmin && existingBot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const targetOrgId = isSuperAdmin
      ? (body.organizationId || existingBot.organizationId)
      : principal.organizationId;

    // Whitelist mutable fields & prevent non-SuperAdmin from unblocking Suspended/Blocked bots (SEC-16)
    const safeUpdates = {};
    for (const key of TENANT_MUTABLE_BOT_FIELDS) {
      if (body[key] !== undefined) {
        safeUpdates[key] = body[key];
      }
    }

    if (body.status !== undefined) {
      if (isSuperAdmin) {
        safeUpdates.status = body.status;
      } else if (existingBot.status === "Blocked" || existingBot.status === "Suspended") {
        return NextResponse.json(
          { success: false, error: "Forbidden: This chatbot has been suspended by platform administration." },
          { status: 403 }
        );
      } else if (["Active", "Inactive", "Draft"].includes(body.status)) {
        safeUpdates.status = body.status;
      }
    }

    if (body.phoneNumber || body.phone) {
      const raw = (body.phoneNumber || body.phone || "").trim();
      const digitCount = (raw.match(/\d/g) || []).length;
      safeUpdates.phoneNumber = digitCount >= 7 ? raw : null;
    }
    if (safeUpdates.company && typeof safeUpdates.company === "string") {
      safeUpdates.company = safeUpdates.company.trim().slice(0, 140);
    }
    if (safeUpdates.systemPrompt && typeof safeUpdates.systemPrompt === "string") {
      safeUpdates.systemPrompt = safeUpdates.systemPrompt.slice(0, 12000);
    }
    if (safeUpdates.instructions && typeof safeUpdates.instructions === "string") {
      safeUpdates.instructions = safeUpdates.instructions.slice(0, 12000);
    }

    if (safeUpdates.websiteUrl && typeof safeUpdates.websiteUrl === "string" && safeUpdates.websiteUrl.trim()) {
      const { validateUrlForSSRF } = await import("@/lib/security/ssrf");
      const ssrfCheck = await validateUrlForSSRF(safeUpdates.websiteUrl.trim());
      if (!ssrfCheck.valid) {
        return NextResponse.json({ success: false, error: ssrfCheck.error }, { status: 400 });
      }
      safeUpdates.websiteUrl = ssrfCheck.normalizedUrl;
    }

    // Validate outbound webhookUrl against SSRF (SEC-12)
    if (safeUpdates.webhookUrl && typeof safeUpdates.webhookUrl === "string" && safeUpdates.webhookUrl.trim()) {
      const { validateUrlForSSRF } = await import("@/lib/security/ssrf");
      const whCheck = await validateUrlForSSRF(safeUpdates.webhookUrl.trim());
      if (!whCheck.valid) {
        return NextResponse.json({ success: false, error: `Invalid webhook URL: ${whCheck.error}` }, { status: 400 });
      }
      safeUpdates.webhookUrl = whCheck.normalizedUrl;
    }

    if (safeUpdates.launcherMarginBottom !== undefined) safeUpdates.launcherMarginBottom = Number(safeUpdates.launcherMarginBottom) || 0;
    if (safeUpdates.launcherMarginRight !== undefined) safeUpdates.launcherMarginRight = Number(safeUpdates.launcherMarginRight) || 0;
    if (safeUpdates.launcherMarginLeft !== undefined) safeUpdates.launcherMarginLeft = Number(safeUpdates.launcherMarginLeft) || 0;
    if (safeUpdates.launcherMarginTop !== undefined) safeUpdates.launcherMarginTop = Number(safeUpdates.launcherMarginTop) || 0;

    // Strict Acceptable Use Policy: Permanent Ban on Gambling, Betting, and Adult Content
    const contentCheck = validateProhibitedContent({
      name: safeUpdates.name,
      company: safeUpdates.company,
      description: safeUpdates.description,
      systemPrompt: safeUpdates.systemPrompt,
      instructions: safeUpdates.instructions,
      welcomeMessage: safeUpdates.welcomeMessage,
      websiteUrl: safeUpdates.websiteUrl,
      allowedDomains: safeUpdates.allowedDomains,
    });
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

    const bot = botsStore.upsertBot(
      { ...existingBot, ...safeUpdates, id: botId, organizationId: targetOrgId },
      targetOrgId
    );
    return NextResponse.json({ success: true, bot });
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

    const isSuperAdmin = isPlatformSuperAdmin(principal);

    const existingBot = (await botsStore.getBotAsync(botId)) || botsStore.getBot(botId);
    if (!existingBot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    if (!isSuperAdmin && existingBot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    botsStore.deleteBot(botId, isSuperAdmin ? null : principal.organizationId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
