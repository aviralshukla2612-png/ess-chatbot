import { NextResponse } from "next/server";
import { botsStore } from "@/lib/db/botsStore";
import { visitorsStore } from "@/lib/db/visitorsStore";
import { sseTicketStore } from "@/lib/security/sseTicketStore";
import { checkDomainAuthorization } from "@/lib/security/domainGuard";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
} from "@/lib/security/rateLimitPolicy";

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

function corsResponse(res, request = null) {
  const allowOrigin = getCorsOrigin(request);
  res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Bot-Id, X-Visitor-Token, Accept");
  if (allowOrigin !== "*") {
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export async function OPTIONS(request) {
  return corsResponse(new NextResponse(null, { status: 204 }), request);
}

function extractVisitorToken(request, botId, body = null) {
  const cleanId = (botId || "default").replace(/[^a-zA-Z0-9_]/g, "_");
  const cookieVal = request.cookies?.get?.(`ess_visitor_${cleanId}`)?.value;
  if (cookieVal && cookieVal.length >= 16) return cookieVal.trim();

  const headerVal = request.headers.get("x-visitor-token");
  if (headerVal && headerVal.length >= 16) return headerVal.trim();

  if (body && body.visitorToken && typeof body.visitorToken === "string" && body.visitorToken.length >= 16) {
    return body.visitorToken.trim();
  }

  return null;
}

/**
 * POST /api/public/chat/[botId]/ticket
 * Exchanges authenticated visitor token for a 60-second single-use SSE ticket (SEC-02).
 */
export async function POST(request, { params }) {
  try {
    const { botId } = await params;
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("public_session_ip", `tkt:${clientIp}:${botId}`);
    if (!ipCheck.ok) return corsResponse(ipCheck.response, request);

    const resolvedBotId = botId === "aa" ? "bot_aa" : botId;
    const bot = (await botsStore.getBotAsync(resolvedBotId)) || botsStore.getBot(resolvedBotId);
    if (!bot || bot.status === "Inactive" || bot.status === "Deleted") {
      return corsResponse(
        applyRateLimitHeaders(
          NextResponse.json({ success: false, error: "Bot not found" }, { status: 404 }),
          ipCheck.result
        ),
        request
      );
    }

    const originHeader = request.headers.get("origin") || request.headers.get("referer");
    const allowedDomains =
      !bot.allowedDomains || !Array.isArray(bot.allowedDomains) || bot.allowedDomains.length === 0
        ? ["*"]
        : bot.allowedDomains;
    const domainCheck = checkDomainAuthorization(originHeader, allowedDomains);
    if (!domainCheck.allowed) {
      return corsResponse(
        applyRateLimitHeaders(
          NextResponse.json({ success: false, error: "Unauthorized domain origin" }, { status: 403 }),
          ipCheck.result
        ),
        request
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawToken = extractVisitorToken(request, bot.id, body);
    if (!rawToken) {
      return corsResponse(
        applyRateLimitHeaders(
          NextResponse.json({ success: false, error: "Visitor credentials required" }, { status: 401 }),
          ipCheck.result
        ),
        request
      );
    }

    const visitor =
      (await visitorsStore.getVisitorByTokenAsync(bot.id, rawToken)) ||
      visitorsStore.getVisitorByToken(bot.id, rawToken);

    if (!visitor) {
      return corsResponse(
        applyRateLimitHeaders(
          NextResponse.json({ success: false, error: "Invalid or expired visitor credentials" }, { status: 403 }),
          ipCheck.result
        ),
        request
      );
    }

    // Issue 60-second single-use ticket
    const ticket = await sseTicketStore.createTicket(bot.id, visitor.id, 60);

    return corsResponse(
      applyRateLimitHeaders(
        NextResponse.json({
          success: true,
          ticket,
          expiresIn: 60,
        }),
        ipCheck.result
      ),
      request
    );
  } catch (err) {
    return corsResponse(
      NextResponse.json({ success: false, error: err.message }, { status: 500 }),
      request
    );
  }
}
