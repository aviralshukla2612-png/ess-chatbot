import { botsStore } from "@/lib/db/botsStore";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { visitorsStore } from "@/lib/db/visitorsStore";
import { sseBroker } from "@/lib/db/sseBroker";
import { checkDomainAuthorization } from "@/lib/security/domainGuard";
import { extractClientIp, enforceRateLimit } from "@/lib/security/rateLimitPolicy";

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
  } catch {}
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

function extractVisitorToken(request, botId) {
  const cleanId = (botId || "default").replace(/[^a-zA-Z0-9_]/g, "_");
  const cookieVal = request.cookies?.get?.(`ess_visitor_${cleanId}`)?.value;
  if (cookieVal && cookieVal.length >= 16) return cookieVal.trim();
  const headerVal = request.headers.get("x-visitor-token");
  if (headerVal && headerVal.length >= 16) return headerVal.trim();
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get("visitorToken");
  if (queryToken && queryToken.length >= 16) return queryToken.trim();
  return null;
}

export async function OPTIONS(request) {
  const headers = corsHeaders(request);
  return new Response(null, { status: 204, headers });
}

export async function GET(request, { params }) {
  const { botId } = await params;

  const clientIp = extractClientIp(request);
  const ipCheck = await enforceRateLimit("public_session_ip", `events:${clientIp}:${botId}`);
  if (!ipCheck.ok) return ipCheck.response;

  const resolvedBotId = botId === "aa" ? "bot_aa" : botId;
  const bot = (await botsStore.getBotAsync(resolvedBotId)) || botsStore.getBot(resolvedBotId);
  if (!bot) {
    return new Response(JSON.stringify({ error: "Bot not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Enforce allowedDomains before attaching credentialed CORS headers (SEC-15)
  const originHeader = request.headers.get("origin") || request.headers.get("referer");
  const allowedDomains =
    !bot.allowedDomains || !Array.isArray(bot.allowedDomains) || bot.allowedDomains.length === 0
      ? ["*"]
      : bot.allowedDomains;
  const domainCheck = checkDomainAuthorization(originHeader, allowedDomains);
  if (!domainCheck.allowed) {
    return new Response(
      JSON.stringify({ error: `Unauthorized domain for widget events.` }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId || conversationId.length > 128) {
    return new Response(JSON.stringify({ error: "Valid conversationId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify conversation belongs to this bot & verify visitor token if bound (SEC-15)
  const conv = conversationsStore.getConversation(conversationId);
  if (conv && conv.botId && conv.botId !== bot.id) {
    return new Response(JSON.stringify({ error: "Conversation not found for this chatbot" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (conv && conv.visitorId) {
    const token = extractVisitorToken(request, bot.id);
    if (token) {
      const visitor =
        (await visitorsStore.getVisitorByTokenAsync(bot.id, token)) ||
        visitorsStore.getVisitorByToken(bot.id, token);
      if (!visitor || visitor.id !== conv.visitorId) {
        return new Response(JSON.stringify({ error: "Unauthorized visitor token for conversation" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  const handlingMode = conv?.handlingMode || "AI";
  const status = conv?.status || "AI_ACTIVE";
  const assignedToName = conv?.assignedToName || "";

  let unsubscribe;
  let heartbeatInterval;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const initPayload = JSON.stringify({
        type: "visitor_connected",
        conversationId,
        handlingMode,
        status,
        assignedToName,
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`event: message\ndata: ${initPayload}\n\n`));

      unsubscribe = sseBroker.subscribe(controller, {
        conversationId,
        isVisitor: true,
      });

      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
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
