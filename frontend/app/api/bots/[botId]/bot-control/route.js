import { NextResponse } from "next/server";
import { requireAuth, ROLES } from "@/lib/auth/guard";
import { botsStore } from "@/lib/db/botsStore";
import { sseBroker } from "@/lib/db/sseBroker";
import { queryDb } from "@/lib/db/dbPool";

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const { botId } = await params;
    const resolvedBotId = botId === "aa" ? "bot_aa" : botId;
    const bot = (await botsStore.getBotAsync(resolvedBotId)) || botsStore.getBot(resolvedBotId);

    if (!bot) {
      return NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      botId: bot.id,
      botName: bot.name,
      globalBotEnabled: bot.globalBotEnabled !== false,
      fallbackMessage: bot.fallbackMessage || "Our automated assistant is temporarily paused. A team member will assist you shortly.",
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

    // RBAC: Only Admin, Owner, or Super Admin can toggle global bot status
    const isAuthorized =
      principal.platformRole === ROLES.SUPER_ADMIN ||
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

    const body = await request.json();
    const globalBotEnabled = Boolean(body.globalBotEnabled !== false);
    const fallbackMessage = typeof body.fallbackMessage === "string" && body.fallbackMessage.trim()
      ? body.fallbackMessage.trim()
      : (bot.fallbackMessage || "Our automated assistant is temporarily paused. A team member will assist you shortly.");

    const updated = await botsStore.updateBotAsync(resolvedBotId, {
      globalBotEnabled,
      fallbackMessage,
    });

    // Dual-write to PostgreSQL
    try {
      await queryDb(
        `UPDATE "Bot"
         SET "globalBotEnabled" = $1, "fallbackMessage" = $2, "updatedAt" = NOW()
         WHERE "id" = $3;`,
        [globalBotEnabled, fallbackMessage, resolvedBotId]
      );
    } catch (e) {}

    // Broadcast global status change to all agents and visitors
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

