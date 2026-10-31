import { NextResponse } from "next/server";
import { botsStore } from "@/lib/db/botsStore";

function corsResponse(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Bot-Id");
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
          primaryColor:
            !bot.primaryColor || bot.primaryColor === "#4f46e5" || bot.primaryColor === "#6366f1"
              ? "#B68A55"
              : bot.primaryColor,
          welcomeMessage: bot.welcomeMessage || `Hello! I am ${bot.name}. How can I help you today?`,
          launcherPosition: bot.launcherPosition || "bottom-right",
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
