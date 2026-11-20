import { botsStore } from "@/lib/db/botsStore";
import { conversationsStore } from "@/lib/db/conversationsStore";
import { visitorsStore } from "@/lib/db/visitorsStore";
import { sseBroker } from "@/lib/db/sseBroker";
import { sseTicketStore } from "@/lib/security/sseTicketStore";
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

function jsonError(message, status, request) {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify({ error: message }), { status, headers });
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
    return jsonError("Bot not found", 404, request);
  }

  // Enforce allowedDomains before attaching credentialed CORS headers (SEC-15)
  const originHeader = request.headers.get("origin") || request.headers.get("referer");
  const allowedDomains =
    !bot.allowedDomains || !Array.isArray(bot.allowedDomains) || bot.allowedDomains.length === 0
      ? ["*"]
      : bot.allowedDomains;
  const domainCheck = checkDomainAuthorization(originHeader, allowedDomains);
  if (!domainCheck.allowed) {
    return jsonError("Unauthorized domain for widget events.", 403, request);
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId || conversationId.length > 128) {
    return jsonError("Valid conversationId is required", 400, request);
  }

  // Strict visitor authentication first: resolve via single-use ticket or authenticated credential (SEC-02)
  const ticket = searchParams.get("ticket");
  let resolvedVisitorId = null;

  if (ticket) {
    const consumed = await sseTicketStore.consumeTicket(bot.id, ticket);
    if (!consumed) {
      return jsonError("Invalid or expired exchange ticket", 403, request);
    }
    resolvedVisitorId = consumed.visitorId;
  } else {
    const token = extractVisitorToken(request, bot.id);
    if (!token) {
      return jsonError("Visitor token is required to access conversation events", 403, request);
    }
    const visitor =
      (await visitorsStore.getVisitorByTokenAsync(bot.id, token)) ||
      visitorsStore.getVisitorByToken(bot.id, token);
    if (!visitor) {
      return jsonError("Invalid or expired visitor token", 403, request);
    }
    resolvedVisitorId = visitor.id;
  }

  // Verify conversation exists and belongs to this bot (SEC-02 / SEC-15)
  const conv = conversationsStore.getConversation(conversationId);
  if (!conv || (conv.botId && conv.botId !== bot.id)) {
    return jsonError("Conversation not found for this chatbot", 404, request);
  }

  if (conv.visitorId && resolvedVisitorId !== conv.visitorId) {
    return jsonError("Unauthorized visitor token for conversation", 403, request);
  }

  if (!conv.visitorId) {
    conv.visitorId = resolvedVisitorId;
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
