import { NextResponse } from "next/server";
import { botsStore } from "@/lib/db/botsStore";
import { requireAuth, requireOrgRole, ROLES } from "@/lib/auth/guard";

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

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

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

    if (body.phoneNumber || body.phone) {
      const raw = (body.phoneNumber || body.phone || "").trim();
      const digitCount = (raw.match(/\d/g) || []).length;
      body.phoneNumber = digitCount >= 7 ? raw : null;
    }
    if (body.company && typeof body.company === "string") {
      body.company = body.company.trim();
    }
    if (body.websiteUrl && typeof body.websiteUrl === "string" && body.websiteUrl.trim()) {
      const { validateUrlForSSRF } = await import("@/lib/security/ssrf");
      const ssrfCheck = await validateUrlForSSRF(body.websiteUrl.trim());
      if (!ssrfCheck.valid) {
        return NextResponse.json({ success: false, error: ssrfCheck.error }, { status: 400 });
      }
      body.websiteUrl = ssrfCheck.normalizedUrl;
    }

    const bot = botsStore.upsertBot({ ...existingBot, ...body, id: botId, organizationId: targetOrgId }, targetOrgId);
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

    const isSuperAdmin =
      principal.platformRole === ROLES.SUPER_ADMIN ||
      principal.orgRole === ROLES.SUPER_ADMIN;

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
