import { NextResponse } from "next/server";
import { botsStore } from "@/lib/db/botsStore";

function corsResponse(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Bot-Id");
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 204 }));
}

export async function GET(request, { params }) {
  try {
    const { botId } = await params;
    const resolvedBotId = botId === "aa" ? "bot_aa" : botId;

    let bot = (await botsStore.getBotAsync(resolvedBotId)) || botsStore.getBot(resolvedBotId);
    if (!bot || bot.status === "Inactive" || bot.status === "Deleted") {
      console.warn(`[WIDGET_CONFIG_404] botId='${botId}', resolved='${resolvedBotId}', found=${Boolean(bot)}, status=${bot?.status}`);
      return corsResponse(
        NextResponse.json({ success: false, error: "Chatbot not found or inactive" }, { status: 404 })
      );
    }

    const defaultQuickReplies = [
      "Website Development",
      "Mobile Application",
      "AI Chatbot & RAG",
      "Custom Software & ERP",
      "UI/UX Design",
      "Cloud & DevOps",
      "Hire Dedicated Developers",
    ];

    return corsResponse(
      NextResponse.json({
        success: true,
        bot: {
          id: bot.id,
          name: bot.name || "AI Assistant",
          avatar: bot.avatar || "🤖",
          primaryColor: bot.primaryColor
            ? (bot.primaryColor.startsWith("#") ? bot.primaryColor : `#${bot.primaryColor}`)
            : "#B68A55",
          welcomeMessage: bot.welcomeMessage || `Hello! I am ${bot.name}. How can I help you today?`,
          launcherPosition: bot.launcherPosition || "bottom-right",
          launcherShape: bot.launcherShape || "circle",
          launcherSize: bot.launcherSize || "medium",
          launcherIcon: bot.launcherIcon || "bubble",
          launcherLogoUrl: bot.launcherLogoUrl || "",
          launcherText: bot.launcherText || "",
          launcherColor: bot.launcherColor || null,
          launcherMarginBottom: Number.isFinite(Number(bot.launcherMarginBottom)) ? Number(bot.launcherMarginBottom) : 24,
          launcherMarginRight: Number.isFinite(Number(bot.launcherMarginRight)) ? Number(bot.launcherMarginRight) : 24,
          launcherMarginLeft: Number.isFinite(Number(bot.launcherMarginLeft)) ? Number(bot.launcherMarginLeft) : 24,
          launcherMarginTop: Number.isFinite(Number(bot.launcherMarginTop)) ? Number(bot.launcherMarginTop) : 24,
          brandingEnabled: bot.brandingEnabled !== false,
          placeholderText: bot.placeholderText || "Type your message...",
          quickReplies:
            Array.isArray(bot.quickReplies) && bot.quickReplies.length > 0
              ? bot.quickReplies
              : (bot.id === "bot_aa" || bot.name === "aa" || !bot.quickReplies ? defaultQuickReplies : []),
        },
      })
    );
  } catch (err) {
    return corsResponse(
      NextResponse.json({ success: false, error: err.message }, { status: 500 })
    );
  }
}
