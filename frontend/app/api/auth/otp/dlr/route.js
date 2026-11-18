import { NextResponse } from "next/server";
import { smsService } from "@/lib/auth/smsService";
import {
  extractClientIp,
  enforceRateLimit,
  applyRateLimitHeaders,
} from "@/lib/security/rateLimitPolicy";

export async function GET(request) {
  try {
    const clientIp = extractClientIp(request);
    const ipCheck = await enforceRateLimit("ip_general", `dlr:${clientIp}`, {
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!ipCheck.ok) return ipCheck.response;

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId || messageId.length > 80 || !/^[a-zA-Z0-9._-]+$/.test(messageId)) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { success: false, error: "Valid messageId is required." },
          { status: 400 }
        ),
        ipCheck.result
      );
    }

    const dlr = await smsService.getDeliveryStatus(messageId);
    return applyRateLimitHeaders(
      NextResponse.json({
        success: true,
        messageId,
        status: dlr.status || "queued",
        stat: dlr.stat || "SUBMITTED",
        deliveredAt: dlr.deliveredAt || null,
        err: dlr.err || null,
      }),
      ipCheck.result
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to query delivery status." },
      { status: 500 }
    );
  }
}
