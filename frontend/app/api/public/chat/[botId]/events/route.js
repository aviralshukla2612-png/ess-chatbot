import { botsStore } from "@/lib/db/botsStore";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { sseBroker } from "@/lib/db/sseBroker";

function getCorsOrigin(request) {
  if (!request) return "*";
  try {
    const origin = request.headers?.get?.("origin");
    if (origin && origin !== "null") return origin;
    const referer = request.headers?.get?.("referer");
    if (referer) {
      const u = new URL(referer);
      return u.origin;
    }
  } catch (e) {}
  return "*";
}

function corsHeaders(request) {
  const allowOrigin = getCorsOrigin(request);
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Bot-Id, X-Visitor-Token, Accept");
  if (allowOrigin !== "*") {
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  return headers;
}

export async function OPTIONS(request) {
  const headers = corsHeaders(request);
  return new Response(null, { status: 204, headers });
}

export async function GET(request, { params }) {
  const { botId } = await params;
  const resolvedBotId = botId === "aa" ? "bot_aa" : botId;
  const bot = (await botsStore.getBotAsync(resolvedBotId)) || botsStore.getBot(resolvedBotId);
  if (!bot) {
    return new Response(JSON.stringify({ error: "Bot not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    return new Response(JSON.stringify({ error: "conversationId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate conversation exists and belongs to this bot
  const conv = conversationsStore.getConversation(conversationId);
  if (!conv || (conv.botId && conv.botId !== bot.id && conv.botId !== resolvedBotId)) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let unsubscribe;
  let heartbeatInterval;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial connected event for visitor
      const initPayload = JSON.stringify({
        type: "visitor_connected",
        conversationId,
        handlingMode: conv.handlingMode || "AI",
        status: conv.status || "AI_ACTIVE",
        assignedToName: conv.assignedToName || "",
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`event: message\ndata: ${initPayload}\n\n`));

      // Subscribe to sseBroker scoped strictly to this conversationId
      unsubscribe = sseBroker.subscribe(controller, {
        conversationId,
        isVisitor: true,
      });

      // Keep-alive heartbeat every 15 seconds
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch (e) {
          clearInterval(heartbeatInterval);
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
        }
      }, 15000);
      if (typeof heartbeatInterval.unref === "function") {
        heartbeatInterval.unref();
      }
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  const responseHeaders = corsHeaders(request);
  responseHeaders.set("Content-Type", "text/event-stream; charset=utf-8");
  responseHeaders.set("Cache-Control", "no-cache, no-transform, no-store");
  responseHeaders.set("Connection", "keep-alive");
  responseHeaders.set("X-Accel-Buffering", "no");

  return new Response(stream, { headers: responseHeaders });
}

