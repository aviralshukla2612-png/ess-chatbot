import { NextResponse } from "next/server";
import { requireAuth, isPlatformSuperAdmin, ROLES } from "@/lib/auth/guard";
import { botsStore } from "@/lib/db/botsStore";
import { sseBroker } from "@/lib/db/sseBroker";
import { queryDb } from "@/lib/db/dbPool";

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { principal } = auth;
    const isSuperAdmin = isPlatformSuperAdmin(principal);

    const { botId } = await params;
    const resolvedBotId = botId === "aa" ? "bot_aa" : botId;
    const bot = (await botsStore.getBotAsync(resolvedBotId)) || botsStore.getBot(resolvedBotId);

    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    // Enforce tenant ownership boundary (SEC-09)
    if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      botId: bot.id,
      botName: bot.name,
      globalBotEnabled: bot.globalBotEnabled !== false,
      fallbackMessage:
        bot.fallbackMessage ||
        "Our automated assistant is temporarily paused. A team member will assist you shortly.",
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
    const { botId } = await params;

    const isSuperAdmin = isPlatformSuperAdmin(principal);
    const isAuthorized =
      isSuperAdmin ||
      principal.orgRole === ROLES.ORG_OWNER ||
      principal.orgRole === ROLES.ORG_ADMIN;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only workspace Admins and Owners can modify global bot settings." },
        { status: 403 }
      );
    }

    const resolvedBotId = botId === "aa" ? "bot_aa" : botId;
    const bot = (await botsStore.getBotAsync(resolvedBotId)) || botsStore.getBot(resolvedBotId);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    // Enforce tenant ownership boundary (SEC-09)
    if (!isSuperAdmin && bot.organizationId !== principal.organizationId) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const globalBotEnabled = Boolean(body.globalBotEnabled !== false);
    const fallbackMessage =
      typeof body.fallbackMessage === "string" && body.fallbackMessage.trim()
        ? body.fallbackMessage.trim().slice(0, 500)
        : bot.fallbackMessage ||
          "Our automated assistant is temporarily paused. A team member will assist you shortly.";

    const updated = await botsStore.updateBotAsync(resolvedBotId, {
      globalBotEnabled,
      fallbackMessage,
    });

    try {
      await queryDb(
        `UPDATE "Bot"
         SET "globalBotEnabled" = $1, "fallbackMessage" = $2, "updatedAt" = NOW()
         WHERE "id" = $3 AND ($4::text IS NULL OR "organizationId" = $4);`,
        [globalBotEnabled, fallbackMessage, resolvedBotId, isSuperAdmin ? null : principal.organizationId]
      );
    } catch {}

    sseBroker.broadcast("bot:global_status_changed", {
      botId: resolvedBotId,
      organizationId: bot.organizationId,
      globalBotEnabled,
      fallbackMessage,
      updatedBy: principal.email,
    });

    return NextResponse.json({
      success: true,
      bot: updated,
      globalBotEnabled,
      fallbackMessage,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
